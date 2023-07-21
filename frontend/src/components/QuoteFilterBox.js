import React, {useState, useEffect, useContext} from 'react'

import { GlobalContext } from '../data/GlobalContext'
import CategoryCheckbox from './CategoryCheckbox'
import {APP_QUOTES_URL, APP_URL, COLORS, sortByOptions} from '../data/constants'


const QuoteFilterBox = (props) => {

    const {state, dispatch} = useContext(GlobalContext)

    const [sortBy, setSortBy] = useState(state.search.sortBy ? state.search.sortBy : '-popularity')
    const [author, setAuthor] = useState(state.search.author ? state.search.author : '')
    const [quote, setQuote] = useState(state.search.quote ? state.search.quote : '')
    const [context, setContext] = useState(state.search.context ? state.search.context : '')
    const [categories, setCategories] = useState(state.search.categories ? state.search.categories : [])
    // console.log(categories)


    const wrapperStyles = {
        width: '100%',
        minWidth: '100vw',
        height: '100%',
        minHeight: '100vh',
        padding: 20,
        margin: 'auto',
        transition: 'all 800ms ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }

    const boxStyle = {
        backgroundColor: 'white',
        borderRadius: 20,
        diplay: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: 10,
        border: '2px solid black',
        boxShadow: `0 0 10px 5px ${COLORS.main(1)}`,
        maxWidth: 400,
    }

    const labelStyle = {
        width: '50%',
        margin: 'auto',
    }
    const inputStyle = {
        width: '50%',
    }


    const toggleCategory = (category) => {
        // if ID is in list, then remove it. Otherwise, add it
        const idx = categories.indexOf(category)
        let dummy = [...categories]
        if(idx >= 0) {
            dummy.splice(idx, 1)
        } else {
            dummy.push(category)
        }
        setCategories(dummy)
    }

    const buildUrl = () => {
        let filters = []
        if (author) filters.push(`author=${author}`)
        if (quote) filters.push(`quote=${quote}`)
        if (context) filters.push(`context=${context}`)
        if (categories.length>0) filters.push(`categories=${categories.join(',')}`)
        if (sortBy && sortBy!=='-popularity') filters.push(`s=${sortBy}`)
        return `?${filters.join('&')}`
    }

    const submitSearch = () => {
        props.setQuotes([])
        props.hideModalHandler()
        props.updateQuotesHandler(buildUrl())

        dispatch({type: 'SET_SEARCH', search: {author, quote, context, categories, sortBy, 
            sortByDisplay: sortByOptions.find( option => option.param===sortBy)['displayName']
        }})
        dispatch({type: 'ADD_ANALYTIC', action: `quotes screen:search quotes modal:search button:click - ${buildUrl()}`})

        window.history.pushState(null, window.title, `${APP_QUOTES_URL}${buildUrl()}`)
    }

    useEffect( ()=>{
        // attach listener such that pressing enter submits search
        const keyPressHandler = (e) => {
            if (e.key==='Enter') {
                submitSearch()
                return
            }
        }
        document.addEventListener('keydown', keyPressHandler)
        return ()=> document.removeEventListener('keydown', keyPressHandler)
    })

    const categoryInCategories = (category) => state.search.categories.indexOf(category) >= 0


    return (
        <div style={{...wrapperStyles, ...props.styles}}>
            <div style={boxStyle} onClick={(e)=>e.stopPropagation()}>
                <h3>Set Filters</h3>

                <div className='d-flex flex-row my-2'>
                    <span style={labelStyle}>Quote Text</span>
                    <input style={inputStyle} type='text' className='form-control' value={quote} onChange={(e)=>setQuote(e.target.value)} />
                </div>

                <div className='d-flex flex-row my-2'>
                    <span style={labelStyle}>Author</span>
                    <input style={inputStyle} type='text' className='form-control' value={author} onChange={(e)=>setAuthor(e.target.value)} />
                </div>

                <div className='d-flex flex-row my-2'>
                    <span style={labelStyle}>Context</span>
                    <input style={inputStyle} type='text' className='form-control' value={context} onChange={(e)=>setContext(e.target.value)} />
                </div>

                <div className='d-flex flex-column my-2'>
                    <span style={labelStyle}><b>Categories</b></span>
                    <div className='row'>
                        {props.allCategories.map( (category,i) => {
                            return (
                                <CategoryCheckbox 
                                    className={'col-6 text-center'}    
                                    key={`category${i}`} 
                                    category={category} 
                                    toggleCategory={toggleCategory} 
                                    useNames={true} 
                                    checkedDefault={categoryInCategories(category.category)}
                                />
                            )
                        })}
                    </div>
                </div>

                <div className='d-flex flex-row my-2'>
                    <span style={labelStyle}>Order By</span>
                    <select className='form-select' style={inputStyle} value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
                        {sortByOptions.map( (sortBy, i)=>{
                            return <option key={`option${i}`} value={sortBy.param}>{sortBy.displayName}</option>
                        })}
                    </select>
                </div>

                <button className='btn btn-danger' onClick={submitSearch}>Search!</button>

            </div>
        </div>
    )
}

export default QuoteFilterBox