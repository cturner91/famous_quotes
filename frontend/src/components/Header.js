import React, {useContext} from 'react'

import {GlobalContext} from '../data/GlobalContext'
import HeaderIcon from './HeaderIcon'
import { APP_ACCOUNT_URL, APP_ADD_QUOTE_URL, APP_LOGIN_URL, APP_QOTD_URL, APP_QUOTES_URL, APP_URL, COLORS } from '../data/constants'


const Header = (props) => {

    const {state} = useContext(GlobalContext)

    const boxStyles = {
        width: '100vw',
        backgroundColor: COLORS.main(1),
        borderTop: '2px solid black',
        borderBottom: '2px solid black',
        boxShadow: '0 0 10px grey',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }

    const iconRowStyles = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'stretch',
    }
    

    const LogoutOrAccountLink = () => {
        if (state.user) return <HeaderIcon url={APP_ACCOUNT_URL} icon='account' label='My Account' />
        return <HeaderIcon url={APP_LOGIN_URL} icon='account' label='Login' />
    }

    return (
        <div style={boxStyles}>
            {!props.showTitle ? null : <span style={{fontStyle: 'italic', marginTop: 10, fontWeight: 'bold'}}>Famous-Quotes.uk</span>}
            <div style={iconRowStyles}>
                <HeaderIcon url={APP_URL} icon='home' label='Home' />
                <HeaderIcon url={APP_QUOTES_URL} icon='search' label='All Quotes' />
                <HeaderIcon url={`${APP_QUOTES_URL}?s=newest`} icon='newest' label='New Quotes' />

                <HeaderIcon url={APP_ADD_QUOTE_URL} icon='add' label='Add Quotes' />
                <HeaderIcon url={APP_QOTD_URL} icon='qotd' label='Quote of the Day' />
                {<LogoutOrAccountLink/>}
            </div>
        </div>
    )
}

export default Header
