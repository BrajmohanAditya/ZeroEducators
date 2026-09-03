import axios from "axios"
const baseUrl = import.meta.env.VITE_BASE_URL;


export const createCourseApi=async(payload)=>{
    const res = await axios.post(`${baseUrl}/course/createCourse`,
        payload,
        {
            headers:{'Content-Type':'multipart/form-data'},
            withCredentials:true
        },
        
    )
    return res.data
}


export const getCourseApi = async(search)=>{
    const res = await axios.get(`${baseUrl}/course/getCourse`,
        {
            params:search?{search}:{},
            headers:{'Content-Type':'Application/json'},
            withCredentials:true
        }
    )

    return res.data
}


export const getSingleCourseApi =async(id)=>{
    const res=await axios.get(`${baseUrl}/course/getSingleCourse/${id}`,
         {
            
            headers:{'Content-Type':'Application/json'},
            withCredentials:true
        }
    )
    return res.data
}


export const getSinglePurchaseCourseApi = async(courseId)=>{
    const res = await axios.get(`${baseUrl}/course/getSinglePurchasedCourse/${courseId}`,
        {
            
            headers:{'Content-Type':'Application/json'},
            withCredentials:true
        }
    )

    return res.data
}

export const getAllPurchasedCourseApi = async()=>{
    const res = await axios.get(`${baseUrl}/course/getAllPurchasedCourse`,
        {
            
            headers:{'Content-Type':'Application/json'},
            withCredentials:true
        }
    )

    return res.data
}

export const deleteCourseApi = async (courseId) => {
    const res = await axios.delete(`${baseUrl}/course/deleteCourse/${courseId}`,
        {
            headers: { 'Content-Type': 'Application/json' },
            withCredentials: true
        }
    )
    return res.data;
}

export const editCourseApi = async ({ courseId, formData }) => {
    const res = await axios.put(`${baseUrl}/course/editCourse/${courseId}`,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        }
    )
    return res.data
}



