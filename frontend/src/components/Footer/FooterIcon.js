import React, {useContext, useState} from 'react'

import { Link } from 'react-router-dom'
import { GlobalContext } from '../../data/GlobalContext'

const FooterIcon = (props) => {

    const {dispatch} = useContext(GlobalContext)

    const [hover, setHover] = useState(false)

    const baseStyles = {
        transform: hover ? 'scale(1.2)' : 'scale(1)',
        transition: 'all 300ms ease-in-out',
    }

    return (
        <Link 
            style={baseStyles}
            to={props.link}
            onClick={()=>{
                dispatch({type: 'ADD_ANALYTIC', action: `footer: socials: ${props.type}`})
                alert('Coming soon!')
            }}
            onMouseEnter={()=>setHover(true)}
            onMouseLeave={()=>setHover(false)}
        >
            {props.children}
        </Link>
    )
}

export default FooterIcon