import React from 'react'

import {Transition} from 'react-transition-group'


const PassiveAlert = (props) => {

    const wrapperStyle = {
        position: 'fixed',
        left: 0,
        width: '100%',
        minWidth: '100vw',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        transition: `top ${props.timeout || 400}ms ease-in-out`,
        zIndex: 10,
    }

    const boxStyle = {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginLeft: 20,
        marginRight: 20,
        backgroundColor: 'white',
        border: '2px solid black',
        borderRadius: 10,
        padding: 10,
        paddingTop: 5,
    }

    const titleStyle = {
        fontSize: 18,
        fontWeight: 'bold',
    }

    const textStyle = {
        fontSize: 14,
    }

    const Spans = () => {
        if (props.texts.length === 0) return
        return (
            <>
                {props.texts.map( (text,i) => <span key={`span${i}`} style={textStyle}>{text}</span>)}
            </>
        )
    }

    return (
        <Transition in={props.show} appear={props.show} timeout={props.timeout ? props.timeout : 400}>
            {tState => {
                return (
                    <div style={{...wrapperStyle, top: tState.slice(0,5)==='enter' ? 20 : -100}}>
                        <div style={boxStyle}>
                            {props.title ? <span style={titleStyle}>{props.title}</span> : null}
                            <Spans />
                        </div>
                    </div>
                )                        
            }}
        </Transition>
    )
}

export default PassiveAlert