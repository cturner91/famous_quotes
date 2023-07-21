import React, {useContext, useEffect} from 'react'

import ScreenFadeWrapper from '../components/ScreenFadeWrapper'
import Header from '../components/Header'
import Footer from '../components/Footer/Footer'
import AutoLoginHoc from '../components/AutoLoginHoc'
import HttpsRedirectHoc from '../components/HttpsRedirectHoc'
import MetaHoc from '../components/MetaHoc'
import { GlobalContext } from '../data/GlobalContext'


const GenericScreen = (props) => {

    // Screen that has both header and footer and the ScreenFadeWrapper to wrap the screen
    // also applies the window.scrollTo(0,0) via useEffect
    const {state, dispatch} = useContext(GlobalContext)
    // console.log(state.analytics)

    const recordUnload = () => dispatch({type: 'ADD_ANALYTIC', action: 'close window', forceCommit: true})

    useEffect( ()=>{
        window.scrollTo(0,0)

        window.addEventListener("beforeunload", recordUnload)
        return () => {
          window.removeEventListener("beforeunload", recordUnload)
        }
    }, [])

    return (
        <>
            <MetaHoc elementType='meta' metas={props.metas} title={props.title} />
            <MetaHoc elementType='link' metas={props.links} />
            <HttpsRedirectHoc />
            <AutoLoginHoc />

            <Header showTitle={true} />
            <ScreenFadeWrapper>
                {props.children}
            </ScreenFadeWrapper>
            <Footer />
        </>
    )
}

export default GenericScreen