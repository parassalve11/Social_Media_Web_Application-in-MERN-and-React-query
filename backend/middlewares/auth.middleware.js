import jwt from 'jsonwebtoken'
import User from '../models/user.model.js';


export const protectRoute = async(req,res,next) =>{
    try {
        const token = req.cookies['jwt_social'];

        if(!token){
            return res.status(401).json({message:"Unauthorized token"})
        };

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({message:'Token not found'});
        };

        const user = await User.findById(decoded.userId).select("-password");

        if(!user){
            return res.status(400).json({message:"user not found"})
        };

        req.user = user;
        next()

    } catch (error) {
        console.log("Erorr in protect route MiddleWare",error.message);
        
        res.status(500).json({message:"Server Error"})
      
    }
}