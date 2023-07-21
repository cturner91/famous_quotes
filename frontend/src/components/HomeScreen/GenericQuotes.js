import React, {useState, useEffect, useContext} from 'react'

import { Link } from 'react-router-dom'

import Quote from '../Quote'
import { genericRequest } from '../../data/utils'
import { GlobalContext } from '../../data/GlobalContext'
import { API_QUOTE_URL, APP_QUOTES_URL } from '../../data/constants'


const GenericQuotes = (props) => {

    const {dispatch} = useContext(GlobalContext)

    return (
        <div className='row my-5'>
            <h2 style={{textAlign: 'center'}}>Explore quotes</h2>
            {props.quotes.map( (quote, i) => {
                return (
                    <div key={`quote${i}`} className='col-12 col-lg-6 d-flex flex-row justify-content-center'>
                        <Quote 
                            data={quote} 
                            styles={{width: '100%'}} 
                            showCategories={false} 
                            showActions={true} 
                            showStats={false} 
                            showReport={false}
                        />
                    </div>
                )
            })}

            <Link to={APP_QUOTES_URL} style={{textAlign: 'center', marginTop: 30, marginBottom: 50}}>
                <button 
                    className='btn btn-primary btn-lg'
                    onClick={()=>dispatch({type: 'ADD_ANALYTIC', action:'home screen:view more quotes:click'})}
                >
                    View more quotes
                </button>
            </Link>
        </div>
    )
}

export default GenericQuotes