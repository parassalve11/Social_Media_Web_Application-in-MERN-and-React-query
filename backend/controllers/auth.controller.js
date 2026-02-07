import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

import { AUTH_CONFIG } from "../lib/auth.config.js";
import { audit } from "../lib/audit.js";
import { setAuthCookies, clearAuthCookies } from "../lib/authCookies.js";
import { generateCsrfToken } from "../lib/csrf.js";
import { logError, logInfo, logWarn } from "../lib/logger.js";
import { comparePassword, hashPassword, validatePassword } from "../lib/password.js";
import { rateLimit } from "../lib/rateLimit.js";
import { createToken, hashToken } from "../lib/tokens.js";
import { getClientIp, isValidEmail, isValidUsername, normalizeEmail } from "../lib/validators.js";

const accessTokenExpiry = `${AUTH_CONFIG.accessTokenMinutes}m`;
const refreshTokenExpiry = `${AUTH_CONFIG.refreshTokenDays}d`;

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const verifyCaptcha = async (token, ip) => {
  if (!process.env.CAPTCHA_VERIFY_URL || !process.env.CAPTCHA_SECRET) {
    return true;
  }
  if (!token) return false;

  const response = await fetch(process.env.CAPTCHA_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.CAPTCHA_SECRET,
      response: token,
      remoteip: ip,
    }),
  });

  if (!response.ok) return false;
  const data = await response.json();
  return Boolean(data.success);
};

const issueTokens = async (user, res) => {
  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    getRefreshSecret(),
    { expiresIn: refreshTokenExpiry }
  );

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(
    Date.now() + AUTH_CONFIG.refreshTokenDays * 24 * 60 * 60 * 1000
  );
  await user.save();

  const csrfToken = generateCsrfToken();
  setAuthCookies({ res, accessToken, refreshToken, csrfToken });

  return { accessToken, csrfToken };
};

const recordAudit = (req, action, userId, metadata = {}) =>
  audit({
    action,
    userId,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] || "",
    metadata,
  });

