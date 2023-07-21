import React, { useState, useContext, useEffect } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

import GenericScreen from './GenericScreen'
import { GlobalContext } from '../data/GlobalContext'
import { getValue } from '../data/utils'
import { APP_ACCOUNT_URL, API_LOGIN_URL, APP_REGISTER_URL, COLORS, APP_PASSWORD_FORGOT, APP_LOGIN_URL, PROD_BASE_URL } from '../data/constants'

axios.defaults.withCredentials = true  // necessary to persist sessions


const LoginScreen = (props) => {

    const { state, dispatch } = useContext(GlobalContext)

    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [loggingIn, setLoggingIn] = useState(false)

    const checkLoggedIn = () => {
        // if user is already logged in, do not show them the login screen
        if (getValue(state, ['user', 'id']) > 0) {
            navigate(APP_ACCOUNT_URL)
        }
    }

    const loginHandler = () => {
        setLoggingIn(true)
        axios({
            url: API_LOGIN_URL,
            method: 'POST',
            data: { email, password },
            headers: { 'Content-Type': 'application/json' }
        })
        .catch(error => {
            // console.log(error)
            setLoggingIn(false)
            alert('Login failed.')

        }).then(response => {
            // console.log(response)
            if (response.status === 200) {
                // update state
                dispatch({ type: 'SET_USER', user: response['data']['user'] })
                navigate(APP_ACCOUNT_URL)
            } else {
                setLoggingIn(false)
                alert('Login failed.')
            }
        })
    }

    useEffect(() => {
        checkLoggedIn()

        // // assign ENTER -> auto-submit
        // // below code FAILS and I have no idea why - API logs show it sends the request without attaching the POST data somehow?!?!
        // const keyPressHandler = (e) => {
        //     if (e.key==='Enter') {
        //         loginHandler()
        //         return
        //     }
        // }
        // document.addEventListener('keydown', keyPressHandler)
        // return ()=> document.removeEventListener('keydown', keyPressHandler)        
    }, [])


    const containerStyle = {
        maxWidth: 500,
        marginTop: 50,
        marginBottom: 50,
        marginLeft: 30,
        marginRight: 30,
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

    const inputStyle = {
        maxWidth: 400,
        marginTop: 10,
        marginBottom: 10,
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Login | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Log in to your account at Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_LOGIN_URL}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_LOGIN_URL}`},
    ]

    return (
        <GenericScreen metas={metas} links={links} title={'Login | Famous-Quotes.uk'}>
            {loggingIn ?
                <div className='container text-center my-5'>
                    <div className='spinner-border' style={{ width: 50, height: 50, fontSize: 30 }}></div>
                </div>
                :
                <div className='d-flex flex-column align-items-center'>
                    <div style={containerStyle}>
                        <span style={headerStyle}>Login</span>
                        <span>Not got an account yet? <Link to={APP_REGISTER_URL} style={{ color: COLORS.linkColor }} onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: 'login screen:register link:click'})}>Register here instead</Link>.</span>

                        <input
                            className='form-control'
                            placeholder='Email address'
                            style={{ ...inputStyle, marginTop: 20 }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                            type='password'
                            className='form-control'
                            placeholder='Password'
                            style={inputStyle}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button
                            className='btn btn-primary'
                            onClick={loginHandler}
                        >Login</button>

                        <Link to={APP_PASSWORD_FORGOT} style={{ color: COLORS.linkColor }} onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: 'login screen:forgot password link:click'})} className='mt-3'>Forgotten password?</Link>

                    </div>
                </div>
            }
        </GenericScreen>
    )
}

export default LoginScreen