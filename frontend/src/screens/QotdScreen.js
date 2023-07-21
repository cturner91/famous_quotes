import React, {useContext, useEffect, useState} from 'react'

import Quote from '../components/Quote'
import { genericRequest } from '../data/utils'
import GenericScreen from './GenericScreen'
import { API_CATEGORIES_URL, API_QOTD_URL, APP_QOTD_URL, PROD_BASE_URL } from '../data/constants'
import ShareLinks from '../components/ShareLinks'
import { GlobalContext } from '../data/GlobalContext'


const QotdScreen = (props) => {

    const {dispatch} = useContext(GlobalContext)

    const [categories, setCategories] = useState([])
    const [quote, setQuote] = useState({})
    const [showQuote, setShowQuote] = useState(false)

    const urlSearchParams = new URLSearchParams(window.location.search)
    const searchParams = Object.fromEntries(urlSearchParams.entries())
    const urlCategory = searchParams['c']
    const [category, setCategory] = useState(urlCategory)


    useEffect( () => {
        const effectAsync = async () => {
            const response = await genericRequest({
                url: API_CATEGORIES_URL,
                method: 'GET'
            })
            if (response.status===200) {
                setCategories(response['data']['data'])
            }
        }
        effectAsync()

        getQotd(urlCategory)
    }, [])

    const buttonStyle = {
        width: 120,
    }

    const quoteStyle = showQuote ? 
    {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
        marginTop: 30,
        opacity: 1,
        transition: 'opacity 400ms ease-in-out',
    } : {
        opacity: 0,
    }

    const getQotd = async (category) => {
        const url = category ? `${API_QOTD_URL}?category=${category}` : API_QOTD_URL
        const response = await genericRequest({
            url,
            method: 'GET'
        })
        setShowQuote(false) // set blank and then quickly update to make opacity transition run again
        if (response.status===200) {
            setTimeout(()=>setQuote(response['data']['quote']), 50)
            setTimeout(()=>setShowQuote(true), 100)
        } else {
            // console.log(response)
        }
    }

    const categoryChangeHandler = (category) => {
        dispatch({type: 'ADD_ANALYTIC', action: `qotd screen:change category:${category}`})
        window.history.pushState(null, window.title, `${APP_QOTD_URL}?c=${category}`)
        setCategory(category)
        getQotd(category)
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Quote of the day | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Quote of the day from Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_QOTD_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_QOTD_URL}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Quote of the day | Famous-Quotes.uk'}>
            <div className='container text-center mb-5'>
                {quote.id ?
                    <div style={quoteStyle} className='m-auto text-center'>
                        <Quote data={quote} showStats={true} showActions={true} styles={{marginBottom: 30, marginTop: 30}} />
                    </div>
                : null}
                <div className='text-center mt-3 d-flex flex-column align-items-center'>
                    <h3 style={{textAlign: 'center'}}>Choose Category for Quote of the Day</h3>
                    <select 
                        style={{width: '80%', maxWidth: 400, borderRadius: 10, padding: 5, fontSize: 20}}
                        className='text-center' 
                        value={category} 
                        onChange={(e)=>categoryChangeHandler(e.target.value)}
                    >
                        <option value=''>All categories</option>
                        {categories.map( (category, i) => {
                            return (
                                <option
                                    key={`option${i}`} 
                                    value={category.category}
                                >{category.category}</option>
                            )
                        })}
                    </select>
                </div>
            </div>

            <ShareLinks styles={{marginBottom: 50}} />

        </GenericScreen>
    )
}

export default QotdScreen