export const signUp = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !username || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (!isValidUsername(username)) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters" });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({
        message: "Password is too weak",
        hints: passwordCheck.hints,
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already in use" });
    }

    const existingEmail = await User.findOne({ email: normalizedEmail }).select(
      "+verificationTokenHash +verificationTokenExpiresAt"
    );

    if (existingEmail) {
      if (!existingEmail.emailVerified) {
        const { token, tokenHash, expiresAt } = createToken(
          "verify",
          existingEmail._id,
          AUTH_CONFIG.verifyTokenMinutes
        );
        existingEmail.verificationTokenHash = tokenHash;
        existingEmail.verificationTokenExpiresAt = expiresAt;
        await existingEmail.save();
        await req.app.locals.emailService?.sendVerificationEmail({
          user: existingEmail,
          token,
        });
      }

      await recordAudit(req, "signup_existing_email", existingEmail._id);
      return res.status(200).json({
        message: "If your email is eligible, you'll receive verification steps.",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      name,
      username,
      email: normalizedEmail,
      password: hashedPassword,
      authSource: "local",
      emailVerified: false,
    });

    const { token, tokenHash, expiresAt } = createToken(
      "verify",
      user._id,
      AUTH_CONFIG.verifyTokenMinutes
    );
    user.verificationTokenHash = tokenHash;
    user.verificationTokenExpiresAt = expiresAt;

    await user.save();

    try {
      await req.app.locals.emailService?.sendVerificationEmail({
        user,
        token,
      });
      logInfo("email.verification.sent", { userId: user._id.toString() });
    } catch (error) {
      logWarn("email.verification.failed", { error: error.message });
    }

    await recordAudit(req, "signup", user._id);

    res.status(200).json({
      message: "If your email is eligible, you'll receive verification steps.",
    });
  } catch (error) {
    logError("auth.signup.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, username, identifier, password, captchaToken } = req.body;
    const loginIdentifier = normalizeEmail(email || identifier || username || "");
    const ip = getClientIp(req);

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const rateKey = `login:ip:${ip}`;
    const ipLimit = await rateLimit({
      key: rateKey,
      limit: AUTH_CONFIG.loginRateLimitPerIp,
      windowSeconds: AUTH_CONFIG.loginRateLimitWindowSec,
    });

    if (!ipLimit.allowed) {
      return res
        .status(429)
        .json({ message: "Too many login attempts. Try again later." });
    }

    const user =
      (await User.findOne({
        email: loginIdentifier,
      }).select("+password +refreshTokenHash +refreshTokenExpiresAt")) ||
      (await User.findOne({ username: loginIdentifier }).select(
        "+password +refreshTokenHash +refreshTokenExpiresAt"
      ));

    if (!user) {
      await recordAudit(req, "login_failed", null, { reason: "not_found" });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      await recordAudit(req, "login_locked", user._id);
      return res.status(423).json({
        message: "Account locked. Try again later.",
        lockedUntil: user.lockoutUntil,
      });
    }

    if (user.authSource !== "local") {
      await recordAudit(req, "login_failed", user._id, { reason: "wrong_source" });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const requireCaptcha =
      user.failedLoginAttempts >= Math.floor(AUTH_CONFIG.maxFailedLogins / 2);
    if (requireCaptcha) {
      const captchaOk = await verifyCaptcha(captchaToken, ip);
      if (!captchaOk) {
        return res.status(400).json({
          message: "Captcha verification required",
          code: "CAPTCHA_REQUIRED",
        });
      }
    }

    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= AUTH_CONFIG.maxFailedLogins) {
        user.lockoutUntil = new Date(
          Date.now() + AUTH_CONFIG.lockoutDurationMinutes * 60 * 1000
        );
      }
      await user.save();

      await recordAudit(req, "login_failed", user._id, { reason: "bad_password" });

      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      await recordAudit(req, "login_failed", user._id, { reason: "unverified" });
      return res.status(403).json({
        message: "Email not verified",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    const { accessToken } = await issueTokens(user, res);

    await recordAudit(req, "login_success", user._id);

    res.status(200).json({
      message: "Login successful",
      token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    logError("auth.signin.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { name, email, googleId } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !googleId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      if (user.authSource !== "google") {
        return res.status(401).json({
          message: "User registered with a different auth method",
        });
      }
      user.name = name;
      user.googleId = googleId;
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
    } else {
      let username = normalizedEmail.split("@")[0];
      let usernameExists = await User.findOne({ username });
      let suffix = 1;
      while (usernameExists) {
        username = `${normalizedEmail.split("@")[0]}${suffix}`;
        usernameExists = await User.findOne({ username });
        suffix += 1;
      }

      user = new User({
        name,
        email: normalizedEmail,
        googleId,
        username,
        authSource: "google",
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
    }

    await user.save();
    const { accessToken } = await issueTokens(user, res);

    await recordAudit(req, "google_auth", user._id);

    res.status(200).json({
      message: "Google authentication successful",
      token: accessToken,
    });
  } catch (error) {
    logError("auth.google.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const signOut = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, getRefreshSecret());
        const user = await User.findById(decoded.userId).select(
          "+refreshTokenHash +refreshTokenExpiresAt"
        );
        if (user) {
          user.refreshTokenHash = null;
          user.refreshTokenExpiresAt = null;
          await user.save();
        }
      } catch (error) {
        logWarn("auth.signout.refresh_clear_failed", { error: error.message });
      }
    }

    clearAuthCookies(res);
    res.status(200).json({ message: "Signed out" });
  } catch (error) {
    logError("auth.signout.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    logError("auth.me.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token invalid or expired",
        code: "TOKEN_INVALID_OR_EXPIRED",
      });
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.verificationTokenHash = null;
    user.verificationTokenExpiresAt = null;
    await user.save();

    await recordAudit(req, "email_verified", user._id);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    logError("auth.verify.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const identifier = req.body?.email || req.body?.identifier || req.body?.username || "";
    const normalizedEmail = normalizeEmail(identifier);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(200).json({
        message: "If your email is eligible, you'll receive verification steps.",
      });
    }

    const ip = getClientIp(req);
    const rateKey = `verify:resend:${normalizedEmail}:${ip}`;
    const limit = await rateLimit({
      key: rateKey,
      limit: 1,
      windowSeconds: AUTH_CONFIG.resendVerifyWindowSec,
    });
    if (!limit.allowed) {
      return res.status(429).json({
        message: "Please wait before requesting another email.",
        retryAfterSeconds: AUTH_CONFIG.resendVerifyWindowSec,
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.emailVerified) {
      return res.status(200).json({
        message: "If your email is eligible, you'll receive verification steps.",
      });
    }

    const { token, tokenHash, expiresAt } = createToken(
      "verify",
      user._id,
      AUTH_CONFIG.verifyTokenMinutes
    );
    user.verificationTokenHash = tokenHash;
    user.verificationTokenExpiresAt = expiresAt;
    await user.save();

    await req.app.locals.emailService?.sendVerificationEmail({ user, token });
    await recordAudit(req, "verification_resent", user._id);

    res.status(200).json({
      message: "If your email is eligible, you'll receive verification steps.",
    });
  } catch (error) {
    logError("auth.resend.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email || "");
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const ip = getClientIp(req);
    const rateKey = `reset:ip:${ip}`;
    const limit = await rateLimit({
      key: rateKey,
      limit: AUTH_CONFIG.resetRateLimitPerIp,
      windowSeconds: AUTH_CONFIG.resetRateLimitWindowSec,
    });
    if (!limit.allowed) {
      return res.status(429).json({
        message: "Too many reset requests. Try again later.",
      });
    }
    const emailKey = `reset:email:${normalizedEmail}`;
    const emailLimit = await rateLimit({
      key: emailKey,
      limit: 3,
      windowSeconds: AUTH_CONFIG.resetRateLimitWindowSec,
    });
    if (!emailLimit.allowed) {
      return res.status(429).json({
        message: "Too many reset requests. Try again later.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const { token, tokenHash, expiresAt } = createToken(
        "reset",
        user._id,
        AUTH_CONFIG.resetTokenMinutes
      );
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetTokenExpiresAt = expiresAt;
      await user.save();

      try {
        await req.app.locals.emailService?.sendPasswordResetEmail({
          user,
          token,
        });
        logInfo("email.reset.sent", { userId: user._id.toString() });
      } catch (error) {
        logWarn("email.reset.failed", { error: error.message });
      }

      await recordAudit(req, "password_reset_requested", user._id);
    }

    res.status(200).json({
      message: "If your email is registered, you'll receive reset instructions.",
    });
  } catch (error) {
    logError("auth.forgot.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and password required" });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({
        message: "Password is too weak",
        hints: passwordCheck.hints,
      });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Token invalid or expired",
        code: "TOKEN_INVALID_OR_EXPIRED",
      });
    }

    const isSamePassword = user.password
      ? await comparePassword(newPassword, user.password)
      : false;
    if (isSamePassword) {
      return res.status(400).json({ message: "Password must be new" });
    }

    user.password = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    await user.save();

    await recordAudit(req, "password_reset_completed", user._id);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    logError("auth.reset.error", { error: error.message });
    res.status(500).json({ message: "Server Error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, getRefreshSecret());
    const user = await User.findById(decoded.userId).select(
      "+refreshTokenHash +refreshTokenExpiresAt"
    );

    if (
      !user ||
      !user.refreshTokenHash ||
      user.refreshTokenHash !== hashToken(token) ||
      (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date())
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { accessToken } = await issueTokens(user, res);
    res.status(200).json({ token: accessToken });
  } catch (error) {
    logError("auth.refresh.error", { error: error.message });
    res.status(401).json({ message: "Unauthorized" });
  }
};
