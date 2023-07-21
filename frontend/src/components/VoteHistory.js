import React, {useState} from 'react'

import { Transition } from 'react-transition-group'
import { COLORS } from '../data/constants'


const VoteHistory = (props) => {

    const [tooltip, setTooltip] = useState('')
    const [showTooltip, setShowTooltip] = useState(false)

    const format = props.format || 'daily'  // monthly / daily

    if (Object.keys(props.data).length === 0) return <></>

    const dims = {
        height: 400,
        width: '95%',
        top: 50,  // leave enough space for tooltip
        bottom: 40,
        left: 10,
        right: 10,
    }

    const summaryData = props.data['summary']
    const periods = Object.keys(summaryData[format])
        .sort( (a,b)=> a < b ? -1 : 1)
        .slice(-12)  // filter to only last 12 periods?
    let maxUpvotes = 0, maxDownvotes = 0
    periods.forEach(period=>{
        maxUpvotes = Math.max(maxUpvotes, summaryData[format][period]['upvotes'])
        maxDownvotes = Math.max(maxDownvotes, summaryData[format][period]['downvotes'])
    })
    const maxScale = maxUpvotes + maxDownvotes

    const scaleY = (y) => dims.top + (dims.height-dims.top-dims.bottom) / maxScale * (maxUpvotes - y)


    const chartBoxStyles = {
        height: dims.height,
        width: dims.width,
        maxWidth: 700,
        border: '1px solid grey',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        position: 'relative',
        paddingLeft: dims.left,
        paddingRight: dims.right,
        boxShadow: '0 0 10px grey',
    }

    const barWidth = () => `${(100/periods.length/1.1).toFixed(0)}%`

    const chartBarStyle = {
        width: barWidth(),
        maxWidth: 100,
        textAlign: 'center',
        position: 'relative',
    }
    const barUpvoteStyle = {
        backgroundColor: COLORS.voteHistoryUpvotes,
        position: 'relative',
        borderRadius: 5,
    }
    const barDownvoteStyle = {
        backgroundColor: COLORS.voteHistoryDownvotes,
        position: 'relative',
        borderRadius: 5,
    }
    const tooltipStyle = {
        base: {
            position: 'absolute',
            top: 5,
            borderRadius: 5,
            padding: 5,
            transition: 'opacity 400ms ease-in-out',
            border: '1px solid black',
        }
        , entering: {opacity: 0,}
        , entered: {opacity: 1,}
        , exiting: {opacity: 1,}
        , exited: {opacity: 0,}
    }

    const updateTooltip = (show, text) => {
        setShowTooltip(show)
        setTooltip(text)
    }

    const displayPeriod = (period) => {
        // make period label easy to read
        const replaceMonth = (m) => m.replace('01-','Jan-').replace('02-','Feb-').replace('03-','Mar-').replace('04-','Apr-').replace('05-','May-').replace('06-','Jun-').replace('07-','Jul-').replace('08-','Aug-').replace('09-','Sep-').replace('10-','Oct-').replace('11-','Nov-').replace('12-','Dec-')
        if (format==='monthly') {
            let v = replaceMonth(period+'-').split('-')
            return `${v[1]}`
        } else if (format==='daily') {
            let v = replaceMonth(period.slice(5)).split('-')
            return `${v[1]}-${v[0]}`
        } else {
            return period
        }
    }

    return (
        <div className='w-100 my-5 d-flex flex-column align-items-center'>
            <h2>Vote History</h2>

            {periods.length === 0 ? <p className='mt-3 text-center'>No voting history yet. Try again soon.</p> :
                <div style={chartBoxStyles}>
                    {periods.map( (period,i)=>{
                        const upvotes = summaryData[format][period]['upvotes']
                        const downvotes = summaryData[format][period]['downvotes']
                        const upvotesTooltip = `${upvotes} ${upvotes === 1 ? ' upvote' : ' upvotes'} ${format==='daily' ? 'on' : 'in'} ${period}`
                        const downvotesTooltip = `${downvotes} ${downvotes === 1 ? ' downvote' : ' downvotes'} ${format==='daily' ? 'on' : 'in'} ${period}`
                        return (
                            <div key={`bar${i}`} style={chartBarStyle}>
                                
                                <div style={{fontSize: 10, position: 'relative', top: scaleY(upvotes)}}>
                                    {/* this awkward hack is to stop the downvotes bar rising if there is no upvotes label */}
                                    {upvotes===0 ? <>&nbsp;</> : upvotes}
                                </div>

                                <div style={{...barUpvoteStyle,
                                        top: scaleY(upvotes),
                                        height: scaleY(0)-scaleY(upvotes),
                                    }}
                                    onMouseEnter={()=>updateTooltip(true, upvotesTooltip)}
                                    onClick={()=>updateTooltip(true, upvotesTooltip)}
                                    onMouseLeave={()=>setShowTooltip(false)}
                                ></div>
                                <div style={{...barDownvoteStyle,
                                        top: scaleY(upvotes),  // not sure why this works but it does...
                                        height: scaleY(-1*downvotes)-scaleY(0),
                                    }}
                                    onMouseEnter={()=>updateTooltip(true, downvotesTooltip)}
                                    onClick={()=>updateTooltip(true, downvotesTooltip)}
                                    onMouseLeave={()=>setShowTooltip(false)}
                                ></div>

                                {downvotes === 0 ? null : // don't display if downvotes == 0 - gets in the way of period label
                                    <div style={{
                                        fontSize: 10, 
                                        position: 'relative', 
                                        top: scaleY(0) - (scaleY(0)-scaleY(upvotes))
                                    }}>{downvotes}</div>
                                }

                                <div style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                                    <div style={{
                                        position: 'absolute',
                                        top: scaleY(0)-3, 
                                        width: '100%',
                                        maxWidth: 100,
                                        fontSize: 10,
                                    }}>
                                        {displayPeriod(period)}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    <Transition timeout={1} in={showTooltip} appear={showTooltip}>
                        {tState=><div style={{...tooltipStyle['base'], ...tooltipStyle[tState]}}>{tooltip}</div>}
                    </Transition>
                </div>
            }

            {periods.length === 0 ? null :
                <table className='my-3 table table-sm table-hover table-bordered text-center' style={{maxWidth: 400}}>
                    <thead>
                        <tr>
                            <th>{format==='monthly' ? 'Month' : 'Day'}</th>
                            <th>Upvotes</th>
                            <th>Downvotes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {periods.map( (period, i)=>{
                            return (
                                <tr key={`tr${i}`} >
                                    <td>{period}</td>
                                    <td>{summaryData[format][period]['upvotes']}</td>
                                    <td>{summaryData[format][period]['downvotes']}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            }
        </div>
    )
}

export default VoteHistory