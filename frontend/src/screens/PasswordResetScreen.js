import React, { useState } from 'react'

import { useNavigate } from 'react-router-dom'

import PasswordSetter from '../components/PasswordSetter'
import { genericRequest } from '../data/utils'
import GenericScreen from './GenericScreen'
import { API_PASSWORD_RESET_URL, APP_LOGIN_URL, APP_PASSWORD_RESET, PROD_BASE_URL } from '../data/constants'


const PasswordResetScreen = (props) => {

    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')

    const urlSearchParams = new URLSearchParams(window.location.search)
    const searchParams = Object.fromEntries(urlSearchParams.entries())
    const code = searchParams['code']

    const clickHandler = async () => {
        const response = await genericRequest({
            url: API_PASSWORD_RESET_URL,
            method: 'POST',
            data: { email, password1, password2, code },
        })
        // console.log(response)

        if (response.status === 200) {
            alert('Password changed succesfully!')
            navigate(APP_LOGIN_URL)
        } else {
            alert('Something went wrong:\n'+response.data.message)
        }
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Reset password | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Reset password for Famous-Quotes.uk.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_PASSWORD_RESET}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_PASSWORD_RESET}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Reset password | Famous-Quotes.uk'}>
            <div className='container my-5 d-flex flex-column align-items-center'>
                <h1 style={{ textAlign: 'center' }}>Password Reset</h1>
                <input placeholder='Email' style={{ maxWidth: 400 }} className='my-3 form-control' value={email} onChange={(e) => setEmail(e.target.value)} />

                <PasswordSetter
                    password1={password1}
                    setPassword1={setPassword1}
                    password2={password2}
                    setPassword2={setPassword2}
                    inputLabel1='Enter new password:'
                    inputLabel2='Confirm new password:'
                />

                <button
                    className='btn btn-primary mt-3'
                    onClick={clickHandler}
                    disabled={!(email.length > 0 && password1.length > 0 && password2.length > 0 && password1===password2)}
                >Reset password</button>
            </div>
        </GenericScreen>
    )
}

export default PasswordResetScreen