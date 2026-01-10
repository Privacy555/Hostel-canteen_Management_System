const mongoose=require('mongoose');
require('dotenv').config();
const localdb=process.env.LOCAL_DB
mongoose.connect(localdb);

const db=mongoose.connection;

db.on('connected',()=>{
    console.log("Server is connected to database successfully.");
});
db.on('disconnected',()=>{
    console.log("Server is disconnected to database.");
});
db.on('error',(err)=>{
    console.log(err);
});

module.exports=db;
