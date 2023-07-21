import React from 'react'

import { Transition } from 'react-transition-group'


const Modal = (props) => {

    const baseStyles = {
        position: 'fixed',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        transition: 'all 200ms ease-in-out',
        zIndex: 20,
    }

    const modalStyles = {
        exited: {
            left: '50%',
            top: '50%',
            width: 0,
            height: 0,
            minWidth: 0,
            minHeight: 0,
        },
        entering: {
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            minWidth: '100vw',
            minHeight: '100vh',
        },
        entered: {
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            minWidth: '100vw',
            minHeight: '100vh',
        },
        exiting: {
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            minWidth: '100vw',
            minHeight: '100vh',
        },
    }


    const innerBaseStyles = {
        transition: 'all 200ms ease-in-out'
    }
    const innerStyles = {
        exited: {
            opacity: 0
        },
        entering: {
            opacity: 0
        },
        entered: {
            opacity: 1
        },
        exiting: {
            opacity: 0
        },
    }

    const Children = () => <>{props.children}</>

    return (
        <Transition appear={props.show} in={props.show} timeout={200}>
            { state => {
                return (
                    <div style={{...baseStyles, ...modalStyles[state]}} onClick={props.hideModalHandler}>
                        {state==='entered' ?
                            <Transition appear={props.show} in={props.show} timeout={0}>
                                { state => {
                                    return (
                                        <div style={{...innerBaseStyles, ...innerStyles[state]}}>
                                            <Children hideModalHandler={props.hideModalHandler} />
                                        </div>
                                    )
                                }}
                            </Transition>
                        : null}
                    </div>
                )
            }}
        </Transition>
    )
}

export default Modal