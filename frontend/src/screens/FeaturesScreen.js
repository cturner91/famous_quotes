import React from 'react'
import { APP_FEATURES_URL, PROD_BASE_URL } from '../data/constants'

import GenericScreen from './GenericScreen'


const FeaturesScreen = (props) => {

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Upcoming features | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'A list of planned new features for Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_FEATURES_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_FEATURES_URL}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'New features | Famous-Quotes.uk'}>
            <div className='container my-5'>
                <h1 style={{textAlign: 'center'}}>New features in the pipeline:</h1>
                <ul>
                    <li>Ability to upvote / downvote comments under quotes</li>
                    <li>Social media profiles</li>
                </ul>
            </div>
        </GenericScreen>
    )
}

export default FeaturesScreen