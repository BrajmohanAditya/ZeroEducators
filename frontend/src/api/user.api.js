import axios from "axios";
const baseUrl = import.meta.env.VITE_BASE_URL;



export const registerApi = async (payload) => {
    const res = await axios.post(`${baseUrl}/register`, payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    )

    return res.data
};

export const loginApi = async (payload) => {
    const res = await axios.post(`${baseUrl}/login`, payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    )

    return res.data
};


export const getUserApi = async () => {
    const res = await axios.get(`${baseUrl}/getUser`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    )

    return res.data
};

export const logOutApi = async () => {
    const res = await axios.post(`${baseUrl}/logout`,
        {},
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    )

    return res.data
}

export const verifyOtpApi = async (payload) => {
    // payload should contain { email, otp }
    const res = await axios.post(`${baseUrl}/verify-otp`, payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    )
    return res.data;
};

export const googleLoginApi = async (payload) => {
    // payload should contain { token }
    const res = await axios.post(`${baseUrl}/google`, payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }
    )
    return res.data;
};

