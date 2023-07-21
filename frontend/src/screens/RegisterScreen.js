import React, {useState, useContext, useEffect} from 'react'

import { Link, useNavigate } from 'react-router-dom'

import GenericScreen from './GenericScreen'
import PasswordSetter from '../components/PasswordSetter'
import { GlobalContext } from '../data/GlobalContext'
import { genericRequest, getValue } from '../data/utils'
import { APP_ACCOUNT_URL, COLORS, APP_LOGIN_URL, API_USER_URL, APP_TERMS_URL, APP_REGISTER_URL, PROD_BASE_URL } from '../data/constants'


const RegisterScreen = (props) => {

    const {state, dispatch} = useContext(GlobalContext)

    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')

    const [username, setUsername] = useState('')
    const [acceptedTCs, setAcceptedTCs] = useState(false)

    const [loggingIn, setLoggingIn] = useState(false)

    const checkLoggedIn = () => {
        // if user is already logged in, do not show them the register screen
        if (getValue(state, ['user', 'id']) > 0) {
            navigate(APP_ACCOUNT_URL)
        }
    }

    useEffect( ()=>{
        checkLoggedIn()
    }, [state])

    const registerHandler = async () => {
        setLoggingIn(true)
        const response = await genericRequest({
            url: API_USER_URL,
            method: 'POST',
            data: { email, password1, password2, first_name: firstName, last_name: lastName },
        })
        // console.log(response)

        if (response.status===201) {
            // update state
            dispatch({type: 'SET_USER', user: response['data']['user']})
            dispatch({type: 'ADD_ANALYTIC', action: 'register screen:register button:click:success'})
            alert('User created successfully, welcome to Famous-Quotes.uk!')
            navigate(APP_ACCOUNT_URL)
            setLoggingIn(false)
        } else {
            dispatch({type: 'ADD_ANALYTIC', action: 'register screen:register button:click:failed'})
            setLoggingIn(false)
            alert('Registration failed:\n'+response.data.message)
        }
    }

    const inputGroupStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        width: '90%',
        maxWidth: 400,
    }
    const labelStyles = {
        fontWeight: 'bold',
        marginTop: 20,
    }
    const inputStyle = {
        maxWidth: 400,
    }
    const containerStyle = {
        width: '95%',
        maxWidth: 500,
        marginTop: 50,
        marginBottom: 50,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'grey',
        borderStyle: 'solid',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }
    
    const headerStyle = {
        fontSize: 30,
        display: 'block',
        textAlign: 'center',
    }

    const buttonIsDisabled = () => {
        if (!acceptedTCs) return true 
        if (email.length > 0 && password1.length > 0 && password2.length > 0 && password1===password2) return false
        return true
    }    

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Register an account | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Register for an account on Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_REGISTER_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_REGISTER_URL}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Register an account | Famous-Quotes.uk'}>
            {loggingIn ?
                <div className='container text-center my-5'>
                    <div className='spinner-border' style={{width: 50, height: 50, fontSize: 30}}></div>
                </div>
                :
                <div style={containerStyle} className='container'>
                    <span style={headerStyle}>Register</span>
                    <span>Already got an account? <Link to={APP_LOGIN_URL} style={{color: COLORS.linkColor}} onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: 'regsiter screen:sign-in link:click'})}>Sign-in instead</Link>.</span>
                    
                    <div style={inputGroupStyles}>
                        <label style={labelStyles}>Email Address</label>
                        <input 
                            className='form-control' 
                            style={inputStyle}
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)} 
                        />
                    </div>

                    <PasswordSetter 
                        password1={password1}
                        setPassword1={setPassword1}
                        password2={password2}
                        setPassword2={setPassword2}
                    />


                    <div style={inputGroupStyles}>
                        <label style={labelStyles}>First name:</label>
                        <input 
                            className='form-control' 
                            style={inputStyle}
                            value={firstName}
                            onChange={(e)=>setFirstName(e.target.value)} 
                        />
                    </div>

                    <div style={inputGroupStyles}>
                        <label style={labelStyles}>Last name:</label>
                        <input 
                            className='form-control' 
                            style={inputStyle}
                            value={lastName}
                            onChange={(e)=>setLastName(e.target.value)} 
                        />
                    </div>

                    <div style={inputGroupStyles}>
                        <label style={labelStyles}>Public Username (optional):</label>
                        <input 
                            className='form-control' 
                            style={inputStyle}
                            value={username}
                            onChange={(e)=>setUsername(e.target.value)} 
                        />
                    </div>

                    <div className='d-flex flex-row align-items-center mt-3' onClick={(e)=>{
                        setAcceptedTCs(!acceptedTCs)
                        e.stopPropagation()
                    }}>
                        <input 
                            type='checkbox' 
                            checked={acceptedTCs}
                            onChange={()=>null}
                            style={{width: 20, height: 20, marginLeft: 30}}
                        />
                        <label style={{marginLeft: 30}}>By clicking this box, you agree to abide by our <Link target='_blank' to={APP_TERMS_URL} style={{color: COLORS.linkColor}} onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: 'register screen:terms of service link:click'})}>Terms of Service</Link>.</label>
                    </div>

                    <button 
                        className='btn btn-primary mt-3'
                        onClick={registerHandler}
                        disabled={buttonIsDisabled()}
                    >Register</button>

                </div>
            }
        </GenericScreen>
    )
}

export default RegisterScreen