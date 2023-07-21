import React, { useState, useEffect, useContext, useRef } from 'react'

import { Link } from 'react-router-dom'

import ImageSplash from '../components/HomeScreen/ImageSplash'
import Header from '../components/Header'
import Footer from '../components/Footer/Footer'
import GenericQuotes from '../components/HomeScreen/GenericQuotes'
import QuoteCategorySplashes from '../components/HomeScreen/QuoteCategorySplashes'
import AutoLoginHoc from '../components/AutoLoginHoc'
import {API_HOME_URL, APP_ABOUT_URL, APP_ACCOUNT_URL, APP_ADD_QUOTE_URL, APP_CONTACT_URL, APP_LOGIN_URL, APP_QOTD_URL, APP_QUOTES_URL, APP_QUOTE_VIEW_URL, COLORS, homeScreenSplashImages, PROD_BASE_URL } from '../data/constants'
import ShareLinks from '../components/ShareLinks'
import { genericRequest } from '../data/utils'
import axios from 'axios'
import { GlobalContext } from '../data/GlobalContext'
import HttpsRedirectHoc from '../components/HttpsRedirectHoc'
import MetaHoc from '../components/MetaHoc'

axios.defaults.withCredentials = true  // necessary to persist sessions


const HomeScreen = (props) => {    

    const {state, dispatch} = useContext(GlobalContext)
    // console.log(state.analytics)

    const [quotes, setQuotes] = useState({top: [], random: []})

    useEffect( ()=>{
        axios({
            url: API_HOME_URL,
            method: 'GET',
        })
        .catch( response=>{
            // console.log(response)
        })
        .then( response=>{
            // console.log(response)
            setQuotes(response.data.data)
            dispatch({type: 'EXTEND_QUOTES', quotes: [
                ...response.data.data.top,
                ...response.data.data.random,
                ...response.data.data.politics,
                ...response.data.data.motivation,
                ...response.data.data.funny,
                ...response.data.data.travel,
                ...response.data.data.career,
            ]})
        })

        const recordUnload = () => dispatch({type: 'ADD_ANALYTIC', action: 'close window', forceCommit: true})

        window.addEventListener("beforeunload", recordUnload)
        return () => {
          window.removeEventListener("beforeunload", recordUnload)
        }
    }, [])

    // choose a splash image at random
    const splashImage = useRef(homeScreenSplashImages[Math.floor(Math.random()*homeScreenSplashImages.length)])

    const linkStyle = {
        color: 'rgb(0, 0, 0)',
        // fontWeight: 'bold',
        // textDecoration: 'underline',
        backgroundColor: COLORS.main(0.3),
        padding: 3,
        borderRadius: 5,
    }

    const pStyle = {
        textAlign: 'left',
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Home | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'The best place to find the most famous quotes from history.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: PROD_BASE_URL},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'website'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: PROD_BASE_URL},
    ]

    const a = (analyticsText) => {
        // high risk of bounce so forceCommit to capture as much as possible
        dispatch({type: 'ADD_ANALYTIC', action: analyticsText, forceCommit: true})
    }

    return (
        <>
            <HttpsRedirectHoc />
            <MetaHoc metas={metas} elementType='meta' title={'Home | Famous-Quotes.uk'} />
            <MetaHoc metas={links} elementType='link' />
            <AutoLoginHoc />
            <ImageSplash splashImage={splashImage.current} />
            <Header showTitle={false} />
            <div className='container' style={{maxWidth: 700, margin: 'auto'}}>
                <h1 style={{textAlign: 'center', marginTop: 30}}>Welcome to Famous-Quotes.uk</h1>
                <p style={{textAlign: 'center', marginBottom: 30}}>The easiest place to find the most famous quotes from history.</p>

                <p style={pStyle}>Check out our <Link style={linkStyle} to={APP_QUOTES_URL} onClick={()=>a('homepage:most popular quotes:click')}>most popular quotes</Link>, or perhaps browse our <Link style={linkStyle} to={`${APP_QUOTES_URL}?s=newest`} onClick={()=>a('homepage:newest additions:click')}>newest additions</Link>.</p>

                <p style={pStyle}>Can't find a quote you love? <Link style={linkStyle} to={`${APP_QUOTES_URL}?filter=1`} onClick={()=>a('homepage:search our quotes database:click')}>Search our quotes database</Link> for specific authors or phrases.</p>

                <p style={pStyle}>Upvote your favourite quotes to ensure the best ones rise to the top organically (no account needed for voting).</p>
                
                <p style={pStyle}>Create Instagram-worthy <Link style={linkStyle} to={APP_QUOTE_VIEW_URL} onClick={()=>a('homepage:quote views:click')}>Quote Views</Link>, and share with your friends.</p>

                <p style={pStyle}>Or even just try our <Link style={linkStyle} to={APP_QOTD_URL} onClick={()=>a('homepage:quote of the day:click')}>Quote of the day feature</Link> to start your day right.</p>

                <p style={{...pStyle, marginBottom: 0}}>Get more from the website by <Link style={linkStyle} to={APP_LOGIN_URL}onClick={()=>a('homepage:create account:click')}>creating an account</Link>, where you can:</p>
                <ul style={{marginLeft: window.innerWidth > 991 ? '15%' : '15%'}}>
                    <li>Create and save your own lists of quotes</li>
                    <li>Add new quotes</li>
                    <li>Comment on other quotes</li>
                    <li>Contact the admins directly</li>
                </ul>

            </div>

            <div className='container'>
                <GenericQuotes quotes={[...quotes['top'], ...quotes['random']]} />
            </div>


            {/* container is too restrictive for CategorySplashes */}
            <div className='px-3 d-flex flex-row justify-content-center'>
                <QuoteCategorySplashes 
                    motivation={quotes['motivation']} 
                    travel={quotes['travel']} 
                    funny={quotes['funny']} 
                    politics={quotes['politics']} 
                    career={quotes['career']} 
                />
            </div>

            <div className='container' style={{maxWidth: 800}}>
                <div className='d-flex flex-column align-items-center px-3'>
                    <h2>About Us</h2>
                    <p style={{textAlign: 'justify'}}>We love good quotes, and how they can totally change our outlook on any given day. When we have previously tried to search for quotes, we found Google's results to be a little lacking.</p>
                    <p style={{textAlign: 'justify'}}>There did not seem to be a single source of the world's best quotes available in one place. That is what we are hoping this website can become. By allowing all users to vote on quotes, we hope that the most meaningful ones will naturally rise to the top.</p>
                    <p style={{textAlign: 'justify'}}>More info about us on our <Link style={{color: COLORS.linkColor}} to={`${APP_ABOUT_URL}`} onClick={()=>a('homepage:about us:click')}>About Us</Link> page.</p>

                </div>

                <div className='d-flex flex-column align-items-center mt-5 px-3'>
                    <h2>Get in touch!</h2>
                    <p style={{textAlign: 'justify'}}>We love to hear from the people who actively use the website. Whether it's about things that we could be doing better, or what you already like about the website, we are only too happy to hear it. All feedback, good and bad, is very welcome.</p>
                    <p style={{textAlign: 'justify'}}>Please get in touch using our <Link style={{textDecoration: 'underline', color: COLORS.linkColor}} to={APP_CONTACT_URL} onClick={()=>a('homepage:contact page:click')}>contact page</Link>.</p>
                </div>

            </div>

            <ShareLinks styles={{marginBottom: 50, marginTop: 50}} />

            <Footer />
        </>
    )
}

export default HomeScreen