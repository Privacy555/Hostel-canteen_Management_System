const mongoose=require('mongoose');

const complaint= mongoose.Schema({
    meal: {
    type: String,
    enum: ["Breakfast", "Lunch", "Dinner"],
    required: true
  },

  complaintType: {
    type: String,
    enum: [
      "Foreign object in food",
      "Food poisoning",
      "Severe hygiene issue",
      "Unsafe food handling",
      "Other"
    ],
    required: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  }
},{timestamps:true});

const Complaint= new mongoose.model('Complaint',complaint);
module.exports=Complaint;