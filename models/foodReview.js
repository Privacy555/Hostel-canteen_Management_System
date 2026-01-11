const mongoose=require('mongoose');

const reviewSchema=mongoose.Schema({
    day: {
      type: String,
      enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      required: true
    },
    mealType:{
        type:String,
        enum: ["Breakfast", "Lunch", "Dinner"],
        required:true,
    },
    ratings:{
        taste:{type:Number,min:1,max:5,required:true},
        quality: { type: Number, min: 1, max: 5, required: true },
        cleanliness: { type: Number, min: 1, max: 5, required: true },
        overall: { type: Number, min: 1, max: 5, required: true },

        utensilHygiene: { type: Number, min: 1, max: 5, required: true },
        seatingCleanliness: { type: Number, min: 1, max: 5, required: true }
    },

    issues: [{
    type: String,
    enum: [
      "Cold food",
      "Bad taste",
      "Less quantity",
      "Hygiene issue",
      "tortillas not cooked properly",
      "rice not cooked properly",
      "stale bread",
      "vegetable not cooked properly"
    ]
  }],
  counterIssues: [{
    type: String,
    enum: [
      "Rude staff",
      "No gloves worn",
      "Not serving on time"
    ],
    default:[]
  }]

},{timestamps:true});


/*  AUTO DELETE AFTER 1 MONTH */
reviewSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 } // 30 days
);

const Review= new mongoose.model('FoodReview',reviewSchema);

module.exports=Review;