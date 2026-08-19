const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const Student = require('./../models/studentModel');
const Warden = require('./../models/wardenModel');

const { jwtAuthMiddleware, generateToken } = require('../middleware/jwt');
const allowedRole = require('./../middleware/roleMiddleware');

// Warden Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await Warden.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(String(password).trim());
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const payload = {
      role: user.role,
      email: user.email,
      hostel_no: user.hostel_no
    };

    const token = generateToken(payload);
    res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        hostel_no: user.hostel_no,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Warden login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Protected routes (Warden only)
router.use(jwtAuthMiddleware);
router.use(allowedRole('Warden'));

// Create / Register Student
router.post('/create-student', async (req, res) => {
  try {
    const { name, roll_no, country, hostel_no, password } = req.body;

    if (!name || !roll_no || !country || !hostel_no || !password) {
      return res.status(400).json({ error: "All student fields (name, roll_no, country, hostel_no, password) are required." });
    }

    const numericRoll = Number(roll_no);
    const numericHostel = Number(hostel_no);

    if (isNaN(numericRoll) || numericRoll <= 0) {
      return res.status(400).json({ error: "Roll number must be a valid positive number." });
    }
    if (isNaN(numericHostel) || numericHostel <= 0) {
      return res.status(400).json({ error: "Hostel number must be a valid positive number." });
    }

    const existingStudent = await Student.findOne({ roll_no: numericRoll });
    if (existingStudent) {
      return res.status(400).json({ error: `Student with Roll Number ${numericRoll} already exists.` });
    }

    // Force role to 'Student' to prevent privilege escalation
    const newStudent = new Student({
      name: String(name).trim(),
      roll_no: numericRoll,
      country: String(country).trim(),
      hostel_no: numericHostel,
      password: String(password).trim(),
      role: 'Student'
    });

    const response = await newStudent.save();
    console.log(`Student created successfully: Roll #${numericRoll}`);
    res.status(201).json({ message: "Student registered successfully.", student: { roll_no: response.roll_no, name: response.name } });
  } catch (err) {
    console.error("Error creating student:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Duplicate roll number. A student with this roll number already exists." });
    }
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// Update Student Record (Secure update preventing plain-text password & role escalation)
router.put('/update-student/:roll', async (req, res) => {
  try {
    const roll_no = Number(req.params.roll);
    if (isNaN(roll_no)) {
      return res.status(400).json({ error: "Invalid roll number parameter." });
    }

    const student = await Student.findOne({ roll_no }).select('+password');
    if (!student) {
      return res.status(404).json({ error: `Student with roll number ${roll_no} not found.` });
    }

    const { name, country, hostel_no, password } = req.body;

    if (name !== undefined) student.name = String(name).trim();
    if (country !== undefined) student.country = String(country).trim();
    if (hostel_no !== undefined) {
      const numHostel = Number(hostel_no);
      if (!isNaN(numHostel) && numHostel > 0) student.hostel_no = numHostel;
    }
    if (password && String(password).trim().length > 0) {
      student.password = String(password).trim(); // Triggers bcrypt pre('save') hook
    }

    await student.save();
    console.log(`Student #${roll_no} updated successfully.`);
    res.status(200).json({ message: "Student record updated successfully." });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// Get all students
router.get('/get-student', async (req, res) => {
  try {
    const dataFromDb = await Student.find().sort({ roll_no: 1 });
    res.status(200).json({ dataFromDb });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get student by roll number
router.get('/get-student/:roll', async (req, res) => {
  try {
    const roll_no = Number(req.params.roll);
    if (isNaN(roll_no)) {
      return res.status(400).json({ error: "Invalid roll number parameter." });
    }

    const dataFromDb = await Student.findOne({ roll_no });
    if (!dataFromDb) {
      return res.status(404).json({ error: `Student with roll number ${roll_no} not found.` });
    }
    res.status(200).json({ dataFromDb });
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Delete student
router.delete('/delete-student/:roll', async (req, res) => {
  try {
    const roll_no = Number(req.params.roll);
    if (isNaN(roll_no)) {
      return res.status(400).json({ error: "Invalid roll number parameter." });
    }

    const deleted = await Student.findOneAndDelete({ roll_no });
    if (!deleted) {
      return res.status(404).json({ error: `Student with roll number ${roll_no} not found.` });
    }

    console.log(`Student #${roll_no} deleted successfully.`);
    res.status(200).json({ message: "Student record deleted successfully." });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;