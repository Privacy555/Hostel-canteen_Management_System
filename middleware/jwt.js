const jwt=require('jsonwebtoken');
require('dotenv').config();

const jwtAuthMiddleware= (req,res,next)=>{
    const authHeader =req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({error:"Token missing or incorrect format."});
    }
    const token= req.headers.authorization.split(" ")[1];
    if(!token){
        return res.status(401).json({error:"Unauthorized."});
    }

    try{
        const decoded= jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next();
    }catch(err){
        console.log(err);
        res.status(401).json({error:"Invalid token."});
    }
};


const generateToken=(payload)=>{
    return jwt.sign(payload,process.env.JWT_SECRET);
};

module.exports={jwtAuthMiddleware,generateToken};