import React, {useState, useContext} from 'react'
import { API_USER_URL, COLORS, EMAIL } from '../../data/constants'
import { GlobalContext } from '../../data/GlobalContext'
import { genericRequest } from '../../data/utils'

const PersonalInfo = (props) => {

    const {state, dispatch} = useContext(GlobalContext)

    const [firstName, setFirstName] = useState(state.user.first_name)
    const [lastName, setLastName] = useState(state.user.last_name)
    const [username, setUsername] = useState(state.user.username)

    const [posting, setPosting] = useState(false)

    const labelStyle = {
        margin: 'auto',
        width: 150,
    }
    const inputStyle = {
        maxWidth: 200,
    }
    const inputGroupStyle = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        maxWidth: 450,
    }

    const submitHandler = async () => {
        setPosting(true)
        const data = {
            user_id: state.user.id, 
            first_name: firstName, 
            last_name: lastName, 
            username: username,
        }

        const response = await genericRequest({
            url: API_USER_URL,
            method: 'PUT',
            data
        })

        setPosting(false)
        if (response.status===200) {
            dispatch({type: 'ADD_ANALYTIC', action: `account screen:update personal info:success`})
            alert('Data updated successfully')
            dispatch({type: 'SET_USER', user: {...state.user, ...data}})
        } else {
            dispatch({type: 'ADD_ANALYTIC', action: `account screen:update personal info:failed`})
            alert('Something went wrong:\n'+response.data.message)
        }
    }

    const buttonIsDisabled = () => {
        if (posting) return true
        if (state.user.first_name !== firstName) return false
        if (state.user.last_name !== lastName) return false
        if (state.user.username !== username) return false
        return true
    }

    return (
        <div className='d-flex flex-column align-items-center w-100 my-5 px-3'>
            <h2 style={{textAlign: 'center'}}>Your Details</h2>

            <div style={inputGroupStyle}>
                <span style={labelStyle}>First Name:</span>
                <input style={inputStyle} type='text' className='form-control' value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
            </div>

            <div style={inputGroupStyle}>
                <span style={labelStyle}>Last Name:</span>
                <input style={inputStyle} type='text' className='form-control' value={lastName} onChange={(e)=>setLastName(e.target.value)} />
            </div>

            <div style={inputGroupStyle}>
                <span style={labelStyle}>Public Username:</span>
                <input style={inputStyle} type='text' className='form-control' value={username} onChange={(e)=>setUsername(e.target.value)} />
            </div>

            <span className=' mt-3 w-100 text-center'>
                If you need to change your email address, please email&nbsp;<a style={{color: COLORS.linkColor}} href={`mailto:${EMAIL}&subject=Email Change`}> {EMAIL} </a>&nbsp;directly.
            </span>


            {posting ? 
                <div className='spinner-border mt-3' style={{width: 50, height: 50, fontSize: 30}}></div> 
            :
                <button 
                    style={{maxWidth: 200, margin: 'auto', marginTop: 20}} 
                    className='btn btn-primary' 
                    disabled={buttonIsDisabled()}
                    onClick={submitHandler}
                >
                    Update info
                </button>
            }

        </div>
    )
}

export default PersonalInfo