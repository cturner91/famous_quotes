import React, {useContext, useEffect, useState} from 'react'

import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

import QuoteList from '../components/AccountScreen/QuoteList'
import GenericScreen from './GenericScreen'
import VoteHistory from '../components/VoteHistory'
import { GlobalContext } from '../data/GlobalContext'
import { APP_ACCOUNT_URL, APP_ADD_QUOTE_URL, PROD_BASE_URL } from '../data/constants'
import { deduplicate, genericRequest, getValue } from '../data/utils'
import { API_LOGOUT_URL, APP_LOGIN_URL, API_USER_URL, API_SESSION_URL, API_VOTES_URL, COLORS, APP_QUOTES_URL } from '../data/constants'
import PostComment from '../components/Comments/PostComment'
import Comment from '../components/Comments/Comment'
import PersonalInfo from '../components/AccountScreen/PersonalInfo'

axios.defaults.withCredentials = true  // necessary to persist sessions


const AccountScreen = (props) => {

    const navigate = useNavigate()

    const {state, dispatch} = useContext(GlobalContext)
    // console.log(state)

    const [voteData, setVoteData] = useState({})
    const [comments, setComments] = useState(null)

    const getVoteSummaryData = (userId) => {
        axios({
            url: `${API_VOTES_URL}?user=${userId}&x=1`,
            method: 'GET',
        })
        .catch( error=>console.log(error) )
        .then (response => { 
            setVoteData(response['data'])
        })
    }

    // if user is not logged in, we cannot show this screen
    // if user is logged in, always call API for full user data, and load screen from that
    useEffect( ()=>{
        axios({
            url: API_SESSION_URL,
            method: 'POST',
        })
        .catch (error=>{
            console.log(error)
        })
        .then( response => {
            // console.log(response['data'])
            let userId
            if (response.status!==200) {
                console.log(response)
                return
            }
            if (response['data']['valid']) {
                userId = response['data']['user']
            } else {
                alert('Could not get your user, please login again.')
                dispatch({type: 'SET_USER', user: null})  // need to invalidate user within state to avoid infinite loop
                navigate(APP_LOGIN_URL)    
            }
            
            // in some niche cases, session could be valid but userId could be _undefined_. This causes infinite loop...
            if (!userId) {
                navigate(APP_LOGIN_URL)
            }
            
            axios({
                url: `${API_USER_URL}?id=${userId}&s=1`,
                method: 'GET',
            })
            .catch( error=>{
                // console.log(error)
                alert('Could not get your user data, please login again.')
                dispatch({type: 'SET_USER', user: null})  // need to invalidate user within state to avoid infinite loop
                navigate(APP_LOGIN_URL)
            })
            .then( response => {
                // console.log(response)
                const userData = response['data']['user']
                dispatch({type: 'SET_USER', user: userData})
                getVoteSummaryData(userId)
            })
        })
    }, [])


    const logoutHandler = async () => {
        const response = await genericRequest({
            url: API_LOGOUT_URL,
            method: 'POST',
        })
        if (response.status === 200) {
            dispatch({type: 'ADD_ANALYTIC', action: 'account screen:logout button:click:success'})
            window.location.href = APP_LOGIN_URL // navigate() doesn't seem to work?
        } else {
            dispatch({type: 'ADD_ANALYTIC', action: 'account screen:logout button:click:failed'})
            alert('Something went wrong, couldn\'t log out\n'+response.data.message)
        }
    }

    const recentUpvotes   = state.user && state.user.votes ? deduplicate(state.user.votes,['quote','id'])
        .filter( vote=>vote.value===1)
        .map(vote=>vote.quote)
        .slice(0, 20) 
        : []
    const recentDownvotes = state.user && state.user.votes ? deduplicate(state.user.votes,['quote','id'])
        .filter( vote=>vote.value===-1)
        .map(vote=>vote.quote) 
        .slice(0, 20)
        : []

    const quotelists = getValue(state, ['user','quotelists']) || []
    const userSubmittedQuotes = getValue(state, ['user','quotes']) || []

    // ensure comments are sorted by most-recent first, and filtered to only their profile comments
    if(comments===null && state.user && getValue(state, ['user', 'comments'])) {
        const xs = getValue(state, ['user', 'comments'])
            .filter( comment=>!comment.quote )
            .sort( (a,b) => a.created_at > b.created_at ? -1 : 1 )
        setComments(xs)
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'My Account | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Account details on Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_ACCOUNT_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_ACCOUNT_URL}`},
    ]

    return (
        <GenericScreen metas={metas} links={links} title={'My account | Famous-Quotes.uk'}>
            {!state.user ?
                <div className='container my-5 d-flex flex-column align-items-center'>
                    <span>Loading user data...</span>
                    <div className='spinner-border mt-3' style={{width: 50, height: 50, fontSize: 30}}></div>
                </div>
            :
               <div className='container' style={{marginTop: 40}}>
                    <div className='my-3 d-flex flex-row justify-content-around' style={{maxWidth: 600, margin: 'auto'}}>
                        <span style={{fontSize: 24}}>Hi {state.user.first_name}!</span>
                    </div>

                    <div>
                        <PersonalInfo />
                    </div>

                    <div className='row d-flex justify-content-around'>
                        <h2 style={{textAlign: 'center', marginBottom: 20, marginTop: 20}}>Your saved lists of quotes:</h2>
                        {quotelists.length === 0 ? 
                        <>
                            <p style={{textAlign: 'center'}}>No saved quote-lists. <Link to={APP_QUOTES_URL} style={{color: COLORS.linkColor}}>View some quotes</Link> and add them to lists!</p>
                        </>
                        : quotelists.map( (quotelist,i) => {
                            return (
                                <QuoteList 
                                    key={`quotelist${i}`}
                                    id={quotelist.id}
                                    name={quotelist.name} 
                                    quotes={quotelist.quotes}
                                    externalId={quotelist.external_id}
                                    quotelistAdd={false}
                                    quoteConfig={{
                                        defaultShowMeta: false,
                                    }}
                                />
                            )
                        })}
                    </div>

                    <div className='row d-flex justify-content-around'>
                        <h2 style={{textAlign: 'center', marginTop: 50}}>Your submitted quotes:</h2>
                        {userSubmittedQuotes.length === 0 ? 
                            <p style={{textAlign: 'center'}}>No submitted quotes. Want to <Link to={APP_ADD_QUOTE_URL} style={{color: COLORS.linkColor}}>add one</Link>?</p>
                            : 
                            <QuoteList
                                name={'Your added quotes:'} 
                                quotes={userSubmittedQuotes} 
                                styles={{width: '100%', maxWidth: 600, marginTop: 10}}
                                quote
                                quoteConfig={{
                                    defaultShowMeta: true,
                                    showCategories: true,
                                    showActions: true,
                                    showStats: true,
                                }}
                            />
                        }
                    </div>

                    {Object.keys(voteData).length > 0 && voteData.summary && voteData.summary.monthly && Object.keys(voteData.summary.monthly).length > 0 ? 
                        <div className='row d-flex justify-content-around mt-3'>
                            <h2 style={{textAlign: 'center', marginBottom: 20, marginTop: 40}}>Your recent votes:</h2>
                            <QuoteList
                                name={'Your recent upvotes:'} 
                                quotes={recentUpvotes} 
                                quoteConfig={{
                                    showActions: true,
                                }}
                            />
                            <QuoteList
                                name={'Your recent downvotes:'} 
                                quotes={recentDownvotes} 
                                quoteConfig={{
                                    showActions: true,
                                }}
                            />
                            <VoteHistory
                                data={{summary: voteData['summary']}}
                                format={ Object.keys(voteData.summary.monthly).length > 2 ? 'monthly' : 'daily'}
                            />
                        </div>
                    : 
                        <>
                            <p style={{textAlign: 'center'}}>No votes registered on your account yet.</p>
                            <p style={{textAlign: 'center'}}><Link to={APP_QUOTES_URL} style={{color: COLORS.linkColor}}>View some quotes</Link> and get voting!</p>
                        </>
                    }

                    <div className='d-flex flex-column align-items-center w-100 mb-5 px-3'>
                        <h2>Private Comments</h2>
                        <p style={{textAlign: 'center'}}>This is your private space to contact the admins about anything you want - comments posted here can only be seen by you and the admins.</p>
                        <p style={{textAlign: 'center'}}>Want a new feature for the website? Let us know.</p>
                        <p style={{textAlign: 'center'}}>Got concerns about something on the website? Let us know.</p>

                        <PostComment 
                            raiseComment={(comment)=>setComments([comment, ...comments])}
                            user={state.user}
                            quoteId={-1}
                        />

                        {!comments ? null : comments.map( (comment, i)=>{
                            return (
                                <Comment key={`comment${i}`} data={comment} />
                            )
                        })}

                    </div>

                    <div className='my-5 d-flex flex-column align-items-center'>
                        <button className='btn btn-danger mt-5' onClick={logoutHandler}>Logout</button>
                    </div>
                </div>
            }
        </GenericScreen>
    )
}

export default AccountScreen