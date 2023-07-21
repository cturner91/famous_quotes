import React from 'react'
import { APP_ABOUT_URL, PROD_BASE_URL } from '../data/constants'

import GenericScreen from './GenericScreen'


const AboutScreen = (props) => {

    const pStyle = {
        textAlign: 'justify',
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'About Us | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'About the team behind Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_ABOUT_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_ABOUT_URL}`},
    ]

    return (
        <GenericScreen metas={metas} links={links} title={'About us | Famous-Quotes.uk'}>
            <div className='container text-justify mb-5 py-5' style={{maxWidth: 800}}>
                <h2 style={{textAlign: 'center'}}>Why make Famous-Quotes.uk?</h2>
                <p style={pStyle}>
                    We love good quotes, and how they can totally change our outlook on any given day. When we have previously tried to search for quotes, we found Google's results to be a little lacking. We often had to check out multiple links and scan a lot of pages of quotes to find what we needed.
                </p>

                <p style={pStyle}>
                    There did not seem to be a single source of the world's best quotes available in one place. That is what we are hoping this website can become. By allowing all users to vote on quotes, we hope that the most meaningful ones will naturally rise to the top.
                </p>

                <p style={pStyle}>
                    What's more - we encourage people to comment on quotes to add that personal touch, and we make it easy to report quotes if they are accredited to the wrong person. This, coupled with our popularity scoring, helps ensure that you only get the most relevant and accurate quotes.
                </p>

                <h2 style={{textAlign: 'center', marginTop: 30}}>Why use Famous-Quotes.uk?</h2>
                <p style={pStyle}>
                    Famous-Quotes.uk offers more features than similar sites. As well as being able to search quotes based on multiple parameters, you can curate your favourite quotes into different lists which you can come back to when you need. Furthermore, our quote-views feature can turn quotes into Instagram-worthy graphics. And the ability to comment on quotes brings a social aspect to your visit.
                </p>

                <p style={pStyle}>
                    We have tried to make the best quotes site out there, and we hope you agree. And if you have any recommendations for how we could be doing better, please do just get in touch and let us know!
                </p>

            </div>
        </GenericScreen>
    )
}

export default AboutScreen