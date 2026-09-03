import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },

    moduleId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Module",
    },
    comment:{
        type:String,
        required:true,
    }
    
},{timestamps:true})

export const Comment = mongoose.model("Comment",commentSchema)