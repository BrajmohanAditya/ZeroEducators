import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },// who created the course uski id
  title: {
    type: String,
    required: true,
  },// course name
  description:{
    type:String,
    required:true
  },
  thumbnail:{
    type:String,
  },
  thumbnail_id: {  // Naya field
  type: String,
},
  amount:{
    type:Number,
    required:true
  },
  duration: {
    type: String,
  },

  modules:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Modules"
    },
  ],

}, {timestamps: true});


export const Course = mongoose.model("Course", courseSchema);


/*
{   user table 

  "_id": "665f1c9a8d2a4f12abcd1111",
  "name": "Mohan",
  "email": "mohan@gmail.com",
  "password": "hashed_password_123",
  "admin": false,
  "purchasedCourse": [
    "777f1c9a8d2a4f12abcd2222",
    "777f1c9a8d2a4f12abcd3333"
  ],
  "createdAt": "2026-05-02T04:00:00.000Z",
  "updatedAt": "2026-05-02T04:00:00.000Z"
 
   course table 
   
  {
  "_id": "777f1c9a8d2a4f12abcd2222",
  "userId": "jo course create kiya uska objectid",
  "title": "MERN Stack Course",
  "description": "Complete MERN development from scratch",
  "thubmnail": "https://image-url.com/mern.jpg",
  "amount": 1999,
  "createdAt": "2026-05-02T04:10:00.000Z",
  "updatedAt": "2026-05-02T04:10:00.000Z"
}
}
*/