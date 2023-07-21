import React, {useContext, useState} from 'react'

import AnimateHeight from 'react-animate-height'

import Quote from '../Quote'
import { GlobalContext } from '../../data/GlobalContext'
import { genericRequest, getValue } from '../../data/utils'
import { API_QUOTE_LIST_URL, APP_QUOTELIST_URL, COLORS } from '../../data/constants'
import ShareLinks from '../../components/ShareLinks'


const QuoteList = (props) => {

    const {dispatch} = useContext(GlobalContext)

    const [collapse, setCollapse] = useState(true)
    const [deleted, setDeleted] = useState(false)

    const listContainerStyle = {
        border: '1px solid rgba(128, 128, 128, 0.5)',
        borderRadius: 10,
        boxShadow: `0 0 20px ${COLORS.main(0.8)}`,
        paddingTop: 0,
        overflow: collapse ? 'hidden' : 'scroll',
        marginBottom: 30,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: collapse ? 0 : 30,
        backgroundColor: 'white'
    }

    const headerStyle = {
        borderBottom: '2px solid black',
        paddingTop: 10,
        paddingLeft: 10,
        marginBottom: 20,
        cursor: 'pointer',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgb(220,220,220)',
        zIndex: 1,
        marginLeft: -10,
        marginRight: -10,
    }

    const collapseIconStyle = {
        position: 'absolute',
        right: 10,
        top: 7,
        transition: 'transform 400ms ease-in-out',
        transform: collapse ? 'rotate(-180deg)' : '',
        cursor: 'pointer',
        fontSize: 30,
        color: 'black',
    }

    const quotesContainerStyle = {
        maxHeight: collapse ? 0 : '65vh',
        transition: 'max-height 400ms ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }

    const deleteQuotelistHandler = async () => {

        const sure = window.confirm('Are you sure you want to delete this quote list?')
        if (!sure) return

        const response = await genericRequest({
            url: API_QUOTE_LIST_URL,
            method: 'DELETE',
            data: {id: props.id}
        })
        // console.log(response)

        if (response.status===200) {
            // alert('Quote-list removed successfully') // have already prompted user, no need for double-alert
            setDeleted(true)
            dispatch({type: 'REMOVE_QUOTELIST', quotelistId: props.id})
        } else {
            alert('Something went wrong:\n'+response.data.message)
        }
    }

    if (deleted) return null

    return (
        <div className='col-12 col-lg-6' style={props.styles ? {...props.styles} : null}>
            <div style={listContainerStyle}>
                <div 
                    style={headerStyle} 
                    className='d-flex flex-row justify-content-center'
                    onClick={()=>setCollapse(!collapse)}
                >
                    {/* marginRight is to stop text overlapping with icon */}
                    <span style={{fontSize: 20, fontWeight: 'bold', marginRight: 35}}>{props.name}</span>
                    <i style={collapseIconStyle} className="fa-solid fa-caret-down"></i>
                </div>

                <AnimateHeight duration={400} height={collapse ? 0 : 'auto'} >
                    <div style={quotesContainerStyle}>
                        {props.quotes.length===0 ? <p style={{fontSize: 20, marginBottom: 0, display: collapse ? 'none' : 'block'}}>No quotes on this list yet!</p> : null}
                        {props.quotes.map((quote,i) => {
                            return (
                                <Quote 
                                    key={`quote${i}`} 
                                    data={quote} 
                                    collapse={collapse} 
                                    showActions={getValue(props, ['quoteConfig','showActions']) || true}
                                    showStats={getValue(props, ['quoteConfig','showStats']) || false}
                                    showCategories={getValue(props, ['quoteConfig','showCategories']) || false}
                                    defaultShowMeta={getValue(props, ['quoteConfig','defaultShowMeta']) || false}
                                    quotelistAdd={props.quotelistAdd}
                                    quotelistId={props.id}
                                    styles={{width: '100%'}}
                                />
                            )
                        })}
                        
                        {props.id >= 0 ?
                            <div className='d-flex flex-column align-items-center'>
                                <div style={{height: 30}}></div>
                                
                                {props.quotes.length === 0 ? null :
                                    <>
                                        <ShareLinks title='Share this list' link={`${APP_QUOTELIST_URL}?eid=${props.externalId}`} />
                                        <p style={{textAlign: 'center', fontSize: 14, paddingLeft: 20, paddingRight: 20}}>Note that quote lists are publicly accessible - anybody can access them if they know the link.</p>
                                        {/* <p style={{textAlign: 'center', fontSize: 12}}>Note also that the odds of guessing an 8 character code are 1 in 209 billion...</p> */}
                                    </>
                                }

                                <button 
                                    className='btn btn-danger mt-3' 
                                    onClick={deleteQuotelistHandler}
                                >
                                    Delete this quote list?
                                </button>
                                <div style={{height: 30}}></div>
                            </div>
                        : null}

                        {/* spacer if more than 2 quotes (padding works if no scrolling) */}
                        {props.quotes.length >= 2 ? <div style={{height: 30, width: '100%'}}>&nbsp;</div> : null}
                    </div>
                </AnimateHeight>

            </div>
        </div>
    )
}

export default QuoteList