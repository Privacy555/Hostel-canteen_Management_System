const express = require('express');
const router = express.Router();

const Student = require('./../models/studentModel');
const FoodReview = require('./../models/foodReview');
const Complaint = require('./../models/complaints');

const { jwtAuthMiddleware, generateToken } = require('../middleware/jwt');
const allowedRole = require('./../middleware/roleMiddleware');

// Student Login
router.post('/login', async (req, res) => {
  try {
    const { roll_no, password } = req.body;
    if (roll_no === undefined || roll_no === null || !password) {
      return res.status(400).json({ error: "Roll number and password are required." });
    }

    const numericRoll = Number(roll_no);
    if (isNaN(numericRoll)) {
      return res.status(400).json({ error: "Invalid roll number format." });
    }

    const user = await Student.findOne({ roll_no: numericRoll }).select('+password');
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(String(password).trim());
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const payload = {
      role: user.role,
      roll_no: user.roll_no,
      hostel_no: user.hostel_no
    };

    const token = generateToken(payload);
    res.status(200).json({
      token,
      user: {
        name: user.name,
        roll_no: user.roll_no,
        hostel_no: user.hostel_no,
        country: user.country,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Student login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Protected routes (Student only)
router.use(jwtAuthMiddleware);
router.use(allowedRole('Student'));

// Get logged-in student's profile
router.get('/myInfo', async (req, res) => {
  try {
    const roll_no = req.user.roll_no;
    const dataFromDb = await Student.findOne({ roll_no });
    if (!dataFromDb) {
      return res.status(404).json({ error: "Student profile not found." });
    }
    res.status(200).json({ dataFromDb });
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Submit Food Review
router.post('/foodReview', async (req, res) => {
  try {
    const { day, mealType, ratings, issues, counterIssues } = req.body;

    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const validMeals = ["Breakfast", "Lunch", "Dinner"];

    if (!validDays.includes(day)) {
      return res.status(400).json({ error: "Invalid day of week." });
    }
    if (!validMeals.includes(mealType)) {
      return res.status(400).json({ error: "Invalid meal type." });
    }
    if (!ratings || typeof ratings !== 'object') {
      return res.status(400).json({ error: "Ratings object with 6 dimensions is required." });
    }

    const requiredDimensions = ['taste', 'quality', 'cleanliness', 'overall', 'utensilHygiene', 'seatingCleanliness'];
    for (const dim of requiredDimensions) {
      const val = Number(ratings[dim]);
      if (isNaN(val) || val < 1 || val > 5) {
        return res.status(400).json({ error: `Rating for '${dim}' must be a number between 1 and 5.` });
      }
    }

    const newReview = new FoodReview({
      day,
      mealType,
      ratings: {
        taste: Number(ratings.taste),
        quality: Number(ratings.quality),
        cleanliness: Number(ratings.cleanliness),
        overall: Number(ratings.overall),
        utensilHygiene: Number(ratings.utensilHygiene),
        seatingCleanliness: Number(ratings.seatingCleanliness)
      },
      issues: Array.isArray(issues) ? issues : [],
      counterIssues: Array.isArray(counterIssues) ? counterIssues : [],
      roll_no: req.user.roll_no
    });

    await newReview.save();
    console.log(`Food review submitted by Roll #${req.user.roll_no} for ${day} ${mealType}`);
    res.status(201).json({ message: "Food review data created successfully." });
  } catch (err) {
    console.error("Error creating food review:", err);
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// Submit Complaint
router.post('/complaint', async (req, res) => {
  try {
    const { meal, complaintType, description } = req.body;

    const validMeals = ["Breakfast", "Lunch", "Dinner"];
    const validTypes = [
      "Foreign object in food",
      "Food poisoning",
      "Severe hygiene issue",
      "Unsafe food handling",
      "Other"
    ];

    if (!validMeals.includes(meal)) {
      return res.status(400).json({ error: "Invalid meal session." });
    }
    if (!validTypes.includes(complaintType)) {
      return res.status(400).json({ error: "Invalid complaint category." });
    }
    if (!description || String(description).trim().length === 0) {
      return res.status(400).json({ error: "Complaint description is required." });
    }

    const newComplaint = new Complaint({
      meal,
      complaintType,
      description: String(description).trim(),
      studentRoll: req.user.roll_no,
      hostel_no: req.user.hostel_no
    });

    await newComplaint.save();
    console.log(`Complaint lodged by Roll #${req.user.roll_no} (${complaintType})`);
    res.status(201).json({ message: "Complaint data created successfully." });
  } catch (err) {
    console.error("Error creating complaint:", err);
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

module.exports = router;