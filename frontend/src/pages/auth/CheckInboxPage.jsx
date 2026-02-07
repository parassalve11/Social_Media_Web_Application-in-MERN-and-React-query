import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";
import { Input } from "../../components/UI/input";
import Button from "../../components/UI/ButtonAnimatedGradient";
import { useToast } from "../../components/UI/ToastManager";
import { validateEmail } from "../../lib/validation";

const getStoredEmail = (type) =>
  type === "reset"
    ? localStorage.getItem("pending_reset_email")
    : localStorage.getItem("pending_verification_email");

const CheckInboxPage = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const type = searchParams.get("type") || "verify";
  const queryEmail = searchParams.get("email");
  const [email, setEmail] = useState(queryEmail || getStoredEmail(type) || "");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const resendMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = type === "reset" ? "/auth/forgot" : "/auth/resend-verification";
      return axiosInstance.post(endpoint, payload);
    },
    onSuccess: () => {
      addToast("Email sent. Please check your inbox.", {
        type: "success",
        duration: 3000,
      });
      const key =
        type === "reset"
          ? "pending_reset_email"
          : "pending_verification_email";
      localStorage.setItem(key, email.trim());
      setCooldown(60);
      setError("");
    },
    onError: (err) => {
      addToast(err.response?.data?.message || "Unable to resend email.", {
        type: "error",
        duration: 3000,
      });
      if (err.response?.status === 429 && err.response?.data?.retryAfterSeconds) {
        setCooldown(err.response.data.retryAfterSeconds);
      }
      setError(err.response?.data?.message || "Unable to resend email.");
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const description = useMemo(() => {
    if (type === "reset") {
      return "We sent a reset link to your email. Follow the link to set a new password.";
    }
    return "We sent a verification link to your email. Follow the link to activate your account.";
  }, [type]);

  const handleResend = (e) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    resendMutation.mutate({ email: email.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-[#fff1ad]/50 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to={type === "reset" ? "/forgot-password" : "/signin"}
            className="p-2 rounded-lg bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Mail size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Check your inbox</h1>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <label htmlFor="check-email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <Input
              id="check-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full mt-1"
              leftIcon={<Mail />}
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={cooldown > 0 || resendMutation.isPending}
            className="w-full bg-[#fff1ad] hover:bg-[#e6d89c] text-black"
          >
            {cooldown > 0 ? (
              `Resend available in ${cooldown}s`
            ) : (
              <span className="flex items-center justify-center gap-2 text-sm">
                Resend email <RefreshCw size={16} />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          Didn’t get the email? Check spam or try another address.
        </div>
      </div>
    </div>
  );
};

export default CheckInboxPage;
