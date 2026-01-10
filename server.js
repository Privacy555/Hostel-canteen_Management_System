const express=require('express');
const app=express();

const db=require('./db');

const bodyParser=require('body-parser');
app.use(bodyParser.json());

const adminRoute=require('./routes/admin');
const studentRoute=require('./routes/students');
const wardenRoute=require('./routes/warden');

app.use('/admin',adminRoute);
app.use('/warden',wardenRoute);
app.use('/student',studentRoute);

app.get('/',(req,res)=>{
    res.json({
        message:"Welcome to our Mess-Management platform."
    })
});

const PORT=3000;
app.listen(PORT,(req,res)=>{
    console.log(`Server is running at port ${PORT}.`);
});