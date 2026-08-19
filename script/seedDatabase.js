const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/adminModel');
const Warden = require('../models/wardenModel');
const Student = require('../models/studentModel');
const FoodReview = require('../models/foodReview');
const Complaint = require('../models/complaints');

async function seed() {
  try {
    const mongoUri = process.env.LOCAL_DB || 'mongodb://127.0.0.1:27017/Mess_Management';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB for seeding.');

    // 1. Seed Admin
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (!existingAdmin) {
      const admin = new Admin({
        name: 'System Admin',
        email: 'admin@gmail.com',
        role: 'Admin',
        password: 'Admin@123'
      });
      await admin.save();
      console.log('✔ Admin user created: admin@gmail.com (pwd: Admin@123)');
    } else {
      console.log('ℹ Admin user already exists.');
    }

    // 2. Seed Wardens
    const wardensData = [
      {
        name: 'Dr. Suresh Verma',
        hostel_no: 1,
        email: 'warden.h1@hostel.edu',
        password: 'warden123',
        role: 'Warden'
      },
      {
        name: 'Prof. Anita Sharma',
        hostel_no: 2,
        email: 'warden.h2@hostel.edu',
        password: 'warden123',
        role: 'Warden'
      }
    ];

    for (const wData of wardensData) {
      const existingWarden = await Warden.findOne({ email: wData.email });
      if (!existingWarden) {
        const warden = new Warden(wData);
        await warden.save();
        console.log(`✔ Warden created: ${wData.name} (${wData.email}) for Hostel ${wData.hostel_no}`);
      }
    }

    // 3. Seed Students
    const studentsData = [
      {
        name: 'Aarav Sharma',
        roll_no: 101,
        country: 'India',
        hostel_no: 1,
        password: 'student123',
        role: 'Student'
      },
      {
        name: 'Priya Patel',
        roll_no: 102,
        country: 'India',
        hostel_no: 1,
        password: 'student123',
        role: 'Student'
      },
      {
        name: 'Rohan Thapa',
        roll_no: 201,
        country: 'Nepal',
        hostel_no: 2,
        password: 'student123',
        role: 'Student'
      }
    ];

    for (const sData of studentsData) {
      const existingStudent = await Student.findOne({ roll_no: sData.roll_no });
      if (!existingStudent) {
        const student = new Student(sData);
        await student.save();
        console.log(`✔ Student created: ${sData.name} (Roll: ${sData.roll_no}) in Hostel ${sData.hostel_no}`);
      }
    }

    // 4. Seed sample Food Reviews if none exist
    const reviewCount = await FoodReview.countDocuments();
    if (reviewCount === 0) {
      const sampleReviews = [
        {
          day: 'Monday',
          mealType: 'Breakfast',
          ratings: { taste: 4, quality: 4, cleanliness: 5, utensilHygiene: 4, seatingCleanliness: 4, overall: 4 },
          issues: ['Cold food'],
          counterIssues: ['Not serving on time']
        },
        {
          day: 'Monday',
          mealType: 'Lunch',
          ratings: { taste: 3, quality: 3, cleanliness: 4, utensilHygiene: 4, seatingCleanliness: 4, overall: 3 },
          issues: ['tortillas not cooked properly', 'rice not cooked properly'],
          counterIssues: []
        },
        {
          day: 'Tuesday',
          mealType: 'Dinner',
          ratings: { taste: 5, quality: 5, cleanliness: 5, utensilHygiene: 5, seatingCleanliness: 5, overall: 5 },
          issues: [],
          counterIssues: []
        },
        {
          day: 'Wednesday',
          mealType: 'Lunch',
          ratings: { taste: 2, quality: 2, cleanliness: 3, utensilHygiene: 3, seatingCleanliness: 3, overall: 2 },
          issues: ['Bad taste', 'vegetable not cooked properly'],
          counterIssues: ['Rude staff']
        },
        {
          day: 'Thursday',
          mealType: 'Breakfast',
          ratings: { taste: 4, quality: 4, cleanliness: 4, utensilHygiene: 4, seatingCleanliness: 4, overall: 4 },
          issues: [],
          counterIssues: []
        },
        {
          day: 'Friday',
          mealType: 'Dinner',
          ratings: { taste: 4, quality: 4, cleanliness: 4, utensilHygiene: 5, seatingCleanliness: 4, overall: 4 },
          issues: ['Less quantity'],
          counterIssues: ['No gloves worn']
        }
      ];

      await FoodReview.insertMany(sampleReviews);
      console.log(`✔ Inserted ${sampleReviews.length} sample food reviews.`);
    }

    // 5. Seed sample Complaints if none exist
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0) {
      const sampleComplaints = [
        {
          meal: 'Breakfast',
          complaintType: 'Unsafe food handling',
          description: 'Staff member served rotis with bare unwashed hands without wearing kitchen gloves.'
        },
        {
          meal: 'Lunch',
          complaintType: 'Foreign object in food',
          description: 'Found small pebble in dal rice plate near counter 2.'
        },
        {
          meal: 'Dinner',
          complaintType: 'Severe hygiene issue',
          description: 'Water dispenser drinking glasses were not cleaned properly and had residue.'
        }
      ];

      await Complaint.insertMany(sampleComplaints);
      console.log(`✔ Inserted ${sampleComplaints.length} sample complaints.`);
    }

    console.log('✅ Database seeding finished successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
