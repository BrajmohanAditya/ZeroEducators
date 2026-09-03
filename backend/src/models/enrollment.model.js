/*
jb koi user ush course ko buy karega to yaha pe store hoga

*/

import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
        required:true
    },
    stripeSessionId:{
        type:String,
        required:true
    },
    
}, {timestamps:true})  

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema)