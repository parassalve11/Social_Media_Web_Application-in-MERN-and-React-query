import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, ArrowLeft, Mail } from "lucide-react";
import axiosInstance from "../../lib/axiosIntance";
import Button from "../../components/UI/ButtonAnimatedGradient";
import { Input } from "../../components/UI/input";
import { useToast } from "../../components/UI/ToastManager";
import { validateEmail } from "../../lib/validation";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verify = async () => {
      try {
        await axiosInstance.post("/auth/verify", { token });
        setStatus("success");
        setMessage("Your email has been verified. You can now sign in.");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Verification failed.");
      }
    };

    verify();
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async (e) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setMessage(validationError);
      return;
    }
    try {
      await axiosInstance.post("/auth/resend-verification", { email: email.trim() });
      addToast("Verification email sent.", { type: "success", duration: 3000 });
      setCooldown(60);
    } catch (error) {
      addToast(error.response?.data?.message || "Unable to resend email.", {
        type: "error",
        duration: 3000,
      });
      if (error.response?.status === 429 && error.response?.data?.retryAfterSeconds) {
        setCooldown(error.response.data.retryAfterSeconds);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-[#fff1ad]/50 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/signin" className="p-2 rounded-lg bg-gray-100" aria-label="Go back">
            <ArrowLeft size={18} />
          </Link>
          {status === "success" ? (
            <CheckCircle2 className="text-green-600" size={28} />
          ) : (
            <AlertCircle className="text-amber-500" size={28} />
          )}
          <h1 className="text-xl font-bold">Email verification</h1>
        </div>

        <p className="text-sm text-gray-600 mb-6">{message}</p>

        {status === "success" ? (
          <Link to="/signin">
            <Button className="w-full bg-[#fff1ad] hover:bg-[#e6d89c] text-black">
              Continue to sign in
            </Button>
          </Link>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <label className="text-sm font-medium text-gray-700" htmlFor="resend-email">
              Resend verification email
            </label>
            <Input
              id="resend-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail />}
            />
            <Button
              type="submit"
              disabled={cooldown > 0}
              className="w-full bg-[#fff1ad] hover:bg-[#e6d89c] text-black"
            >
              {cooldown > 0 ? `Try again in ${cooldown}s` : "Resend email"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
