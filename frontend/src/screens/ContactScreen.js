import React from 'react'

import { Link } from 'react-router-dom'

import GenericScreen from './GenericScreen'
import { APP_ACCOUNT_URL, APP_CONTACT_URL, COLORS, EMAIL, PROD_BASE_URL } from '../data/constants'


const ContactScreen = (props) => {

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Contact us | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Contact us at Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_CONTACT_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_CONTACT_URL}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Contact us | Famous-Quotes.uk'}>
            <div className='container text-center my-5 px-3'>
                <h1 style={{textAlign: 'center'}}>Contact Us</h1>
                <p style={{textAlign: 'justify'}}>If you want to contact us privately, you can do so on your <Link style={{color: COLORS.linkColor}} to={`${APP_ACCOUNT_URL}`}>account page</Link>. We will do our best to get back to you quickly (via your account page).</p>
                <p style={{textAlign: 'justify'}}>If necessary to contact us about something important or urgent e.g. a legal matter, please email us directly at <a style={{textDecoration: 'underline', color: COLORS.linkColor}} href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
            </div>
        </GenericScreen>
    )
}

export default ContactScreen