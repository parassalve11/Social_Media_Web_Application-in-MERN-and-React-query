

import {createSlice} from "@reduxjs/toolkit"


const initialState = {
    user:null,
    isAutenticated:false
}

const userSlice = createSlice({
    name:"user",
    initialState,
    reducers:{
        setUser:(state,action) =>{
            state.user = action.payload
            state.isAutenticated=true
        },
        clearUser:(state) =>{
            state.user = null,
            state.isAutenticated = false
        }
    }
})


export const {setUser,clearUser} = userSlice.actions

export default userSlice.reducer