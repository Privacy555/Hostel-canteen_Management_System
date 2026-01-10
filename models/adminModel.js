const mongoose=require('mongoose');
const bcrypt=require('bcrypt');

const adminSchema=mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    role:{
        type:String,
        required:true,
        enum:["Admin", "Mentor", "Student"]

    },
    password:{
        type:String,
        required:true,
        select:false
    }
},{timestamps:true});

adminSchema.pre('save',async function(){
    try{
        if(! this.isModified('password')) return;
        const salt= await bcrypt.genSalt(10);
        const hashedpassword=await bcrypt.hash(this.password,salt);
        this.password=hashedpassword;
    }catch(err){
        throw err;
    }
});

adminSchema.methods.comparePassword= async function(userpwd){
    try{
        const isMatch=await bcrypt.compare(userpwd,this.password);
        return isMatch;
    }catch(err){
        throw err;
    }
}

const Admin= new mongoose.model("Admin",adminSchema);

module.exports=Admin;