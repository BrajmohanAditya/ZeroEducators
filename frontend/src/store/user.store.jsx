import { create } from 'zustand'
import { devtools } from 'zustand/middleware'


export const useUserStore = create(
    devtools(
        (set)=>({
            user:null,
            isCheckingAuth: true,
            setUser:(userData)=>set({user:userData, isCheckingAuth:false}),
            clearUser:()=>set({user:null, isCheckingAuth:false}),
            setCheckingAuth:(checking)=>set({isCheckingAuth:checking})
        }),
        {name:'UserStore'}
    )
)