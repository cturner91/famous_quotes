import React, {useContext, useState} from 'react'

import { genericRequest, getValue } from '../data/utils'
import { API_QUOTE_LIST_URL, COLORS } from '../data/constants'
import { GlobalContext } from '../data/GlobalContext'


const QuotelistSelectBox = (props) => {

    const {state, dispatch} = useContext(GlobalContext)
    // console.log(state)

    const isLoggedIn = getValue(state, ['user', 'id']) ? true : false
    const defaultShowCreate = isLoggedIn && state.user.quotelists.length > 0 ? false : true

    // use most recent quote list? Then when user adds a quote-list, we can pre-load this one onto the dropdown
    // this is because dispatch triggers updated state which triggers a fresh re-render, so normal state not working as expected
    const defaultQuotelist = isLoggedIn && state.user.quotelists.length > 0 ? state.user.quotelists.slice(-1)[0]['id'] : -1

    const [showCreate, setShowCreate] = useState(defaultShowCreate)
    const [quotelist, setQuotelist] = useState(defaultQuotelist)
    const [newListName, setNewListName] = useState('')

    const quotelists = getValue(state, ['user','id']) ? state.user.quotelists : []

    const wrapperStyles = {
        width: '100%',
        minWidth: '100vw',
        height: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,

    }
    const boxStyles = {
        borderRadius: 20,
        border: '2px solid black',
        backgroundColor: 'white',
        boxShadow: `0 0 40px 10px ${COLORS.main(1)}`,
        padding: 20,
        minWidth: 350,
    }

    const newListHandler = async () => {
        const response = await genericRequest({
            url: API_QUOTE_LIST_URL,
            method: 'POST',
            data: {name: newListName},
        })
        // console.log(response)

        if (response.status===201) {
            dispatch({type: 'ADD_QUOTELIST', quotelist: response['data']['data']})
            setQuotelist(response['data']['data']['id'])
            setShowCreate(false)
        } else {
            // console.log(response)
            alert(`Something went wrong:\n${response['data']['message']}`)
        }
    }

    const dropdownHandler = (e) => {
        setQuotelist(e.target.value)
        if (e.target.value === '') {
            setShowCreate(true)
        } else {
            setShowCreate(false)
        }
    }

    const addToListHandler = async () => {
        const response = await genericRequest({
            url: API_QUOTE_LIST_URL,
            method: 'PUT',
            data: {
                id: quotelist,
                quote_ids: [props.quoteData.id],
                append: true,
            }
        })
        // console.log(response)
        if (response.status===200) {
            // alert('Quote added successfully')
            // props.hideModalHandler()
            props.successHandler()
        } else {
            alert(`Something went wrong:\n${response['data']['message']}`)
        }
    }

    return (
        <div style={wrapperStyles}>
            <div style={boxStyles} onClick={(e)=>e.stopPropagation()}>
                <h2 style={{textAlign: 'center', fontSize: 20}}>Add quote to list:</h2>
                <h3 style={{textAlign: 'center', fontSize: 16, marginTop: 15, marginBottom: 5}}>Choose quote list:</h3>
                <select className='form-control mb-2' value={quotelist} onChange={dropdownHandler}>
                    {quotelists.map( (quotelist,i)=>{
                        return (
                            <option key={`quotelist${i}`} value={quotelist.id}>{quotelist.name}</option>
                        )
                    })}
                    <option value=''>Create new list</option>
                </select>
                <div className='d-flex flex-column'>
                    {showCreate ? 
                        <div className='d-flex flex-row my-3'>
                            <input 
                                className='form-control' 
                                placeholder='New list name' 
                                value={newListName} 
                                onChange={(e)=>setNewListName(e.target.value)} 
                            />
                            <button 
                                className='btn btn-primary'
                                onClick={newListHandler}
                            >Create</button>
                        </div>
                    :
                        <button 
                            className='btn btn-primary'
                            onClick={addToListHandler}
                        >Add to list</button>
                    }
                </div>
            </div>
        </div>
    )
}

export default QuotelistSelectBox