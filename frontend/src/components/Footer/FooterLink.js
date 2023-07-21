import React, {useContext, useState} from 'react'

import { Link } from 'react-router-dom'
import { GlobalContext } from '../../data/GlobalContext'


const FooterLink = (props) => {

    const {dispatch} = useContext(GlobalContext)

    const [barStyles, setBarStyles] = useState({
        height: 3,
        width: 0,
        backgroundColor: 'white',
        borderRadius: 3,
        // transition: 'all 400ms cubic-bezier(.37,1.61,.58,.87)',
    })

    const labelStyles = {
        fontSize: 16,
        marginLeft: 10,
    }

    const mouseEnterHandler = () => {
        setBarStyles({...barStyles, 
            width: '100%',
            transition: 'all 400ms cubic-bezier(.37,1.61,.58,.87)',
        })
    }
    const mouseLeaveHandler = () => {
        setBarStyles({...barStyles, 
            width: 0, 
            transition: 'all 400ms ease-in-out',
        })
    }


    return (
        <Link 
            to={props.url} 
            onMouseEnter={mouseEnterHandler} 
            onMouseLeave={mouseLeaveHandler}
            onClick={()=>dispatch({type: 'ADD_ANALYTIC', action: `footer: navigate: ${props.url}`})}
            className='d-flex flex-column mt-2'
        >
            <div style={{marginLeft: 20}}>
                <i className="fa-solid fa-arrow-right"></i>
                <span style={labelStyles}>{props.label}
                    <div style={barStyles}></div>
                </span>
            </div>
        </Link>
    )
}

export default FooterLink