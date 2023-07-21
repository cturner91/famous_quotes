import React, {useState, useRef, useEffect} from 'react'

import ScreenFadeWrapper from '../ScreenFadeWrapper'


const ImageSplash = (props) => {

    // after 1 second, oad the fullres image and use it in place of the low-res image (low-res used to boost load-times only)
    // useEffect( () => { setTimeout( ()=>{ setImgSrc(props.splashImage.imgFullRes) }, 2000) }, [])

    const img = useRef()

    // use state because we need to force a re-render when image loads
    const [imgProps, setImgProps] = useState({})
    // const [imgSrc, setImgSrc] = useState(props.splashImage.img)
    const imgSrc = props.splashImage.img

    
    const imageStyles = {
        minHeight: 250,
        width: 'auto',
        maxWidth: '100vw',
        height: 'auto',
        maxHeight: '75vh',
    }

    const divStyles = {
        backgroundColor: 'rgba(0,0,0,0.85)',
        width: '100vw',
        margin: 'auto',
        textAlign: 'center',
    }

    const quoteBoxStyle = {
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        left: `${imgProps ? imgProps.offsetLeft : 0}px`,
        width: `${imgProps ? imgProps.width : 0}px`,
        top: 0,
        height: `${imgProps ? imgProps.height : 0}px`,
        padding: 20,
        ...props.splashImage.textStyles(),
    }

    const quoteBoxQuoteStyle = {
        width: '95%',
        textAlign: 'center',
    }
    const quoteBoxAuthorStyle = {
        width: '95%',
        textAlign: 'right',
    }

    return (
        <ScreenFadeWrapper>
            <div style={divStyles}>
                <img 
                    ref={img} 
                    src={imgSrc} 
                    style={imageStyles} 
                    alt={props.splashImage.alt}
                    onLoad={() => {
                        // img.current must be a class, not a pure object, so can't just destructure
                        setImgProps({
                            offsetLeft: img.current.offsetLeft, 
                            width: img.current.width,
                            height: img.current.height,
                        })
                    }}
                />
                <div style={quoteBoxStyle}>
                    <span style={quoteBoxQuoteStyle}>&ldquo;{props.splashImage.quote}&rdquo;</span>
                    <span style={quoteBoxAuthorStyle}>- {props.splashImage.author}</span>
                </div>
            </div>
        </ScreenFadeWrapper>
    )
}

export default ImageSplash