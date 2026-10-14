import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    mobileNo: {
        type: Number,
        required: true,
    },
    role:{
        type: String,
        enum:["user","admin"],
        default:"user",
    },
    purchasedCourse:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
        }
    ],
    purchasedExams:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
        }
    ],
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    }

}, {timestamps: true});  

userSchema.index({ role: 1 });
userSchema.index({ purchasedCourse: 1 });
userSchema.index({ createdAt: -1 });

export const User = mongoose.model("User", userSchema);  

