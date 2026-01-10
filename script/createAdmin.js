const mongoose=require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.LOCAL_DB);

const Admin=require('./../models/adminModel');

(async()=>{
    const search= await Admin.findOne({email:"admin@gmail.com"});
    if(search){
        console.log("Admin with that username already exists.");
        process.exit();
    }

    await Admin.create({
        name: "System Admin",
        email: "admin@gmail.com",
        role: "Admin",
        password: "Admin@123"
    });

    console.log("Admin created.");
    process.exit();
})();
