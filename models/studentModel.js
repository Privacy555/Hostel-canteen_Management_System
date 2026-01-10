const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const studentSchema= mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    roll_no:{
        type:Number,
        unique:true,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    password:{
        type:String,
        select:false,
        required:true
    },
    hostel_no:{
        type:Number,
        required:true
    },
    role:{
        type:String,
        required:true,
        enum:["warden","admin","student"]
    }
},{timestamps:true});

studentSchema.pre('save',async function(){
    try{
        if(! this.isModified('password')) return;
        const salt= await bcrypt.genSalt(10);
        const hashedpassword=await bcrypt.hash(this.password,salt);
        this.password=hashedpassword;
    }catch(err){
        throw err;
    }
});

studentSchema.methods.comparePassword= async(userpwd)=>{
    try{
        const isMatch=await bcrypt.compare(userpwd,this.password);
        return isMatch;
    }catch(err){
        throw err;
    }
}

const Student= new mongoose.model('Student',studentSchema);

module.exports=Student;