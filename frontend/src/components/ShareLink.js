import React, {useContext, useState} from 'react'
import { GlobalContext } from '../data/GlobalContext'

const ShareLink = ({
    type='',
    link=window.location.href,
    styles={},
}) => {

    const {state, dispatch} = useContext(GlobalContext)

    const [hover, setHover] = useState(false)

    const shareDivStyles = {
        margin: 10,
        borderRadius: 5, 
        minHeight: 30, 
        width: 130,
        display: 'flex', 
        flexDirection: 'row',
        flexFlow: 'row wrap', 
        paddingLeft: 5, 
        paddingRight: 10,
        transition: 'all 300ms ease-in-out',
        boxShadow: hover ? '0px 0px 15px grey' : null,
        transform: hover ? 'translate(0px, 0px) scale(1.1)' : null,
    }
    const shareIconStyles = {
        margin: 'auto', 
        fontSize: 20,
    }
    const shareSpanStyles = {
        width: 60, 
        margin: 'auto',
    }

    const generateSpecifics = () => {
        if (type.toLowerCase()==='whatsapp') {
            return {
                link: `whatsapp://send?text=${link}`,
                styles: {backgroundColor: 'rgb(69, 196, 85)', color: 'white'},
                class: 'fab fa-whatsapp'
            }
        } else if (type.toLowerCase()==='facebook') {
            return {
                link: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
                styles: {backgroundColor: 'rgb(24, 119, 242)', color: 'white'},
                class: 'fab fa-facebook'
            }
        } else if (type.toLowerCase()==='twitter') {
            return {
                link: `https://www.twitter.com/intent/tweet?url=${link}`,
                styles: {backgroundColor: 'rgb(29, 161, 242)', color: 'white'},
                class: 'fab fa-twitter'
            }
        } else if (type.toLowerCase()==='linkedin') {
            return {
                link: `https://www.linkedin.com/shareArticle?mini=true&source=${link}&url=${link}`,
                styles: {backgroundColor: 'rgb(0, 119, 181)', color: 'white'},
                class: 'fab fa-linkedin'
            }
        }
    }
    const specifics = generateSpecifics()

    // Note: React-Router is only for internal navigation so using normal ahrefs (https://stackoverflow.com/a/64092922)
    return (
        <a 
            href={specifics.link}
            onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: `share link:${specifics.link}`, forceCommit: true})}
        >
            <div 
                style={{...shareDivStyles, ...specifics.styles, ...styles}} 
                onMouseEnter={()=>setHover(true)}
                onMouseLeave={()=>setHover(false)}
            >
                <i className={specifics.class} style={shareIconStyles}></i>
                <span style={shareSpanStyles}>{type}</span>
            </div>
        </a>
    )
}

export default ShareLink