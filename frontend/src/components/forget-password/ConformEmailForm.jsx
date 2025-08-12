import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react"
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import {useNavigate} from "react-router-dom"
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import { Input } from "../UI/input";
import Button from "../UI/ButtonAnimatedGradient";
import { Link } from "react-router-dom";


export default function ConformEmailForm() {

  const[error,setError] = useState("");
  const[email,setEmail] = useState("");

  const{addToast} = useToast();

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {mutate:conformEmailMutation,isPending} = useMutation({
    mutationFn:async(email) => await axiosInstance.post(`/auth/forget-password/check`,{email}),
    onSuccess:() =>{
      queryClient.invalidateQueries({queryKey:"authUser"})
      addToast("Otp is Send to Email" ,{
        type:"success",
        duration:3000
      });

      setError("")
      navigate(`/verify/${email}`)
    },
    onError:(error) =>{
        addToast("Email not exists" ,{
        type:"error",
        duration:3000
      });
      setError(error.response.data.message);
      console.log(error.message);
      
    }
  });

  const handleSubmit = (e) =>{
    e.preventDefault()
    conformEmailMutation(email);
  }

  return (
     <div>
         <div className=" relative rounded-2xl  p-8">
            <div className="text-center  relative">
              <h1 className="text-xl  font-bold mb-3 md:text-4xl">
                Verify your Email for Otp
              </h1>
          </div>
          <Link to={'/signin'} className="absolute left-[-20px] top-0 ">
              <button type="button"  className="p-2 rounded-lg bg-gray-100 "  ><ArrowLeft size={20} />
              
              </button>
              
          </Link>
        </div>
    
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <Input
              type="email"
              name="email"
              value={email}
              placeholder="Enter Your Username"
              className="w-full"
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail />}
              required
            />

           {error && (
              <p className="text-red-600 text-xs font-light mt-1">{error}</p>
            )}
          </div>

        </div>
        <div className="space-y-3 mt-5">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#fff1ad] hover:bg-[#e6d89c]  text-black"
          >
            {isPending ? <Loader2 className="animate-spin size-4" /> : <p className="text-sm flex items-center gap-2 ">Submit <ArrowRight size={20}/></p> }
          </Button>
        </div>
      </form>
     
    </div>
  )
}
