const express=require('express');
const router=express.Router();

const Student=require('./../models/studentModel');
const Warden=require('./../models/wardenModel');

const { jwtAuthMiddleware,generateToken } = require('../middleware/jwt');

const allowedRole=require('./../middleware/roleMiddleware');

router.post('/login',async(req,res)=>{
  try{
    const{email,password}=req.body;
    const user= await Warden.findOne({email}).select('+password');

    if(!user){
      return res.status(401).json({error:"Invalid credentials."});
    }

    const isMatch=await user.comparePassword(password);
    if(!isMatch){
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload={
      role:user.role,
      email:user.email
    }

    const token= generateToken(payload);
    res.status(200).json({token});
  }catch(err){
    console.log(err);
    res.status(500).json({error:"Internal server error."});
  }
});


router.use(jwtAuthMiddleware);
router.use(allowedRole('Warden'));

router.post('/create-student',async(req,res)=>{
    try{
        const data=req.body;
        await Student.create(data);
        res.status(201).json({message:"Student's data created."});
        console.log("Student's data created successfully.");
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
});





router.put('/update-student/:roll',async(req,res)=>{
    try{
        const roll_no=req.params.roll;
        const data=req.body;
        const search= await Student.findOne({roll_no});
        if(!search){
            return res.status(404).json({error:"Student with given roll_no not found in database."});
        }
        const response= await Student.findOneAndUpdate({roll_no},data,{
            new:true,
            runValidators:true
        });
        console.log('Data updated successfully');
        res.status(200).json({message:"Successful updation of data."});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
});




router.get('/get-student',async(req,res)=>{
    try{
        const dataFromDb= await Student.find();
        console.log("Students data fetched .");
        res.status(200).json({dataFromDb});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
})

router.get('/get-student/:roll',async(req,res)=>{
    try{
        const roll_no=req.params.roll;
        const dataFromDb= await Student.findOne({roll_no});
        res.status(200).json({dataFromDb});
        console.log("Student's data fetched.");

    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
});



router.delete('/delete-student/:roll',async(req,res)=>{
    try{
        const roll_no=req.params.roll;
        const search=await Student.findOne({roll_no});
        if(!search){
            return res.json({error:"Student with given roll no hasn't been found."});
        }
        const response=await Student.findOneAndDelete({roll_no});
        console.log("Student's data with given roll_no has been deleted.");
        res.status(200).json({message:"Successful deletion of data."});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
});




module.exports=router;