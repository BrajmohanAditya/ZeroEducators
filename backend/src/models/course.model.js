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
    required:true,
    default: 0,
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  duration: {
    type: String,
  },

  pricingPlans: [
    {
      duration: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      label: {
        type: String,
        default: "",
      },
    },
  ],

  courseType: {
    type: String,
    enum: ["video", "pdf"],
    default: "video",
  },

  modules:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Modules"
    },
  ],

  topics: [
    {
      topicName: {
        type: String,
        required: true,
      },
      videos: [
        {
          title: {
            type: String,
            required: true,
          },
          Video: {
            type: String,
            required: true,
          },
          Video_id: {
            type: String,
            required: true,
          },
          moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Modules",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      pdfs: [
        {
          title: {
            type: String,
            required: true,
          },
          pdfUrl: {
            type: String,
            required: true,
          },
          pdf_id: {
            type: String,
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  subjects: [
    {
      subjectName: {
        type: String,
        required: true,
      },
      chapters: [
        {
          chapterName: {
            type: String,
            required: true,
          },
          videos: [
            {
              title: {
                type: String,
                required: true,
              },
              Video: {
                type: String,
                required: true,
              },
              Video_id: {
                type: String,
                required: true,
              },
              moduleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Modules",
              },
              createdAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],
          pdfs: [
            {
              title: {
                type: String,
                required: true,
              },
              pdfUrl: {
                type: String,
                required: true,
              },
              pdf_id: {
                type: String,
                required: true,
              },
              createdAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {timestamps: true});


export const Course = mongoose.model("Course", courseSchema);

