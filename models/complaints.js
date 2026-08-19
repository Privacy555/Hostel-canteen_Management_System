const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
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
    trim: true,
    maxlength: 2000
  },
  studentRoll: {
    type: Number
  },
  hostel_no: {
    type: Number
  }
}, { timestamps: true });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;