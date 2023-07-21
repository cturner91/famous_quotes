import React, { useEffect, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import Quote from '../components/Quote'
import { genericRequest } from '../data/utils'
import GenericScreen from './GenericScreen'
import { API_QUOTE_LIST_URL, APP_ACCOUNT_URL, APP_QUOTELIST_URL, APP_QUOTES_URL, COLORS, PROD_BASE_URL } from '../data/constants'
import ShareLinks from '../components/ShareLinks'


const QuotelistScreen = (props) => {

    const navigate = useNavigate()

    const urlSearchParams = new URLSearchParams(window.location.search)
    const searchParams = Object.fromEntries(urlSearchParams.entries())
    const eid = searchParams['eid']

    const [quotes, setQuotes] = useState([])
    const [title, setTitle] = useState('')
    const [requestComplete, setRequestComplete] = useState(false)

    useEffect( ()=> {
        if (!eid) {
            alert('URL does not have a quotelist ID. Did you get lost?')
            navigate(APP_QUOTES_URL)
        }
        const getQuotes = async () => {
            const response = await genericRequest({
                url: `${API_QUOTE_LIST_URL}?eid=${eid}`,
                method: 'GET',
            })
            // console.log(response)

            setRequestComplete(true)
            if (response.status===200) {
                setTitle(response.data.data[0].name)
                setQuotes(response.data.data[0].quotes)
            } else {
                alert(`Something went wrong:\n${response.data.message}`)
            }
        }
        getQuotes()
    }, [eid, navigate])

    const NoQuotesDiv = () => {
        return (
            <div className='d-flex flex-column align-items-center w-100'>
                <p>This quote list has no quotes!</p>
                <div className='d-flex flex-row justify-content-around w-100'>
                    <Link style={{color: COLORS.linkColor}} to={'/'}><button className='btn btn-dark'>Go to Home</button></Link>
                    <Link style={{color: COLORS.linkColor}} to={APP_QUOTES_URL}><button className='btn btn-dark'>Search Quotes</button></Link>
                    <Link style={{color: COLORS.linkColor}} to={APP_ACCOUNT_URL}><button className='btn btn-dark'>Go to your account</button></Link>
                </div>
            </div>
        )
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'View quote list | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'View quote list on Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_QUOTELIST_URL}?${eid}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_QUOTELIST_URL}?${eid}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'View quote list | Famous-Quotes.uk'}>
            <div className='container my-5'>
                <div className='d-flex flex-column align-items-center'>
                    {!requestComplete ? <div className='spinner-border' style={{fontSize: 30}}></div> : null}
                    {requestComplete && quotes.length === 0 ? <NoQuotesDiv /> : 
                        <div className='d-flex flex-column align-items-center'>
                        <h2>{title}</h2>
                        {quotes.map( (quote, i)=>{
                            return (
                                <Quote 
                                    key={`quote${i}`}
                                    showStats={false}
                                    showActions={true}
                                    showReport={false}
                                    showCategories={true}
                                    data={quote} 
                                    styles={{alignSelf: 'stretch'}}
                                />
                            )})
                        }
                        <div style={{height: 50}}></div>
                        <ShareLinks title='Share this list of quotes' />
                    </div>
                    }
                </div>
            </div>
        </GenericScreen>
    )
}

export default QuotelistScreen