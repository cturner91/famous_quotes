import React, {useContext, useEffect, useState} from 'react'

import { Link } from 'react-router-dom'

import Quote from '../Quote'
import { genericRequest } from '../../data/utils'
import { GlobalContext } from '../../data/GlobalContext'
import { API_QUOTE_URL, APP_QUOTES_URL } from '../../data/constants'


const QuoteCategorySplash = (props) => {

    const {dispatch} = useContext(GlobalContext)

    const quotesOrderSm = props.panelSide === 'left' ? 3 : 1

    const rowStyles = {
        borderRadius: 10,
        backgroundColor: props.bgColor,
        padding: 10,
        backgroundColor: props.data.bgColor ? props.data.bgColor : 'white',
        borderRadius: 30,
        paddingBottom: 20,
    }
    const divTitleStyles = {
        minHeight: 75,
        textAlign: 'center',
        padding: 30,
        paddingBottom: 10,
    }
    const titleStyles = {
        fontSize: 30,
        fontFamily: '"Handlee", cursive',
    }

    return (
        <div className='row my-5' style={rowStyles}>

            <div style={divTitleStyles} className='col-12 col-sm-6 order-2 order-sm-2 d-flex flex-row align-items-center justify-content-center'>
                <span style={titleStyles}>{props.data.title}</span>
            </div>

            <div className={`col-12 col-sm-6 order-3 order-sm-${quotesOrderSm}`}>
                {props.quotes.map( (q,i) => 
                    <Quote 
                        key={`splashCategory${i}`} 
                        data={q} 
                        showActions={false} 
                        showStats={false} 
                        showCategories={false} 
                        styles={{backgroundColor: 'white'}}
                    />)
                }
                <Link 
                    to={`${APP_QUOTES_URL}?categories=${props.data.category}`} 
                    onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: `home screen:quote splash button:${props.data.category}:click`})}
                >
                    <div className='w-100 text-center'>
                        <button className='btn btn-primary'>Discover more {props.data.title.toLowerCase()}</button>
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default QuoteCategorySplash