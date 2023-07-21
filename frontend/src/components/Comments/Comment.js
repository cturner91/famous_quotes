import React, {useState} from 'react'
import { COLORS } from '../../data/constants'
import { friendlyDate } from '../../data/utils'

const Comment = (props) => {

    const [hover, setHover] = useState(false)

    const divStyles = {
        border: '1px solid black',
        borderRadius: 10,
        marginTop: 15,
        marginBottom: 15,
        maxWidth: 600,
        padding: 15,
        paddingTop: 5,
        width: '95%',
        boxShadow: `0 0 15px ${hover ? COLORS.main(1) : 'grey'}`,
        transition: 'all 400ms ease-in-out',
    }

    const dt = friendlyDate(props.data.created_at, {format: '%Y-%m-%d'})
    const dtReply = friendlyDate(props.data.reply_datetime, {format: '%Y-%m-%d'})

    return (
        <div 
            className='d-flex flex-column' 
            style={divStyles}
            onMouseEnter={()=>setHover(true)}
            onMouseLeave={()=>setHover(false)}
        >

            <div style={{width: '100%',textAlign: 'justify'}}>
                <div>
                    <span style={{fontSize:12}}>Comment from: </span>
                    <span style={{fontWeight: 'bold'}}>{props.data.username || 'Anonymous'} </span>
                    <span style={{fontSize:12}}>on: {dt}</span>
                </div>
                <div style={{width: '100%', textAlign: 'justify'}}>{props.data.comment}</div>
            </div>

            {!props.data.reply ? null : 
                <div style={{width: '100%', textAlign: 'right', borderTop: '1px solid grey', paddingTop: 5, marginTop: 5}}>
                    <div style={{fontSize:12}}>
                        <span>Reply from: </span>
                        <span style={{fontWeight: 'bold'}}>Admin </span>
                        <span>on: {dtReply}</span>
                    </div>
                    {props.data.reply}
                </div>
            }
        </div>
    )
}

export default Comment