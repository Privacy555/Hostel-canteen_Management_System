const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const wardenSchema= mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    hostel_no:{
        type:Number,
        required:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        select:false
    },
    role:{
        type:String,
        required:true,
        enum:["Warden","Admin","Student"]
    }
},{timestamps:true});

wardenSchema.pre('save',async function(){
    try{
        if(! this.isModified('password')) return;
        const salt= await bcrypt.genSalt(10);
        const hashedpassword= bcrypt.hash(this.password,salt);
        this.password=hashedpassword;
    }catch(err){
        throw err;
    }
});

wardenSchema.methods.comparePassword= async(userpwd)=>{
    try{
        const isMatch=await bcrypt.compare(userpwd,this.password);
        return isMatch;
    }catch(err){
        throw err;
    }
}

const Warden= new mongoose.model('Warden',wardenSchema);

module.exports=Warden;