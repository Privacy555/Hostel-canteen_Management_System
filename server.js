const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const db = require('./db');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const adminRoute = require('./routes/admin');
const studentRoute = require('./routes/students');
const wardenRoute = require('./routes/warden');

app.use('/admin', adminRoute);
app.use('/warden', wardenRoute);
app.use('/student', studentRoute);

// API Health Check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Welcome to the Mess Management Platform API.',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route to serve frontend index.html for client-side navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});