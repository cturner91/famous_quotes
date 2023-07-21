import React, {useState, useEffect, useContext} from 'react'

import { Link, useNavigate } from 'react-router-dom'

import CategoryCheckbox from '../components/CategoryCheckbox'
import { containsSwearWord, genericRequest, getValue } from '../data/utils'
import GenericScreen from './GenericScreen'
import AutoLoginHoc from '../components/AutoLoginHoc'
import { API_CATEGORIES_URL, API_QUOTE_URL, APP_ADD_QUOTE_URL, APP_QUOTES_URL, APP_QUOTE_URL, APP_TERMS_URL, COLORS, PROD_BASE_URL } from '../data/constants'
import { GlobalContext } from '../data/GlobalContext'


const AddQuoteScreen = (props) => {

    const {state, dispatch} = useContext(GlobalContext)

    const navigate = useNavigate()

    const [quote, setQuote] = useState('')
    const [author, setAuthor] = useState('')
    const [context, setContext] = useState('')
    const [categories, setCategories] = useState([])
    const [categoriesList, setCategoriesList] = useState([])


    useEffect( ()=>{
        const effectAsync = async () => {
            const response = await genericRequest({
                url: API_CATEGORIES_URL, method: 'GET'
            })
            if (response.status===200) {
                setCategories(response['data']['data'])
            }
        }
        effectAsync()
    }, [])

    const submitHandler = async () => {

        // no need to send blank data to the API to be told it won't work - handle in FE if possible
        if (quote.length===0) {
            alert('Quote must not be blank')
            return
        } else if (author.length===0) {
            alert('Author must not be blank. If author is unknown, please set to "Unknown" or "Anonymous", or even "-".')
            return
        }

        const response = await genericRequest({
            url: API_QUOTE_URL,
            method: 'POST',
            data: {quote, author, context, categories: categoriesList}
        })
        if (response.status===201) {
            dispatch({type: 'ADD_ANALYTIC', action: `add quote screen:add quote button:click:success`})
            alert('Quote created successfully')
            const quote_id = response['data']['data']['id']

            // redirect to view this quote
            navigate(`${APP_QUOTE_URL}?id=${quote_id}`)
        } else {
            dispatch({type: 'ADD_ANALYTIC', action: `add quote screen:add quote button:click:failed`})
            alert(`Something went wrong:\n${response['data']['message']}`)
        }
    }

    const toggleCategory = (categoryId) => {
        // if ID is in list, then remove it. Otherwise, add it
        const idx = categoriesList.indexOf(categoryId)
        let dummy = [...categoriesList]
        if(idx >= 0) {
            dummy.splice(idx, 1)
        } else {
            dummy.push(categoryId)
        }
        setCategoriesList(dummy)
    }

    const swearingDivStyles = {
        border: '2px solid darkred',
        padding: 10,
        borderRadius: 5,
        color: 'darkred',
        textAlign: 'center',
        marginTop: 15,
    }

    const userExists = getValue(state, ['user', 'id']) ? true : false

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Add new quote | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Add a new quote to Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_ADD_QUOTE_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_ADD_QUOTE_URL}`},
    ]

    return (
        <GenericScreen metas={metas} links={links} title={'Add new quote | Famous-Quotes.uk'}>
            <AutoLoginHoc />
            <div className='container mb-5 d-flex flex-column align-items-center px-3 px-sm-5' style={{maxWidth: 800}}>
                <h1 className='my-3'>Add new quote:</h1>
                <textarea 
                    rows='3' 
                    className='form-control my-2' 
                    placeholder='Quote'
                    onChange={((e)=>setQuote(e.target.value))}
                ></textarea>
                <input 
                    className='form-control my-2' 
                    placeholder='Author' 
                    onChange={((e)=>setAuthor(e.target.value))}
                />
                <input 
                    className='form-control my-2' 
                    placeholder='Context e.g. movie / book / speech' 
                    onChange={((e)=>setContext(e.target.value))}
                />

                <div className='row text-center'>
                    <h2>Set Categories</h2>
                    {categories.map( (category, i)=>{
                        return (
                            <CategoryCheckbox key={`checkox${i}`} category={category} toggleCategory={toggleCategory} useNames={false} />
                        )
                    })}
                </div>

                {containsSwearWord(quote) || containsSwearWord(author) || containsSwearWord(context) ?
                    <div style={swearingDivStyles}>
                        I think I've found a swear word in one of your inputs. People posting abuse will be banned in line with our <Link style={{color: COLORS.linkColor}} to={APP_TERMS_URL}>Terms of Service</Link>. Please consider if this swearing is appropriate.
                    </div>
                : null}

                {!userExists ?
                    <div style={swearingDivStyles}>
                        Must be logged in to add quotes.
                    </div>
                : null}

                <button 
                    className='btn btn-danger mt-3' 
                    onClick={submitHandler}
                    disabled={!userExists}
                >
                    Submit Quote
                </button>
            </div>
        </GenericScreen>
    )
}

export default AddQuoteScreen