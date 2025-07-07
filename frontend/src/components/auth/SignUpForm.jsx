import  { useState } from "react";

import { Input } from "../UI/input";
import Button from "../UI/ButtonAnimatedGradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import toast from "react-hot-toast";
import { Eye, EyeClosed, Loader2, Lock, Mail, User2, UserCheck2 } from "lucide-react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from "@react-oauth/google";
import useFormValidation from "../../hooks/useFormValidation";

const SignUpForm = () => {
 const { values, errors, handleChange, validateForm } = useFormValidation(
    "signup",
    { name:" ",username: "",email:"" ,  password: "" }
  );



  const [showPassword, setShowPassword] = useState(false);

  const[error,setError] = useState("");
  const{addToast} = useToast();

  const queryClient = useQueryClient();

  const { mutate: signUpMutation, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post('/auth/signup', data);
      return res;
    },
    onSuccess: () => {
      addToast("Signed Up successfully!", {
      type: "success",
      duration: 3000,
    });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
       
    },
    onError: (error) => {
       addToast("Something went wrong", {
      type: "error",
      duration: 3000,
    });
    setError(error);
      console.log(error);
    },
  });

  const { mutate: googleAuthMutation } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/google-auth", data);
      return res.data;
    },
    onSuccess: () => {
        addToast("Signed up with Google successfully!", {
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
    setError(error);
      console.error(error);
    },
  });

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { name, email, sub: googleId } = decoded;

      googleAuthMutation({ name, email, googleId });
    } catch (error) {
        addToast("Signed up with Google successfully!", {
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
    setError(error);
}

  const handleSignup = (e) => {
    e.preventDefault();
   if(validateForm()){
     signUpMutation(values);
   }
  };

  return (
   <div>
    <p className="text-red-600 font-medium text-xs text-center mb-2">{error}</p>
     <form onSubmit={handleSignup}>
      <div className="space-y-5">
        <div>
          <Input
            type="text"
            name='name'
            placeholder="Full name"
            onChange={handleChange}
            className="w-full"
            leftIcon={<UserCheck2 />}
            required
          />
           {errors.name && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.name}</p>
            )}
        </div>
        <div>
          <Input
            type="text"
            name='username'
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
            type="email"
            name='email'
            placeholder="Enter Your Email"
            className="w-full"
            onChange={handleChange}
            leftIcon={<Mail />}
            required
          />
           {errors.email && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.email}</p>
            )}
        </div>
        <div>
          <Input
          name='password'
            type={showPassword ? "text" : "password"}
            placeholder="Enter Your Password"
            className="w-full"
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
      <div className="space-y-3 mt-5">
        
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#fff1ad] hover:bg-[#e6d89c]  text-black"
        >
          {isPending ? <Loader2 className="animate-spin size-4" /> : "Signup"}
        </Button>
      </div>
    </form>
     <div className="mt-4 text-center w-full mx-auto flex items-center flex-col animate-fade-in-up animation-delay-400">
        <p className="text-sm text-gray-600 mb-2">Or sign up with</p>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_blue"
          shape="pill"
          width="300"
          text="signup_with"
        />
      </div>
   </div>
  );
};

export default SignUpForm;