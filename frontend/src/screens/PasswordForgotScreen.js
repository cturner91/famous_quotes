import React, {useState} from 'react'

import GenericScreen from './GenericScreen'
import { API_FORGOT_PASSWORD_URL, APP_PASSWORD_FORGOT, PROD_BASE_URL } from '../data/constants'
import { genericRequest } from '../data/utils'


const PasswordResetScreen = (props) => {

    const [email, setEmail] = useState('')
    const [sending, setSending] = useState(false)

    const clickHandler = async () => {
        setSending(true)
        const response = await genericRequest({
            url: API_FORGOT_PASSWORD_URL,
            method: 'POST',
            data: {email},
        })
        // console.log(response)

        if (response.status===200) {
            alert('Password reset email sent - please check your inbox')
            setSending(false)
        } else {
            alert('Password reset hasn\'t worked, please try again')
            setSending(false)
        }
    }

    const metas = [
        {idKey: 'property', idValue: 'og:title', updateKey: 'content', updateValue: 'Forgot password | Famous-Quotes.uk'},
        {idKey: 'property', idValue: 'og:description', updateKey: 'content', updateValue: 'Forgotten your password? Reset it here.'},
        {idKey: 'property', idValue: 'og:image', updateKey: 'content', updateValue: `${PROD_BASE_URL}/share-icon.png`},
        {idKey: 'property', idValue: 'og:url', updateKey: 'content', updateValue: `${PROD_BASE_URL}${APP_PASSWORD_FORGOT}`},
        {idKey: 'property', idValue: 'og:type', updateKey: 'content', updateValue: 'article'},
        {idKey: 'name', idValue: 'twitter:card', updateKey: 'content', updateValue: 'summary'},
    ]
    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: `${PROD_BASE_URL}${APP_PASSWORD_FORGOT}`},
    ]


    return (
        <GenericScreen metas={metas} links={links} title={'Forgot password | Famous-Quotes.uk'}>
            <div className='container my-5 d-flex flex-column align-items-center'>
                <h1>Forgotten Password?</h1>
                <ul>
                    <li>Enter your email below and click the button.</li>
                    <li>You will then get an email with a link that you can use to reset your password.</li>
                </ul>
                <input 
                    className='form-control' 
                    placeholder='Email' 
                    value={email} 
                    onChange={(e)=>setEmail(e.target.value)}
                    style={{maxWidth: 400, textAlign: 'center'}}
                />

                {sending ? 
                    <div className='spinner-border mt-3' style={{width: 50, height: 50, fontSize: 30}}></div>
                :
                    <button 
                        className='btn btn-primary mt-3'
                        onClick={clickHandler}
                    >Send email</button>
                }
            </div>
        </GenericScreen>
    )
}

export default PasswordResetScreen