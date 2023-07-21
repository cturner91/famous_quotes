import React from 'react'

import {Transition} from 'react-transition-group'


const ScreenFadeWrapper = (props) => {

    const timeout = props.timeout ? props.timeout : 300
    
    const baseStyles = {
        width: '100%',
        height: '100%',
        // minWidth: '100vw',
        // minHeight: '100vh',
        transition: `opacity ${timeout}ms ease-in-out, left ${timeout}ms ease-in-out`,
        position: 'relative',
    }

    // reset position to static when done such that Modal positions relative to screen, not container
    const transitionStyles = {
        entering: {opacity: 0, left: '-20vw'},
        entered: {opacity: 1, left: 0, position: 'static'},
        exiting: {opacity: 1, left: 0, position: 'static'},
        exited: {opacity: 0, left: '-20vw'},
    }

    return (
        <Transition timeout={timeout} in={true} appear={true}>
            {state=>{
                return (
                    <div style={{...baseStyles, ...transitionStyles[state]}}>
                        {props.children}
                    </div>
                )
            }}
        </Transition>
    )
}

export default ScreenFadeWrapper