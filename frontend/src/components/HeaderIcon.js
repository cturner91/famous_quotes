import React, {useContext, useState} from 'react'

import { Link } from 'react-router-dom'
import { GlobalContext } from '../data/GlobalContext'

const HeaderIcon = (props) => {

    const {dispatch} = useContext(GlobalContext)

    const [barStyles, setBarStyles] = useState({
        height: 5,
        width: 0,
        backgroundColor: 'white',
        borderRadius: 20,
        // transition: 'all 400ms cubic-bezier(.37,1.61,.58,.87)',
    })

    const iconClassNames = {
        home: 'fa-solid fa-house',
        search: 'fa-solid fa-magnifying-glass',
        // newest: 'fa-sharp fa-solid fa-sparkles',
        newest: 'fa-solid fa-square-rss',
        add: 'fa-solid fa-plus',
        qotd: 'fa-solid fa-calendar-days',
        account: 'fa-solid fa-user',
    }

    const divStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 15,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 15,
        maxWidth: 100,
        textAlign: 'center',
        height: '100%',
    }

    const iconStyles = {
        fontSize: 20,
    }

    const labelStyles = {
        fontSize: window.innerWidth < 500 ? 12 : 16,
        flexGrow: 1,
        
        // all this just to vertically align text...
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
    }

    const mouseEnterHandler = () => {
        setBarStyles({...barStyles, 
            width: '100%',
            transition: 'all 400ms cubic-bezier(.37,1.61,.58,.87)',
        })
    }
    const mouseLeaveHandler = () => {
        setBarStyles({...barStyles, width: 0, 
            transition: 'all 400ms ease-in-out',
        })
    }


    return (
        <Link 
            to={props.url}
            onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: `header: navigate: ${props.url}`})}
        >
            <div 
                style={divStyles} 
                onMouseEnter={mouseEnterHandler}
                onMouseLeave={mouseLeaveHandler}
            >
                <i style={iconStyles} className={iconClassNames[props.icon]}></i>
                <span style={labelStyles}>{props.label}</span>
                <div style={barStyles}></div>
            </div>
        </Link>
    )
}

export default HeaderIcon