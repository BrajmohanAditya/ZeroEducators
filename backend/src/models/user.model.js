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

export const User = mongoose.model("User", userSchema);  

