import React, {useContext, useState} from 'react'

import AnimateHeight from 'react-animate-height'
import { Link, useNavigate } from 'react-router-dom'

import QuoteIcon from './QuoteIcon'
import PassiveAlert from './PassiveAlert'
import { genericRequest } from '../data/utils'
import { GlobalContext } from '../data/GlobalContext'
import Modal from './Modal'
import QuotelistSelectBox from './QuotelistSelectBox'
import { API_QUOTE_LIST_URL, API_REPORT_URL, API_VOTES_URL, APP_QUOTE_URL, APP_QUOTE_VIEW_URL, COLORS } from '../data/constants'


const Quote = ({
    data, 
    styles, 
    collapse=false, // change styling if inside a collapsed QuoteList
    showActions=true, 
    showStats=true, 
    showCategories=true, 
    showReport=false,
    quotelistAdd=true,  // default is to ADD to a list
    quotelistId=-1,  // quotelistId necessary for deleting quotes from list
}) => {

    const alertDuration = 5000
    const heightTimeout = 400

    const navigate = useNavigate()

    const {state, dispatch} = useContext(GlobalContext)


    const [bgColor, setBgColor] = useState('grey')
    const [alertData, setAlertData] = useState({title: '', texts: []})
    const [showAlert, setShowAlert] = useState(false)
    
    // if quote is deleted from a quotelist then do not display it. Don't want to have to udpate QL higher-order-component, just mask it locally
    const [deleted, setDeleted] = useState(false)
    const [toBeDeleted, setToBeDeleted] = useState(false)

    const [showQuoteLists, setShowQuoteLists] = useState(false)


    const mouseEnterHandler = (event) => {
        setBgColor(COLORS.main(1))
    }

    const mouseLeaveHandler = (event) => {
        setBgColor('grey')
    }

    const boxStyle = {
        border: '1px solid black',
        borderRadius: 10,
        boxShadow: collapse || toBeDeleted ? '' : `0 0 8px 0 ${bgColor}`,
        transition: `all ${heightTimeout}ms ease-in-out`,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: toBeDeleted ? 0 : 10,
        marginTop: toBeDeleted ? 0 : 10,
        marginBottom: toBeDeleted ? 0 : 15,
        marginRight: 10,
        marginLeft: 10,
        display: collapse ? 'none' : 'flex',
        maxWidth: 600,
        minWidth: showStats && window.innerWidth >= 500 ? 500 : 0,
        opacity: toBeDeleted ? 0 : 1,
        ...styles,
    }


    const quoteCharacterStyle = {
        fontSize: 20,
    }

    const quoteStyle = {
        fontSize: 20,
    }

    const authorStyle = {
        fontStyle: 'italic',
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: '0.5rem',
    }

    const contextStyle = {
        fontSize: 12,
        marginBottom: '0.5rem',
        textAlign: 'right'
    }

    const iconBoxStyles = {
        borderTop: '0.5px solid black',
        paddingTop: 10,
        paddingBottom: 10,
    }

    const statsBoxStyles = window.innerWidth < 500 ? {
        // small width
        borderTop: '0.5px solid black',
        paddingTop: 5,
        paddingBottom: 5,
        flexDirection: 'column',
        alignItems: 'center',
    } : {
        // bigger widths
        borderTop: '0.5px solid black',
        paddingTop: 5,
        paddingBottom: 5,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '95%',
    }

    const submitVote = async (quote_id, value) => {
        const response = await genericRequest({
            url: API_VOTES_URL,
            method: 'POST',
            data: {quote_id, value},
        })
        if (response.status!==201) {
            setAlertData({title: 'Error', texts: ['Something went wrong:', ...response.data.message.split('\n')]})
            setShowAlert(true)
            setTimeout(()=>setShowAlert(false), alertDuration+1000)
            return false
        } else if (response.status === 201) {
            setAlertData({title: 'Vote Successful', texts: ['Thank you!']})
            setShowAlert(true)
            setTimeout(()=>setShowAlert(false), alertDuration+1000)
            return true
        }
        // console.log(response)
    }

    const reportQuote = async (quote_id, report_type ) => {
        const response = await genericRequest({
            url: API_REPORT_URL,
            method: 'POST',
            data: {quote_id, report_type},
        })
        if (response.status!==200) {
            alert('Something went wrong:\n'+response.data.message)
        } else if (response.status === 200) {
            alert('Thank you for reporting this quote. We will review and take appropriate action soon.')
        }
        // console.log(response)
    }

    const addToListHandler = () => {
        if (!state.user) { 
            alert('Must be logged in to add quote to list.')
            return
        }
        setShowQuoteLists(true)
    }

    const removeFromListHandler = async (quotelistId, quoteId) => {

        const response = await genericRequest({
            url: API_QUOTE_LIST_URL,
            method: 'PUT',
            data: {delete: true, id: quotelistId, quote_ids: [quoteId]}
        })
        // console.log(response)

        if (response.status===200) {
            setAlertData({title: 'Quote removed successfully', texts: []})
            setShowAlert(true)
            setTimeout(()=>setShowAlert(false), alertDuration+1000)
            setToBeDeleted(true)
            setTimeout(()=>setDeleted(true), alertDuration+2000)
            setTimeout(()=>dispatch({type: 'REMOVE_QUOTE_FROM_LIST', quotelistId, quoteId}), alertDuration+2000)
        } else {
            setAlertData({title: 'Error', texts: ['Something went wrong:', ...response.data.message.split('\n')]})
            setShowAlert(true)
            setTimeout(()=>setShowAlert(false), alertDuration+1000)
        }
    }

    if (deleted) return null

    return (
        <>
            <div
                style={boxStyle} 
                className='d-flex flex-column' 
                onMouseEnter={mouseEnterHandler} 
                onMouseLeave={mouseLeaveHandler}
            >
                <AnimateHeight duration={heightTimeout} height={toBeDeleted ? 0 : 'auto'}>
                    <Link to={`${APP_QUOTE_URL}?id=${data.id}`} onClick={()=>{
                        dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:click`})
                        dispatch({type: 'SET_QUOTE', quote: data})
                    }}>
                        <div>
                            <span style={quoteCharacterStyle}>&ldquo;</span>
                            <span style={quoteStyle}>{data.quote}</span>
                            <span style={quoteCharacterStyle}>&rdquo;</span>
                        </div>

                        <div>
                            <p style={authorStyle}>{data.author.length>1 ? `- ${data.author}` : '-'}</p>
                        </div>

                        {!data.context ? null : <p style={contextStyle}>{data.context}</p>}
                    </Link>

                    {!showCategories ? null :
                        <div style={statsBoxStyles} className='d-flex flex-row justify-content-center'>
                            <span>Categories:&nbsp;&nbsp;&nbsp;{data.categories.length > 0 ? data.categories.map(d=>d.category).join(', ') : '-'}</span>
                        </div>
                    }


                    {!showActions ? null :
                        <div style={iconBoxStyles} className='d-flex flex-row justify-content-around'>
                            <QuoteIcon 
                                transform='rotate(-30deg)' 
                                class='fa-regular fa-thumbs-up' 
                                title='Upvote' 
                                label='Upvote'
                                clickCallback={ ()=> {
                                    submitVote(data.id, 1) 
                                    dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:upvote`})
                                }}
                            />
                            <QuoteIcon 
                                transform='rotate(30deg)' 
                                class='fa-regular fa-thumbs-down' 
                                title='Downvote' 
                                label='Downvote'
                                clickCallback={ ()=> {
                                    submitVote(data.id, -1) 
                                    dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:downvote`})
                                }}
                            />
                            {quotelistAdd ?
                                <QuoteIcon 
                                    transform='rotate(-90deg)' 
                                    class='fa-solid fa-circle-plus' 
                                    title='Add to a quote list' 
                                    label='Add to list'
                                    style={{color: '#dbb40c'}} 
                                    clickCallback={()=>{
                                        addToListHandler()
                                        dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:add to list`})
                                    }}
                                />
                            :
                                <QuoteIcon 
                                    transform='rotate(-180deg)' 
                                    class='fa-solid fa-circle-minus' 
                                    title='Remove from list'
                                    label='Remove from list'
                                    style={{color: 'darkred'}} 
                                    clickCallback={()=>{
                                        removeFromListHandler(quotelistId, data.id)
                                        dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:remove from list`})
                                    }}
                                />
                            }

                            <QuoteIcon 
                                transform='scale(1.3)' 
                                class='fa-solid fa-image' 
                                title='Create quote view' 
                                label='Create view'
                                style={{color: '#dbb40c'}} 
                                clickCallback={()=>{
                                    dispatch({type: 'SET_QUOTE', quote: data})
                                    dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:create quote view`, forceCommit: true})
                                    navigate(APP_QUOTE_VIEW_URL)
                                }}
                            />
                        </div>
                    }
                
                    {!showReport ? null :
                        <div style={iconBoxStyles} className='d-flex flex-row justify-content-around'>
                            <QuoteIcon 
                                transform='rotate(-90deg)' 
                                class="fa-sharp fa-solid fa-circle-xmark" 
                                title='Report for misattribution' 
                                label='Report for misattribution?'
                                style={{color: 'darkred'}} 
                                clickCallback={()=>{
                                    reportQuote(data.id, 'misattribution')
                                    dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:report misattribution`})
                                }}
                            />
                            <QuoteIcon 
                                transform='rotate(-30deg)' 
                                class='fa-regular fa-flag' 
                                style={{color: 'darkred'}} 
                                title='Flag as duplicate of another quote' 
                                label='Flag as duplicate?'
                                clickCallback={()=>{
                                    reportQuote(data.id, 'duplicate')
                                    dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:report duplicate`})
                                }}
                            />
                            <QuoteIcon 
                                transform='scale(1.2)' 
                                class='fa-solid fa-ban' 
                                style={{color: 'darkred'}} 
                                title='Report as offensive' 
                                label='Report as offensive'
                                clickCallback={()=>{
                                    reportQuote(data.id, 'offensive')
                                    dispatch({type: 'ADD_ANALYTIC', action: `quote ${data.id}:report offensive`})
                                }}
                            />
                        </div>
                    }

                    {!showStats ? null :
                        <div style={statsBoxStyles} className='d-flex'>
                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                                <span style={{textAlign: 'center'}}>Popularity:&nbsp;</span>
                                <span style={{textAlign: 'center'}}>{(data.popularity*100).toFixed(0)}%</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                                <span style={{textAlign: 'center'}}>Total Votes:&nbsp;</span>
                                <span style={{textAlign: 'center'}}>{(Number(data.total_upvotes)+Number(data.total_downvotes))}</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                                <span style={{textAlign: 'center'}}>Upvotes:&nbsp;</span>
                                <span style={{textAlign: 'center'}}>{(Number(data.total_upvotes))}</span>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                                <span style={{textAlign: 'center'}}>Downvotes:&nbsp;</span>
                                <span style={{textAlign: 'center'}}>{(Number(data.total_downvotes))}</span>
                            </div>
                        </div>
                    }
                </AnimateHeight>
            </div>
 
            <PassiveAlert
                show={showAlert}
                title={alertData.title}
                texts={alertData.texts}
                timeout={400}
            />    

            <Modal hideModalHandler={()=>setShowQuoteLists(false)} show={showQuoteLists}>
                <QuotelistSelectBox
                    hideModalHandler={()=>setShowQuoteLists(false)}
                    successHandler={()=>{
                        setShowQuoteLists(false)
                        setAlertData({title: 'Quote added successfully', texts: []})
                        setShowAlert(true)
                        setTimeout(()=>setShowAlert(false), alertDuration+1000)
                    }}
                    quoteData={data}
                />
            </Modal>
        </>
    )
}

export default Quote