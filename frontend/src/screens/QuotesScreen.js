import React, { useEffect, useState, useContext, useRef } from 'react'

import Quote from '../components/Quote'
import Modal from '../components/Modal'
import QuoteFilterBox from '../components/QuoteFilterBox'
import GenericScreen from './GenericScreen'
import { GlobalContext } from '../data/GlobalContext'
import { genericRequest, getCurrentWindowLocation, getCurrentWindowSearch, getValue } from '../data/utils'
import { API_CATEGORIES_URL, API_QUOTE_URL, APP_QUOTES_URL, DEFAULT_N_QUOTES, PROD_BASE_URL } from '../data/constants'
import ShareLinks from '../components/ShareLinks'


const QuotesScreen = (props) => {

    const {state, dispatch} = useContext(GlobalContext)
    // console.log(state)

    const urlSearchParams = new URLSearchParams(window.location.search)
    const searchParams = Object.fromEntries(urlSearchParams.entries())
    const o = searchParams.o ? searchParams.o : 0
    const n = searchParams.n ? searchParams.n : DEFAULT_N_QUOTES

    const [quotes, setQuotes] = useState([])
    const [showFilters, setShowFilters] = useState(Number(searchParams['filter']) ? true : false)  // filter option only used to preload filter-box when linked via home-screen. Should never otherwise be used
    const [categories, setCategories] = useState([])
    const href = useRef(window.location.href)

    const buildSearchString = (offset) => {
        // keep all search parameters the same but modify the offset to the given value
        const offsetChecked = offset < 0 ? 0 : offset // do not allow offsets < 0
        let url = ''

        // check if offset is actually in searchParams - if blank object, we won't update the url at all
        const searchKeys = Object.keys(searchParams)
        if (searchKeys.indexOf('o') < 0) searchParams.o = 0

        // iterate and rebuild the URL from scratch
        Object.keys(searchParams).forEach( (key,i) =>{
            const delimiter = i===0 ? '?' : '&'
            if (key==='o') {
                url += `${delimiter}${key}=${offsetChecked}`
            } else {
                url += `${delimiter}${key}=${searchParams[key]}`
            }
        })
        return url
    }


    const getQuotesFromApi = async (searchParams) => {
        const url = `${API_QUOTE_URL}${searchParams}`
        const response = await genericRequest({
            url, method: 'GET'
        })
        // console.log(response)
        if (response['data']['data'].length === 0) alert('No quotes found!')
        setQuotes(response['data']['data'])
        dispatch({type: 'EXTEND_QUOTES', quotes: response['data']['data']})
    }

    useEffect( ()=> {
        setTimeout(getQuotesFromApi(window.location.search), 100)

        const getCategories = async () => {
            const response = await genericRequest({
                url: API_CATEGORIES_URL, method: 'GET'
            })
            if (response.status===200) {
                setCategories(response['data']['data'])
            }
        }
        getCategories()

        const checkUrlForChanges = () => {
            if (href.current !== getCurrentWindowLocation()) {
                href.current = getCurrentWindowLocation()
                getQuotesFromApi(getCurrentWindowSearch())
            }
        }
        const x = setInterval(() => checkUrlForChanges(), 1000)

        return ()=> clearInterval(x)
    }, [])

    const nextOrPreviousQuotes = (offset) => {
        // setQuotes([])
        const searchString = buildSearchString(offset)
        window.history.pushState(null, window.title, `${APP_QUOTES_URL}${searchString}`)
        getQuotesFromApi(searchString)
        setTimeout( ()=>document.body.scrollTop = document.documentElement.scrollTop = 0, 200)
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Search quotes | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Search our database at Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_QUOTES_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_QUOTES_URL}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Search quotes | Famous-Quotes.uk'}>
            <div className='d-flex flex-column align-items-center'>
                <button 
                    className='btn btn-lg btn-primary my-3' 
                    onClick={()=>{
                        dispatch({type: 'ADD_ANALYTIC', action: 'quotes screen:search quotes button:click'})
                        setShowFilters(!showFilters)
                    }}
                >
                    <i className="fa-solid fa-filter-list"></i>
                    Search for Quotes
                </button>
                <h2>{getValue(state, ['search','sortByDisplay'])} Quotes</h2>
                <span>Click on any quote to see more details for it.</span>

                <div className='d-flex flex-column align-items-center'>
                    {quotes.length === 0 ? <div className='spinner-border' style={{fontSize: 30}}></div> :quotes.map( (quote, i)=>{
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
                        )
                    })}
                </div>

                <div className='w-100 d-flex flex-row justify-content-around my-5'>
                    <div className='d-flex flex-column align-items-center'>
                        <button 
                            className='btn btn-sm btn-primary' 
                            disabled={Number(o) === 0 ? true : false}
                            onClick={()=>{
                                dispatch({type: 'ADD_ANALYTIC', action: `quotes screen:previous quotes button:click`})
                                nextOrPreviousQuotes(Number(o)-Number(n))
                            }}
                        >&lt;</button>
                        <span>Previous quotes</span>
                    </div>
                    <div className='d-flex flex-column align-items-center'>
                        <button 
                            className='btn btn-sm btn-primary'
                            onClick={()=>{
                                dispatch({type: 'ADD_ANALYTIC', action: `quotes screen:next quotes button:click`})
                                nextOrPreviousQuotes(Number(o)+Number(n))
                            }}
                        >&gt;</button>
                        <span>Next quotes</span>
                    </div>
                </div>

                <Modal hideModalHandler={()=>{
                        dispatch({type: 'ADD_ANALYTIC', action: 'quotes screen:hide modal handler'})
                        setShowFilters(false)
                    }}
                    show={showFilters}
                >
                    <QuoteFilterBox 
                        allCategories={categories} 
                        hideModalHandler={()=>setShowFilters(false)} 
                        updateQuotesHandler={getQuotesFromApi}
                        setQuotes={setQuotes}
                    />
                </Modal>
            </div>

            <ShareLinks 
                title='Share these quotes'
                styles={{marginBottom: 50}}
            />
        </GenericScreen>
    )
}

export default QuotesScreen