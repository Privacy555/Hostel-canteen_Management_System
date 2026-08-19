const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const wardenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    hostel_no: {
        type: Number,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        required: true,
        enum: ["Warden", "Admin", "Student"],
        default: "Warden"
    }
}, { timestamps: true });

wardenSchema.pre('save', async function() {
    try {
        if (!this.isModified('password')) return;
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(this.password, salt);
        this.password = hashedpassword;
    } catch (err) {
        throw err;
    }
});

wardenSchema.methods.comparePassword = async function(userpwd) {
    try {
        const isMatch = await bcrypt.compare(userpwd, this.password);
        return isMatch;
    } catch (err) {
        throw err;
    }
};

const Warden = mongoose.models.Warden || mongoose.model('Warden', wardenSchema);

module.exports = Warden;