
const Warden=require('./../models/wardenModel');
const FoodReview=require('./../models/foodReview');
const Complaint=require('./../models/complaints');

const {jwtAuthMiddleware,generateToken}=require('./../middleware/jwt');
require('dotenv').config();

const express=require('express');
const Admin = require('../models/adminModel');
const router=express.Router();

const allowedRole=require('./../middleware/roleMiddleware');
const { message } = require('prompt');

router.post('/login',async(req,res)=>{
  try{
    const{email,password}=req.body;
    const user= await Admin.findOne({email}).select('+password');

    if(!user){
      return res.status(401).json({error:"Invalid credentials."});
    }

    const isMatch= await user.comparePassword(password);
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


router.get('/',(req,res)=>{
  res.json({message:"Welcome to the admin section."});
})



router.use(jwtAuthMiddleware);
router.use(allowedRole('Admin'));

/* To store warden's credentials. */
router.post('/create-warden',async function(req,res){
    try{
        const data=req.body;
        const search=await Warden.findOne({hostel_no:data.hostel_no});
        if(search){
            return res.json({message:"Record of warden for that hostel_no is already present in the database."});
        }
        const newWarden= new Warden(data);
        const response=await newWarden.save();

        res.status(201).json({message:"Data created for warden successfully.",response});
        console.log("Data created for warden successfully.");

    }catch(err){
        console.log(err);
        res.status(500).json({err});
    }
})


router.get('/wardens', async (req, res) => {
  try {
    const wardens = await Warden.find();
    res.status(200).json({ wardens });
  } catch (err) {
    res.status(500).json({ error:"Internal server error." });
  }
});




/* to get warden with given hostel_no */
router.get('/get-warden/:hostel_no',async(req,res)=>{
    try{
        const hostel_no=req.params.hostel_no;
        const dataFromdb=await Warden.findOne({hostel_no});
        if(!dataFromdb){
            return res.status(404).json({message:"No warden found with given hostel_no."})
        }
        res.status(200).json({dataFromdb});
        console.log("Warden's data fetched successfully.");
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
});



router.get('/foodReview',async(req,res)=>{
    try{
        const dataFromdb= await FoodReview.find();
        console.log("Data fetched successfully.");
        res.status(200).json({dataFromdb});
    }catch(err){
        console.log(err);
        res.status(500).json({err});
    }
});

router.get('/foodReview/day/:DAY',async(req,res)=>{
    try{
        const day=req.params.DAY;
        const dataFromdb= await FoodReview.find({day});
        if(!dataFromdb){
            return res.status(404).json("Data not found for that day.");
        }
        res.status(200).json({dataFromdb});
        console.log("Data fetched succesfully for given day.");
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."})
    }
});


router.get('/foodReview/meal/:mealType',async(req,res)=>{
    try{
        const mealType =req.params.mealType;
        const dataFromdb= await FoodReview.find({mealType});
        if(!dataFromdb){
            return res.status(404).json("Data not found for that day.");
        }
        res.status(200).json({dataFromdb});
        console.log("Data fetched succesfully for given day.");
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."})
    }
});



/* To get overall average according to Day */
router.get('/foodReview/average/meal', async (req, res) => {
  try {
    const result = await FoodReview.aggregate([                                                     //aggregate() = “process data, don’t just fetch”
      {                                                                                             
        $group: {                                                                                   //“Group documents before doing any calculation”        
          _id: "$day",                                                                              //“Group all documents that have the same mealType”, _id defines grouping key, _id is NOT MongoDB document id

          avgTaste: { $avg: "$ratings.taste" },                                                     //$avg = MongoDB average operator, $ratings.taste = take taste value from each document
          avgQuality: { $avg: "$ratings.quality" },
          avgCleanliness: { $avg: "$ratings.cleanliness" },
          avgUtensilHygiene: { $avg: "$ratings.utensilHygiene" },
          avgSeatingCleanliness: { $avg: "$ratings.seatingCleanliness" },
          avgOverall: { $avg: "$ratings.overall" }                                                  //avgOverall = average of the ratings.overall values in the documents grouped by day.It does not average the other computed averages (avgTaste, avgQuality, etc.). ratings.overall calculates average of all the ratings of that single document.
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error:"Internal server error." });
  }
});




/* To get overall average rating according to mealType and datewise */
router.get('/foodReview/average/date-meal', async (req, res) => {
  try {
    const result = await FoodReview.aggregate([
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"                                                                          //$createdAt → value from each document, $ means → field reference
              }
            },
            mealType: "$mealType"
          },
          avgOverall: { $avg: "$ratings.overall" }                                                          //avg of : overall ratings (of each student's review) of that meal for that date.
        }
      }
    ]);

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to calculate average ratings",
      error: err.message
    });
  }
});



router.get('/complaints',async(req,res)=>{
    try{
        const dataFromdb= await Complaint.find();
        if (dataFromdb.length === 0) {                                                            //find() returns [], not null
          return res.json({ message: "No complaints found." });
        }
        res.status(200).json({dataFromdb});
        console.log('Complaint fetched.');
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Internal server error."});
    }
})





module.exports=router;