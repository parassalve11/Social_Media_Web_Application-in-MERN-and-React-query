import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import axiosInstance from "../../lib/axiosIntance";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "../UI/ToastManager";
import { ArrowLeft, ChevronFirstIcon, Eye, EyeClosed, Loader2, Lock } from "lucide-react";
import { Input } from "../UI/input";
import Button from "../UI/ButtonAnimatedGradient";
import PasswordStrengthMeter from "../auth/PasswordStrengthMeter";
import { validatePassword } from "../../lib/validation";


export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confromPassword,setConfromPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword,setShowPassword] = useState(false)

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const queryClient = useQueryClient();

  const { addToast } = useToast();
  const { mutate: restPasswordMuation, isPending: isRestingPassword } =
    useMutation({
      mutationFn: async ({ token, password }) =>
        await axiosInstance.post(`/auth/reset`, { token, newPassword: password }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["authUser"] });
        addToast("Password changed successfully", {
          type: "success",
          duration: 3000,
        });

        setError("");
      },

      onError: (error) => {
        addToast("Error while resting the password", {
          type: "error",
          duration: 3000,
        });
        setError(error.response.data.message);
        console.log(error);
      },
    });

    const handleSubmit =(e) =>{
        e.preventDefault();
        const validationError = validatePassword(password);
        if (validationError) {
          setError(validationError);
          return;
        }
        if (matchError) {
          setError(matchError);
          return;
        }
        restPasswordMuation({ token, password })
    }

    const matchError = useMemo(() => {
      if (!token) return "Reset token missing or invalid.";
      if (confromPassword && confromPassword !== password) {
        return "Passwords do not match.";
      }
      return "";
    }, [password, confromPassword, token]);
  return (
    <div>
      <div className=" relative rounded-2xl  p-8">
        <div className="text-center  relative">
          <h1 className="text-xl  font-bold mb-3 md:text-4xl">
            Reset password
          </h1>
        </div>
        <Link to={"/signin"} className="absolute left-[-20px] top-0 ">
          <button type="button" className="p-2 rounded-lg bg-gray-100 ">
            <ArrowLeft size={20} />
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
        <label className="sr-only" htmlFor="reset-password">New password</label>
        <Input
          name='password'
            id="reset-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter Your Password"
            className="w-full"
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock />}
            rightIcon={
              showPassword ? (
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hide password">
                  <Eye />
                </button>
              ) : (
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Show password">
                  <EyeClosed />
                </button>
              )
            }
            required
            autoComplete="new-password"
          />

           
          </div>
          <PasswordStrengthMeter password={password} />
          <div>
        <label className="sr-only" htmlFor="reset-confirm">Confirm password</label>
        <Input
          name='conform-password'
            id="reset-confirm"
            type={"password"}
            placeholder="Confrom Your Password"
            className="w-full"
            onChange={(e) => setConfromPassword(e.target.value)}
            leftIcon={<ChevronFirstIcon />}
            
            required
            autoComplete="new-password"
          />

           
          </div>
        </div>
        <div className="space-y-3 mt-5">
          <Button
            type="submit"
            disabled={isRestingPassword || !token}
            className="w-full bg-[#fff1ad] hover:bg-[#e6d89c]  text-black"
          >
            {isRestingPassword ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <p className="text-sm flex items-center gap-2 ">
                Change
              </p>
            )}
          </Button>
        </div>
      </form>
        {(error || matchError) && (
              <p className="text-red-600 text-xs font-light mt-3" aria-live="polite">
                {matchError || error}
              </p>
            )}
    </div>
  );
}
