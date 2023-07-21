import React from 'react'

import QuoteView from '../components/QuoteViewScreen/QuoteView'
import { APP_QUOTE_VIEW_URL, PROD_BASE_URL } from '../data/constants'
import GenericScreen from './GenericScreen'


const QuoteViewScreen = (props) => {

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Quote view | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Take a look at this quote-view on Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_QUOTE_VIEW_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_QUOTE_VIEW_URL}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Quote view | Famous-Quotes.uk'}>
            <QuoteView />
        </GenericScreen>
    )
}

export default QuoteViewScreen