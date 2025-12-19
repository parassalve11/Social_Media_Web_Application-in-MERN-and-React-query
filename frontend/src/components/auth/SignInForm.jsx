import { useState } from "react";

import { Input } from "../UI/input";
import Button from "../UI/ButtonAnimatedGradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeClosed,
  Loader2,
  Lock,
  User2,
} from "lucide-react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from "@react-oauth/google";
import useFormValidation from "../../hooks/useFormValidation";
import {Link} from "react-router-dom"


const SignInForm = () => {
 
  

  const [showPassword, setShowPassword] = useState(false);
  const[error,setError] = useState("")




  const queryClient = useQueryClient();

  const { addToast } = useToast();


   const { values, errors, handleChange, validateForm } = useFormValidation(
    "signin",
    { username: "", password: "" }
  );



  const { mutate: signInMutation, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/signin", data);
      console.log(res?.data);
      
      return res;
    },
    onSuccess: (data) => {
      addToast("Signed In successfully!", {
        type: "success",
        duration: 3000,
      });
      console.log("Onsucess",data);
      
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      addToast("Something went wrong", {
        type: "error",
        duration: 3000,
      });
     setError(error.message)
      console.log(error);
    },
  });
  const { mutate: googleAuthMutation } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/google-auth", data);
      return res.data;
    },
    onSuccess: () => {
      addToast("Signed In with Google successfully!", {
        type: "success",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      addToast("Something went wrong", {
        type: "error",
        duration: 3000,
      });
      setError(error.message)
      console.error(error);
    },
  });

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { name, email, sub: googleId } = decoded;

      googleAuthMutation({ name, email, googleId });
    } catch (error) {
      addToast("Signed In with Google successfully!", {
        type: "success",
        duration: 3000,
      });
      console.error(error);
    }
  };

  const handleGoogleError = () => {
    addToast("Something went wrong", {
      type: "error",
      duration: 3000,
    });
   
  };

  const handleSignup = (e) => {
    e.preventDefault();
    
    if(validateForm()){
      signInMutation(values)
    }
    
  };

  return (
    <div>
      <p className="text-red-600 font-medium text-center text-xs mb-2">
        {error}
      </p>
      <form onSubmit={handleSignup}>
        <div className="space-y-5">
          <div>
            <Input
              type="text"
              name="username"
              value={values.username}
              placeholder="Enter Your Username"
              className="w-full"
              onChange={handleChange}
              leftIcon={<User2 />}
              required
            />

           {errors.username && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Your Password"
              className="w-full"
              name="password"
              onChange={handleChange}
              leftIcon={<Lock />}
              rightIcon={
                showPassword ? (
                  <Eye onClick={() => setShowPassword(!showPassword)} />
                ) : (
                  <EyeClosed onClick={() => setShowPassword(!showPassword)} />
                )
              }
              required
            />
            {errors.password && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.password}</p>
            )}
          </div>
        </div>
        <Link to={'/forget-password/check'} className="flex items-center mt-auto">
          <p className="text-sm font-semibold text-blue-600 hover:cursor-pointer">Forget Password ?</p>
        </Link>
        <div className="space-y-3 mt-5">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#fff1ad] hover:bg-[#e6d89c]  text-black"
          >
            {isPending ? <Loader2 className="animate-spin size-4" /> : "Signin"}
          </Button>
        </div>
      </form>
      <div className="mt-4 text-center w-full mx-auto flex items-center flex-col animate-fade-in-up animation-delay-400">
        <p className="text-sm text-gray-600 mb-2">Or sign In with</p>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_blue"
          shape="pill"
          width="300"
          text="signIn_with"
        />
      </div>
    </div>
  );
};

export default SignInForm;
