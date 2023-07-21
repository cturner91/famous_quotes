import React, { useContext } from 'react'

import { Link } from 'react-router-dom'

import FooterIcon from './FooterIcon'
import FooterLink from './FooterLink'
import InstagramIcon from './insta_icon.png'
import { APP_ADD_QUOTE_URL, APP_LOGIN_URL, APP_QOTD_URL, APP_QUOTES_URL, APP_URL, APP_CONTACT_URL, COLORS, APP_DEVELOPER_URL, APP_PRIVACY_URL, APP_FEATURES_URL, APP_ABOUT_URL, APP_TERMS_URL } from '../../data/constants'
import { GlobalContext } from '../../data/GlobalContext'


const Footer = (props) => {

    const {state, dispatch} = useContext(GlobalContext)

    const footerStyle = {
        width: '100vw',
        backgroundColor: COLORS.main(1),
        borderTop: '2px solid black',
        borderBottom: '2px solid black',
        boxShadow: '0 0 10px grey',
        paddingTop: 20,
        paddingBottom: 50,
        paddingLeft: 30,
        paddingRight: 30,   
    }
    
    const titleStyle = {
        fontSize: 20,
        fontWeight: 'bold',
        fontStyle: 'italic',
        width: '100%',
        textAlign: 'center',
    }

    const a = (analyticsText) => {
        dispatch({type: 'ADD_ANALYTIC', action: analyticsText})
    }

    return (
        <div style={footerStyle}>
            <div className='row'>

                <div className='col-12 col-md-4 my-3'>
                    <Link to={APP_URL} onClick={()=>a('footer:famous-quotes link:click')}>
                        <p style={titleStyle}>Famous-Quotes.uk</p>
                    </Link>
                    <p style={{textAlign: 'center'}}>The best place to find the most famous quotes from history.</p>
                </div>

                <div className='col-12 col-sm-6 col-md-4 my-3' style={{paddingLeft: 30}}>
                    <span style={{fontWeight: 'bold'}}>Page Links</span>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'start',
                    }}>
                        <FooterLink url={`${APP_URL}`} label='Home'/>
                        <FooterLink url={`${APP_QUOTES_URL}`} label='All Quotes'/>
                        <FooterLink url={`${APP_QUOTES_URL}?s=newest`} label='New Quotes'/>
                        <FooterLink url={`${APP_ADD_QUOTE_URL}`} label='Add a quote'/>
                        <FooterLink url={`${APP_QOTD_URL}`} label='Quote of the day'/>
                        <FooterLink url={`${APP_LOGIN_URL}`} label='Login / Account'/>
                    </div>
                </div>

                <div className='col-12 col-sm-6 col-md-4 my-3' style={{paddingLeft: 30}}>
                    <span style={{fontWeight: 'bold'}}>Useful Links</span>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'start',
                    }}>
                        <FooterLink url={`${APP_QUOTES_URL}?s=random`} label='Random Quotes'/>
                        <FooterLink url={`${APP_ABOUT_URL}`} label='About us' />
                        <FooterLink url={`${APP_CONTACT_URL}`} label='Contact us' />
                        <FooterLink url={`${APP_DEVELOPER_URL}`} label='Developer Info' />
                        {/* <FooterLink url={`${APP_FEATURES_URL}`} label='Upcoming Features' /> */}
                    </div>
                </div>

            </div>

            <div 
                style={{
                    position: 'relative',
                    left: -30,
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderTop: '2px solid black',
                    borderBottom: '2px solid black',
                    marginTop: 30,
                    padding: 20,
                    backgroundColor: 'white',
                }}
            >
                <h3>Connect with us on social media</h3>
                <div className='d-flex flex-row justify-content-around w-100' style={{maxWidth: 500}}>
                    <FooterIcon type='facebook'>
                        <i style={{fontSize: 40, color: '#1B74E4'}} className='fa-brands fa-square-facebook'/>
                    </FooterIcon>

                    <FooterIcon type='twitter'>
                        <i style={{fontSize: 40, color: 'rgb(29, 155, 240)'}} className='fa-brands fa-square-twitter'/>
                    </FooterIcon>

                    <FooterIcon type='instagram'>
                        <img src={InstagramIcon} width={40} height={40} alt='Instagram icon' />
                    </FooterIcon>

                </div>
            </div>

            <div className='row mt-3'>
                <div className='col-12 mt-5' style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                }}>
                    <span>Copyright © {(new Date()).toLocaleDateString().slice(-4)}. All rights reserved.</span>
                </div>

                <div className='col-12 mt-3' style={{
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-around',                    
                }}>
                    <Link to={`${APP_PRIVACY_URL}`} onClick={()=>a('footer:privacy policy link:click')}>
                        <span>Privacy policy</span>
                    </Link>
                    <Link to={`${APP_TERMS_URL}`} onClick={()=>a('footer:terms of service link:click')}>
                        <span>Terms of Service</span>
                    </Link>
                </div>

            </div>
        </div>
    )
}

export default Footer
