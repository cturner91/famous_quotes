import React from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_URL, PROD_BASE_URL } from '../data/constants'

import GenericScreen from './GenericScreen'


const NotFoundScreen = (props) => {

    const navigate = useNavigate()

    const pStyle = {
        textAlign: 'center',
        paddingTop: 10,
        paddingBottom: 10,
    }

    const buttonStyle = {
        height: 75,
        width: 100,
    }
    const buttonDivStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Page not found | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: '404 - Page not found.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: ''},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: ''},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Page not found | Famous-Quotes.uk'}>
            <div className='container text-justify mb-5 py-5 px-3' style={{maxWidth: 800}}>
                <h1 style={{textAlign: 'center'}}>404 - Page not found</h1>
                <p style={pStyle}>We're not sure how you've ended up here... Did you enter the link yourself and maybe mistyped something?</p>
                <p style={pStyle}>Anyway - where would you like to go now?</p>

                <div className='w-100 d-flex flex-row justify-content-around'>

                    <button 
                        style={buttonStyle} 
                        className='btn btn-dark'
                        onClick={()=>navigate(-1)}
                    >
                        <div style={buttonDivStyle}>
                            <span>Go back</span>
                            <i className="fa-solid fa-arrow-left" />
                        </div>
                    </button>

                    <button
                        style={buttonStyle} 
                        className='btn btn-dark'
                        onClick={()=>navigate(APP_URL)}
                    >
                        <div style={buttonDivStyle}>
                            <span>Go home</span>
                            <i className="fa-solid fa-house" />
                        </div>
                    </button>

                </div>
            </div>
        </GenericScreen>
    )
}

export default NotFoundScreen