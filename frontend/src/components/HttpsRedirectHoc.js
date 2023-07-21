import React from 'react'
import { DEBUG } from '../data/constants'

const HttpsRedirectHoc = (props) => {

    // redirect http -> https - but only in production
    if (!DEBUG) {
        if (window.location.href.slice(0,7).toLowerCase()==='http://') {
            window.location.href = `https://${window.location.href.slice(7)}`
        }    
    }
    
    return (
        <></>
    )
}

export default HttpsRedirectHoc