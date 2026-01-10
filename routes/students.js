const express=require('express');
const router=express.Router();

const Student=require('./../models/studentModel');
const FoodReview=require('./../models/foodReview');
const Complaint=require('./../models/complaints');

const { jwtAuthMiddleware, generateToken } = require('../middleware/jwt');

const allowedRole=require('./../middleware/roleMiddleware');

router.post('/login',async(req,res)=>{
    try{
        const {roll_no,password}=req.body;
        const user= await Student.findOne({roll_no}).select('+password');
        if(!user){
            return res.status(401).json({error:"Invalid roll_no provided."});
        }
        const isMatch=await user.comparePassword(password);
        if(!isMatch){
            return res.status(401).json({error:"Incorrect password."});
        }
        const payload={
            role:user.role,
            roll_no:user.roll_no
        }
        const token= generateToken(payload);
        res.status(200).json({token});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
});

router.use(jwtAuthMiddleware);
router.use(allowedRole('Student'));

router.get('/myInfo',async (req,res)=>{
    try{
        const student=req.user;
        const dataFromDb=await Student.findOne({roll_no:student.roll_no});
        res.status(200).json({dataFromDb});
        console.log("Data fetched by student.");
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
})

router.post('/foodReview',async(req,res)=>{
    try{
        const data={
            ...req.body,                        //using spread operator
            roll_no: req.user.roll_no
        }
        await FoodReview.create(data);
        console.log("FoodReview data created.");
        res.status(201).json({message:"Food review data created successfully."});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
});



router.post('/complaint',async(req,res)=>{
    try{
        const data=req.body;
        await Complaint.create(data);
        console.log("Complaint data created.");
        res.status(201).json({message:"Complaint data created successfully."});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
});


module.exports=router;