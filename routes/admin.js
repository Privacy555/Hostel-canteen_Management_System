const express = require('express');
const router = express.Router();

const Warden = require('./../models/wardenModel');
const FoodReview = require('./../models/foodReview');
const Complaint = require('./../models/complaints');
const Admin = require('../models/adminModel');

const { jwtAuthMiddleware, generateToken } = require('./../middleware/jwt');
const allowedRole = require('./../middleware/roleMiddleware');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await Admin.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(String(password).trim());
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const payload = {
      role: user.role,
      email: user.email
    };

    const token = generateToken(payload);
    res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Admin section welcome
router.get('/', (req, res) => {
  res.json({ message: "Welcome to the admin section." });
});

// Protected routes (Admin only)
router.use(jwtAuthMiddleware);
router.use(allowedRole('Admin'));

// Register / Create Warden
router.post('/create-warden', async (req, res) => {
  try {
    const { name, email, hostel_no, password } = req.body;

    if (!name || !email || !hostel_no || !password) {
      return res.status(400).json({ error: "All fields (name, email, hostel_no, password) are required." });
    }

    const numericHostel = Number(hostel_no);
    if (isNaN(numericHostel) || numericHostel <= 0) {
      return res.status(400).json({ error: "Hostel number must be a valid positive number." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check duplicate hostel assignment
    const existingByHostel = await Warden.findOne({ hostel_no: numericHostel });
    if (existingByHostel) {
      return res.status(400).json({ error: `A warden is already assigned to Hostel #${numericHostel}.` });
    }

    // Check duplicate email
    const existingByEmail = await Warden.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return res.status(400).json({ error: `A warden with email "${normalizedEmail}" already exists.` });
    }

    // Force role to 'Warden'
    const newWarden = new Warden({
      name: String(name).trim(),
      email: normalizedEmail,
      hostel_no: numericHostel,
      password: String(password).trim(),
      role: 'Warden'
    });

    const response = await newWarden.save();
    console.log(`Warden registered for Hostel #${numericHostel}`);
    res.status(201).json({
      message: "Warden account created successfully.",
      warden: {
        _id: response._id,
        name: response.name,
        email: response.email,
        hostel_no: response.hostel_no
      }
    });
  } catch (err) {
    console.error("Error creating warden:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Duplicate field value (email or hostel_no already registered)." });
    }
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// List all wardens
router.get('/wardens', async (req, res) => {
  try {
    const wardens = await Warden.find().sort({ hostel_no: 1 });
    res.status(200).json({ wardens });
  } catch (err) {
    console.error("Error fetching wardens:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get warden by hostel number
router.get('/get-warden/:hostel_no', async (req, res) => {
  try {
    const hostel_no = Number(req.params.hostel_no);
    if (isNaN(hostel_no)) {
      return res.status(400).json({ error: "Invalid hostel number parameter." });
    }

    const dataFromdb = await Warden.findOne({ hostel_no });
    if (!dataFromdb) {
      return res.status(404).json({ error: `No warden found for Hostel #${hostel_no}.` });
    }
    res.status(200).json({ dataFromdb });
  } catch (err) {
    console.error("Error fetching warden:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get all food reviews
router.get('/foodReview', async (req, res) => {
  try {
    const dataFromdb = await FoodReview.find().sort({ createdAt: -1 });
    res.status(200).json({ dataFromdb });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get food reviews by day
router.get('/foodReview/day/:DAY', async (req, res) => {
  try {
    const day = req.params.DAY;
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if (!validDays.includes(day)) {
      return res.status(400).json({ error: "Invalid day of week parameter." });
    }

    const dataFromdb = await FoodReview.find({ day }).sort({ createdAt: -1 });
    res.status(200).json({ dataFromdb });
  } catch (err) {
    console.error("Error fetching reviews by day:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get food reviews by mealType
router.get('/foodReview/meal/:mealType', async (req, res) => {
  try {
    const mealType = req.params.mealType;
    const validMeals = ["Breakfast", "Lunch", "Dinner"];
    if (!validMeals.includes(mealType)) {
      return res.status(400).json({ error: "Invalid mealType parameter." });
    }

    const dataFromdb = await FoodReview.find({ mealType }).sort({ createdAt: -1 });
    res.status(200).json({ dataFromdb });
  } catch (err) {
    console.error("Error fetching reviews by meal:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get overall average ratings grouped by Day
router.get('/foodReview/average/meal', async (req, res) => {
  try {
    const result = await FoodReview.aggregate([
      {
        $group: {
          _id: "$day",
          avgTaste: { $avg: "$ratings.taste" },
          avgQuality: { $avg: "$ratings.quality" },
          avgCleanliness: { $avg: "$ratings.cleanliness" },
          avgUtensilHygiene: { $avg: "$ratings.utensilHygiene" },
          avgSeatingCleanliness: { $avg: "$ratings.seatingCleanliness" },
          avgOverall: { $avg: "$ratings.overall" }
        }
      }
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error calculating average meal ratings:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get overall average ratings by date and mealType
router.get('/foodReview/average/date-meal', async (req, res) => {
  try {
    const result = await FoodReview.aggregate([
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            mealType: "$mealType"
          },
          avgOverall: { $avg: "$ratings.overall" }
        }
      },
      { $sort: { "_id.date": -1 } }
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error calculating date-meal ratings:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get all complaints
router.get('/complaints', async (req, res) => {
  try {
    const dataFromdb = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json({ dataFromdb });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;