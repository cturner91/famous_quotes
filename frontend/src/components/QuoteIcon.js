import React, {useState} from 'react'


const QuoteIcon = (props) => {

    const duration = 200
    const defaultTransform = 'rotate(0deg)'

    const [transform, setTransform] = useState(defaultTransform)
    const [showAlert, setShowAlert] = useState(false)


    const iconEnterHandler = () => {
        setTransform(props.transform)

        if(props.autoReturn) {
            setTimeout(iconExitHandler, duration)
        }
    }

    const iconExitHandler = () => {
        setTransform(defaultTransform)
    }

    const clickHandler = (event) => {
        props.clickCallback()
        setShowAlert(true)
        setTimeout(()=>setShowAlert(false), 10000)
        event.stopPropagation()
    }

    const boxStyle = {
        minWidth: 70,
        textAlign: 'center',
    }

    const iconStyle = {
        fontSize: 26,
        cursor: 'pointer',
        transition: `all ${duration}ms ease-in-out`,
        transform: transform,
        ...props.style
    }

    const labelStyle = {
        fontSize: 10,
        marginTop: 5,
    }


    return (
        <div className='d-flex flex-column align-items-center' style={boxStyle}>
            <i 
                onMouseEnter={iconEnterHandler} 
                onMouseLeave={iconExitHandler} 
                onClick={clickHandler}
                title={props.title} 
                style={{...iconStyle}} 
                className={props.class}
            ></i>
            <span style={labelStyle}>{props.label}</span>
        </div>
    )
}

export default QuoteIcon