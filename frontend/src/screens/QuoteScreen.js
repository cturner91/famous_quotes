import React, {useContext, useEffect, useState} from 'react'

import { Link } from 'react-router-dom'
import { Transition } from 'react-transition-group'

import Quote from '../components/Quote'
import VoteHistory from '../components/VoteHistory'
import { GlobalContext } from '../data/GlobalContext'
import { genericRequest } from '../data/utils'
import GenericScreen from './GenericScreen'
import { API_COMMENTS_URL, API_QUOTE_URL, API_VOTES_URL, APP_QUOTE_URL, APP_QUOTE_VIEW_URL, PROD_BASE_URL } from '../data/constants'
import { defaultMaxN } from '../data/constants'
import PostComment from '../components/Comments/PostComment'
import Comment from '../components/Comments/Comment'
import ShareLinks from '../components/ShareLinks'


const QuoteScreen = (props) => {

    const {state, dispatch} = useContext(GlobalContext)

    const getQuoteId = () => {
        const urlSearchParams = new URLSearchParams(window.location.search)
        const searchParams = Object.fromEntries(urlSearchParams.entries())
        return searchParams['id']
    }

    const [quoteId, setQuoteId] = useState(getQuoteId())
    const [quote, setQuote] = useState({})
    const [voteData, setVoteData] = useState({})
    const [comments, setComments] = useState([])
    
    const getQuote = async (quoteId) => {

        // check STATE first - if it is saved locally, no need to call API
        const quoteIdInState = state.quotes.find( quote=>quote.id === Number(quoteId))
        let newQuote
        if (quoteIdInState) {
            newQuote = quoteIdInState
        } else {
            const response = await genericRequest({url: `${API_QUOTE_URL}?ids=${quoteId}`})
            // console.log(response)
            if (response.status===200) {
                if (response.data.data.length === 0) {
                    alert('Sorry - this quote does not exist!')
                    return
                }    
                newQuote = response.data.data[0]    
            } else {
                alert('Something went wrong:\n'+response.data.message)
                return
            }
        }
        setQuote(newQuote)
        dispatch({type: 'SET_QUOTE', quote: newQuote})  // set quote in context so we can make a quote-view if required
        dispatch({type: 'EXTEND_QUOTES', quotes: [newQuote]})  // add to quotes in memory for faster loading if we go back
        setQuoteId(quoteId)
        window.history.pushState(null, window.title, `${APP_QUOTE_URL}?id=${quoteId}`)

        // get quote VOTE history (don't cache votes - could be thousands of them)
        const response = await genericRequest({url: `${API_VOTES_URL}?quote=${quoteId}`})
        setVoteData(response.data)

        // get comments
        const response2 = await genericRequest({url: `${API_COMMENTS_URL}?quote=${quoteId}`})
        setComments(response2.data.data)
    }

    useEffect( ()=>{
        getQuote(quoteId)
    }, [])

    const LinkButton = (props) => {
        const styles = {
            cursor: 'pointer',
        }
        return (
            <div style={styles} className='d-flex flex-column align-items-center' onClick={props.callback}>
                <button className='btn btn-primary'>{props.text}</button>
                <span style={{fontSize: 12}}>{props.label}</span>
            </div>
        )
    }

    const transitionStyles = {
        entering: {opacity: 0},
        entered: {opacity: 1},
        exiting: {opacity: 1},
        exited: {opacity: 0},
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'View quote | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'View this quote on Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_QUOTE_URL}?${quoteId}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_QUOTE_URL}?${quoteId}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'View quote | Famous-Quotes.uk'}>
            <div className='container text-center my-5'>

                <div className='w-100 d-flex flex-row justify-content-around mb-3'>
                    <LinkButton text='<' label='Previous Quote' callback={()=>{ 
                        getQuote(Number(quoteId)-1) 
                        dispatch({type: 'ADD_ANALYTIC', action: `quote screen:quote ${quoteId}:previous quote button:click`})
                    }} />
                    <LinkButton text='?' label='Random Quote' callback={()=>{ 
                        getQuote(Math.floor(Math.random()*defaultMaxN)+1) 
                        dispatch({type: 'ADD_ANALYTIC', action: `quote screen:quote ${quoteId}:random quote button:click`})
                    }} />
                    <LinkButton text='>' label='Next Quote' callback={()=>{ 
                        getQuote(Number(quoteId)+1) 
                        dispatch({type: 'ADD_ANALYTIC', action: `quote screen:quote ${quoteId}:next quote button:click`})
                    }} />
                </div>

                {!quote.quote ?
                <div className='d-flex flex-column align-items-center justify-content-center' style={{minHeight: 200}}>
                    <div className='spinner-border' style={{width: 50, height: 50, fontSize: 30}}></div>
                </div>
                :
                <div className='w-100 d-flex flex-column align-items-center'>

                    <Transition in={true} appear={true} timeout={400}>
                        { state => {
                            return (
                                <Quote 
                                    data={quote} 
                                    styles={{
                                        ...transitionStyles[state],
                                        width: '100%',
                                    }} 
                                    showActions={true} 
                                    showStats={true}
                                    showCategories={true} 
                                    showReport={true}
                                />
                            )
                        }}
                    </Transition>

                    <Link to={`${APP_QUOTE_VIEW_URL}`} className='mt-3' onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: `quote screen:quote ${quoteId}:create view button:click`, forceCommit: true})}>
                        <button className='btn btn-lg btn-primary'>Create Quote View</button>
                    </Link>

                    <VoteHistory data={voteData} />

                    <PostComment 
                        raiseComment={(comment)=>setComments([comment, ...comments])}
                        user={state.user}
                        quoteId={quoteId}
                    />

                    {comments.length===0 ? <p style={{marginTop: 20}}>No comments yet. Want to be the first?</p> 
                    : comments.map( (comment, i)=>{
                        return (
                            <Comment key={`comment${i}`} data={comment} />
                        )
                    })}

                    <ShareLinks styles={{marginTop: 50, marginBottom: 50}} />
                </div>
                }
            </div>
        </GenericScreen>
    )
}

export default QuoteScreen