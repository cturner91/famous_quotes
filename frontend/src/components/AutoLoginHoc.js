import React, { useEffect, useContext } from 'react'

import { GlobalContext } from '../data/GlobalContext'
import { checkLoggedInAsync } from '../data/utils'


const AutoLoginHoc = (props) => {
    
    // component contains the logic to automatically check if the user's session
    // is logged in. If so, it calls the API for user data and updates the state.user in context
    const {state, dispatch} = useContext(GlobalContext)

    useEffect( ()=>{
        const asyncEffect = async () => {
            if (state.user) return
            if (state.sessionChecked) return
            // console.log('CALLING API FOR USER DATA')
            const userData = await checkLoggedInAsync()
            if (userData) {
                dispatch({type: 'SET_USER', user: userData})
            } else {
                dispatch({type: 'SET_SESSION_CHECKED', value: true})
            }
        }
        asyncEffect()
    }, [])
    return (
        <></>
    )
}

export default AutoLoginHoc