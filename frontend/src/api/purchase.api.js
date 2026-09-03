import axios from "axios"
const baseUrl = import.meta.env.VITE_BASE_URL;

export const purchaseCourseApi = async(payload)=>{
    const res = await axios.post(`${baseUrl}/payment/checkout`,
        payload,
        {
            headers: { 'Content-Type': 'application/json' }, // Yahan change kiya hai
            withCredentials: true
        }
    )
    return res.data
}


export const checkOutSuccessApi = async(paymentData)=>{
    const res = await axios.post(`${baseUrl}/payment/checkout-success`,
        paymentData,
        {
           headers: { 'Content-Type': 'application/json' },
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

