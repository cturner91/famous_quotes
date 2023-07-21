import React from 'react'

import GenericScreen from './GenericScreen'
import { API_QUOTE_URL, APP_DEVELOPER_URL, COLORS, EMAIL, PROD_BASE_URL } from '../data/constants'


const DeveloperInfoScreen = (props) => {

    const requests_data = [
        {parameter: 's', boldText: 'Sort by', description: "define how to sort the results. Allowable entries are: 'random', 'newest', 'oldest', 'popularity', 'net_votes', 'total_upvotes', 'total_downvotes','-popularity', '-net_votes', '-total_upvotes', '-total_downvotes'."},
        {parameter: 'ids', boldText: 'Quote IDs', description: 'if you know the IDs of the quotes you want in our database, enter them as a comma-separated list.'},
        {parameter: 'n', boldText: 'Number of quotes', description: 'number of quotes to be returned. Maximum is currently 20.'},
        {parameter: 'o', boldText: 'Offset', description: 'since results are paginated with maximum 20 returned at a time, use the offset to access the "next" N quotes.'},
        {parameter: 'author', boldText: 'Author', description: "Wilcard match for quote author. Case insensitive. Entering 'church' would match both 'Winston Churchill' and 'Charlotte Church'."},
        {parameter: 'quote', boldText: 'Quote text', description: 'Wildcard match for quote text. Case insensitive.'},
        {parameter: 'context', boldText: 'Context', description: 'Wildcard match for quote context. Case insensitive.'},
        {parameter: 'categories', boldText: 'Categories', description: "The categories assigned to any given quote. List is subject to change, but currently must be one of: 'motivation', 'love', 'sport', 'education', 'programming', 'career', 'success', 'politics', 'health', 'funny', 'travel', 'lifestyle', 'failure', 'forgiveness', 'life', 'romance'."},
    ]

    const response_data = [
        {parameter: 'id', description: 'The ID value of the quote in our database.'},
        {parameter: 'quote', description: 'The quote text.'},
        {parameter: 'author', description: 'The author of the quote.'},
        {parameter: 'context', description: 'The context of the quote e.g. if the quote is from a movie or a book etc.'},
        {parameter: 'total_upvotes', description: 'The total number of upvotes cast by users of Famous-Quotes.uk.'},
        {parameter: 'total_downvotes', description: 'The total number of downvotes cast by users of Famous-Quotes.uk.'},
        {parameter: 'net_votes', description: 'total_upvotes minus total_downvotes.'},
        {parameter: 'Popularity', description: 'A popularity rating value between 0-1. Calculated using the formula: Popularity = total_upvotes / (total_upvotes + total_downvotes). A scaling factor is also applied to ensure quotes with more votes get precedence over brand new quotes. A single vote is capped at 80% / 20%, and scales linearly until 20 votes, where 100% / 0% become achievable'},
        {parameter: 'categories', description: 'Any categories associated with the quote.'},
    ]

    const examples = [
        {description: 'The 10 most recently added quotes:', link: `${API_QUOTE_URL}?s=newest&n=10`},
        {description: '10 randomly-ordered quotes by Winston Churchill:', link: `${API_QUOTE_URL}?s=random&n=10&author=winston%20churchill`},
        {description: 'The top 5 least popular quotes:', link: `${API_QUOTE_URL}?s=popularity&n=5`},
        {description: 'And the next 5 least popular quotes:', link: `${API_QUOTE_URL}?s=popularity&n=5&o=5`},
        {description: 'The 5 oldest quotes above love:', link: `${API_QUOTE_URL}?s=oldest&n=5&categories=love`},
        {description: 'The most popular quotes about sports and success:', link: `${API_QUOTE_URL}?s=-popularity&categories=sport,success`},
        {description: 'Using an invalid sorting value:', link: `${API_QUOTE_URL}?s=-created_at`},
    ]

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Developer API info | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Info on our quotes API at Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_DEVELOPER_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_DEVELOPER_URL}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Developer Info | Famous-Quotes.uk'}>
            <div className='container my-5'>
                <div className='text-center'>
                    <h1>Developer Info</h1>
                    <p>All quote data is accessible via an API hosted at this location:</p>
                    <p>{<a style={{color: COLORS.linkColor}} target='_blank' rel='noreferrer' href={API_QUOTE_URL}>{API_QUOTE_URL}</a>}</p> 
                </div>

                <h2 style={{textAlign: 'center', marginTop: 30}}>Terms of use</h2>
                <p>If you would like to use the API for your own website, get in touch and we can whitelist your domain. <b>Credit must be given to famous-quotes.uk</b> or your domain will be hastily un-whitelisted.</p>
                <p><b>Authentication</b>: There is no requirement for authentication to the API currently. This may change if the API is subjected to abuse.</p>
                <p><b>Rate-limiting</b>: Scraping the entire database is not permitted. Reasonable, moderate use is permitted. IP addresses are monitored and can be blocked if found to be abusing the system. Preferably, multiple requests would include a period of sleep between them to avoid interrupting normal use of the website.</p>

                <h2 style={{textAlign: 'center', marginTop: 30}}>Requests</h2>
                <p>The API accepts the following query parameters in the URL via GET:</p>
                <table className='table table-bordered table-striped' style={{verticalAlign: 'middle'}}>
                    <thead>
                        <tr>
                            <th style={{textAlign: 'center'}}>Parameter</th>
                            <th style={{textAlign: 'center'}}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests_data.map( (data,i) => {
                            return (
                                <tr key={`requestsRow${i}`}>
                                    <td style={{textAlign: 'center'}}>{data.parameter}</td>
                                    <td><b>{data.boldText}</b> - {data.description}</td>
                                </tr>    
                            )
                        })}
                    </tbody>
                </table>


                <h2 style={{marginTop: 30, textAlign: 'center'}}>Repsonse</h2>
                <p>The response contains two main variables: 'message' and 'data'. If the request fails, the message will outline why it has failed. If the message is OK, then the 'data' variable should be populated.</p>
                <p>The data is a list of quotes, each of which has the following values:</p>
                <table className='table table-bordered table-striped' style={{verticalAlign: 'middle'}}>
                    <thead>
                        <tr>
                            <th style={{textAlign: 'center'}}>Value</th>
                            <th style={{textAlign: 'center'}}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {response_data.map( (data,i) => {
                            return (
                                <tr key={`responseRow${i}`}>
                                    <td style={{textAlign: 'center'}}>{data.parameter}</td>
                                    <td>{data.description}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                
                <h2 style={{marginTop: 30, textAlign: 'center'}}>Examples</h2>

                <table className='table table-bordered table-striped'>
                    <thead>
                        <tr>
                            <th style={{textAlign: 'center'}}>Description</th>
                            <th style={{textAlign: 'center'}}>URL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {examples.map( (example,i) => {
                            return (
                                <tr key={`example${i}`}>
                                    <td>{example.description}</td>
                                    <td style={{textAlign: 'center', verticalAlign: 'middle'}}><a target='_blank' rel='noreferrer' style={{color: COLORS.linkColor}} href={example.link}>{example.link}</a></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div className='text-center mt-5'>
                    Any questions, feel free to get in touch at <a style={{color: COLORS.linkColor}} href={`mailto:${EMAIL}`}>{EMAIL}</a>.
                </div>

            </div>
        </GenericScreen>
    )
}

export default DeveloperInfoScreen