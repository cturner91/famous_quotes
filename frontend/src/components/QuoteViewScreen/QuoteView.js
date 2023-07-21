import React, {useState, useRef, useContext, useEffect} from 'react'

import AnimateHeight from 'react-animate-height'

import { GlobalContext } from '../../data/GlobalContext'
import {quoteViewImages, quoteViewFonts, APP_QUOTE_VIEW_URL, API_QUOTE_URL, APP_URL, DEBUG, PROD_BASE_URL} from '../../data/constants'
import ShareLinks from '../ShareLinks'
import axios from 'axios'
import MetaHoc from '../MetaHoc'

axios.defaults.withCredentials = true  // necessary to persist sessions


const QuoteView = (props) => {

    const quoteViewImagesSorted = quoteViewImages.sort( (a,b) => a.name < b.name ? -1 : 1)

    const colors = [
        {name: 'White', css: 'White'}, 
        {name: 'Black', css: 'Black'}, 
        {name: 'Grey', css: 'Grey'}, 
        {name: 'Light grey', css: 'LightGrey'}, 
        {name: 'Light blue', css: 'LightBlue'}, 
        {name: 'Light green', css: 'LightGreen'}, 
    ]

    // cannto create a quote-view without a quote! It must be set in context
    // update: for sharing quote-views, it needs to be possible to access without a quote in context. see useEffect
    const {state, dispatch} = useContext(GlobalContext)

    let starterImgId = 0
    quoteViewImagesSorted.forEach( (quoteViewImage,i) => {
        if (quoteViewImage.id === 25) starterImgId = i
    })

    const [imgData, setImgData] = useState(quoteViewImagesSorted[starterImgId])
    const [color, setColor] = useState('white')
    const [font, setFont] = useState(quoteViewFonts[0].name)
    const [fontSize, setFontSize] = useState(30)
    const [brightness, setBrightness] = useState(0)
    const [alignmentH, setAlignmentH] = useState('center')
    const [alignmentV, setAlignmentV] = useState('start')
    const [width, setWidth] = useState(100)
   
    const [colorDropdown, setColorDropdown] = useState('black')
    const [colorText, setColorText] = useState('')

    const [edit, setEdit] = useState(true)
    const [link, setLink] = useState(window.location.href)


    useEffect( ()=>{
        const urlSearchParams = new URLSearchParams(window.location.search)
        const searchParams = Object.fromEntries(urlSearchParams.entries())
        
        // set all the state values based on what's in URL
        if (!state.quote && Object.keys(searchParams).indexOf('q') < 0) {
            window.history.back()
        
        } else if (!state.quote && 'q' in searchParams) {
            // GET the quote!
            axios({
                url: `${API_QUOTE_URL}?ids=${searchParams['q']}`,
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            })
            .catch( err => {
                // console.log(err)
                alert('Sorry, something went wrong when getting the quote data.')
                window.location.href = APP_URL
            })
            .then (response => {
                // console.log(response)
                dispatch({type: 'SET_QUOTE', quote: response.data.data[0]})
            })

        } else {
            // state.quote must exist
            updateUrl('q', state.quote.id)  // set the current URL
        }

        // set all the state parametrs
        const img = quoteViewImages.filter(img => Number(img.id)===Number(searchParams['img']))
        if (img.length > 0) {setImgData(img[0])}
        setColor(searchParams['c'] || color)
        setFont(searchParams['f'] || font)
        setFontSize(Number(searchParams['s']) || fontSize)
        setBrightness(Number(searchParams['b']) || brightness)
        setAlignmentH(searchParams['h'] || alignmentH)
        setAlignmentV(searchParams['v'] || alignmentV)
        setWidth(Number(searchParams['w']) || width)

        setEdit(Object.keys(searchParams).indexOf('e') < 0)
    }, [])


    const setFontColor = (colors) => {
        // helper function - if colorText is set then use that. Otherwise, use colorDropdown
        if (colors.colorText.length > 0) {
            setColor(colors.colorText)
        } else {
            setColor(colors.colorDropdown)
        }
    }

    const updateImg = (v) => {
        // go through all images and find the one with this ID
        const img = quoteViewImages.find( img => Number(img.id)===Number(v) )
        setImgData(img)
    }

    const img = useRef()

    // use state because we need to force a re-render when image loads
    const [imgProps, setImgProps] = useState({})

    const imageStyles = {
        width: 'auto',
        maxWidth: '95vw',
        height: 'auto',
        maxHeight: '75vh',
        marginTop: 0,
        marginBottom: 20,
        boxShadow: '0 0 30px lightgrey',
        borderRadius: 10,
    }

    const divStyles = {
        backgroundColor: 'rgba(0,0,0,1)',
        width: '100vw',
        margin: 'auto',
        textAlign: 'center',
        paddingTop: 5,
        padding: 10,
    }

    const quoteTintBoxStyle = {
        position: 'absolute',
        left: `${imgProps ? imgProps.offsetLeft-1 : 0}px`,
        width: `${imgProps ? imgProps.width+1 : 0}px`,
        top: `${imgProps ? imgProps.offsetTop : 0}px`,
        height: `${imgProps ? imgProps.height : 0}px`,
        backgroundColor: brightness < 0 ? 'black' : 'white',
        opacity: Math.abs(Number(brightness)),
        borderRadius: 10,
    }
    const quoteBoxStyle = {
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        left: `${imgProps ? imgProps.offsetLeft : 0}px`,
        width: `${imgProps ? imgProps.width : 0}px`,
        top: `${imgProps ? imgProps.offsetTop : 0}px`,
        height: `${imgProps ? imgProps.height : 0}px`,
        padding: 20,
        color, fontSize,
        justifyContent: alignmentV,
        alignItems: alignmentH==='right' ? 'end' : alignmentH==='left' ? 'start' : 'center',
        overflow: 'hidden',
    }

    const quoteBoxQuoteStyle = {
        width: `${width}%`,
        textAlign: alignmentH,
        opacity: 1,
        fontFamily: font,
    }
    const quoteBoxAuthorStyle = {
        width: `${width}%`,
        textAlign: alignmentH,
        opacity: 1,
        fontFamily: font,
    }
    const controlPanelBoxStyles = {
        color: 'white',
    }
    const labelStyles = {
        width: 170,
        marginRight: 10,
    }
    const inputGroupStyles = {
        display: 'flex',
        flexDirection: 'row',
        marginTop: 5,
    }
    const dropdownStyles = {
        width: 180,
        textAlign: 'center',
        borderRadius: 5,
        color: 'black',
    }

    const buildUrl = (data) => {
        let url = APP_QUOTE_VIEW_URL
        const keys = Object.keys(data)
        for (let i=0; i<keys.length; i++) {
            const delim = i===0 ? '?' : '&'
            const key = keys[i]
            const value = data[key]
            url += `${delim}${key}=${value}`
        }
        return url
    }

    const updateUrl = (key, value) => {
        let data = {
            q: state.quote.id,
            img: quoteViewImages.find( img => img.img===imgData.img).id,
            c: color,
            f: font,
            s: fontSize,
            b: brightness,
            h: alignmentH,
            v: alignmentV,
            w: width,
            e: 0,
        }
        data[key] = value
        const url = buildUrl(data)
        window.history.replaceState(null, window.title, url)
        setLink(DEBUG ? url : `${PROD_BASE_URL}${url}`)
        // console.log(`${PROD_BASE_URL}${url}`)
    }


    if (!state.quote) return (
        <div className='d-flex flex-column align-items-center my-5'>
            <div className='spinner-border mt-3' style={{width: 100, height: 100, fontSize: 50}}></div>
        </div>
    )

    const links = [
        {idKey: 'rel', idValue: 'canonical', updateKey: 'href', updateValue: link},
    ]


    return (
        <div style={divStyles}>
            <MetaHoc links={links} />
            {edit ?
            <div className='px-3 mb-5' style={{color: 'white', textAlign: 'left', fontSize: window.innerWidth < 700 ? 12 : 16}}>
                <ul>
                    <li>Use the options below the picture to adjust the colors and presentation.</li>
                    <li>When finished, save and share via the buttons provided.</li>
                </ul>
            </div>
            : <div style={{height: 50}}></div>}

            <div style={{position: 'relative', marginBottom: 20}}> {/* div exists purely to position against */}
                <img 
                    ref={img} 
                    src={imgData.img} 
                    style={imageStyles} 
                    onLoad={() => {
                        // img.current must be a class, not a pure object, so can't just destructure
                        setImgProps({
                            offsetLeft: img.current.offsetLeft, 
                            offsetTop: img.current.offsetTop, 
                            width: img.current.width,
                            height: img.current.height,
                        })
                    }}
                />
                <div style={quoteTintBoxStyle}></div>
                <div style={{...quoteBoxStyle, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'end', alignItems: 'end',}}>
                    <span style={{color, fontSize: window.innerWidth < 700 ? 10 : 14}}>from Famous-Quotes.uk</span>
                </div>
                <div style={quoteBoxStyle}>
                    <span style={quoteBoxQuoteStyle}>&ldquo;{state.quote.quote}&rdquo;</span>
                    <span style={quoteBoxAuthorStyle}>{state.quote.author.length > 1 ? `- ${state.quote.author}` : null}</span>
                </div>
            </div>

            {edit ?
            <div className='row' style={controlPanelBoxStyles}>

                <div className='col-12 col-md-6 d-flex flex-column align-items-center'>

                    <div style={inputGroupStyles} className=''>
                        <label style={labelStyles}>Select image:</label>
                        <select style={dropdownStyles} value={imgData.id} onChange={(e)=>{updateImg(e.target.value); updateUrl('img', e.target.value)}}>
                            {quoteViewImagesSorted.map( (img,i)=><option key={`image${i}`} value={img.id}>{img.name}</option>)}
                        </select>
                    </div>

                    <div style={inputGroupStyles} className=''>
                        <label style={labelStyles}>Font:</label>
                        <select style={dropdownStyles} value={font} onChange={(e)=>{setFont(e.target.value); updateUrl('f', e.target.value)}}>
                            {quoteViewFonts.map( (font,i) => <option key={`font${i}`} value={font.css}>{font.name}</option>)}
                        </select>
                    </div>

                    <div style={inputGroupStyles} className=''>
                        <label style={labelStyles}>Font size:</label>
                        <input 
                            style={dropdownStyles} 
                            type='range' 
                            min='10' 
                            step='1' 
                            max='60'
                            value={fontSize}
                            onChange={(e)=>{setFontSize(Number(e.target.value)); updateUrl('s', e.target.value)}}
                        />
                    </div>

                    <div style={inputGroupStyles} className=''>
                        <label style={{...labelStyles, paddingTop: colorDropdown==='other' ? 10 : 0}}>Font colour:</label>

                        <div className='d-flex flex-column align-items-center'>
                            <select 
                                style={dropdownStyles} 
                                value={colorDropdown} 
                                onChange={(e)=>{ 
                                    setColorDropdown(e.target.value)
                                    setFontColor({colorText, colorDropdown: e.target.value}) 
                                    updateUrl('c', e.target.value)
                                }}
                            >
                                {colors.map( (color,i) =><option key={`color${i}`} value={color.css}>{color.name}</option>)}
                                <option value='other'>Other</option>
                            </select>
                            
                            <AnimateHeight duration={400} height={colorDropdown==='other' ? 'auto' : 0}>
                                <input 
                                    type='text' 
                                    placeholder='RGB / hex / CSS name etc.' 
                                    style={dropdownStyles}
                                    value={colorText} 
                                    onChange={(e)=>{ 
                                        setColorText(e.target.value)
                                        setFontColor({colorText: e.target.value, colorDropdown}) 
                                        updateUrl('c', e.target.value)
                                    }} 
                                />
                            </AnimateHeight>

                        </div>
                    </div>                    

                </div>


                <div className='col-12 col-md-6 d-flex flex-column align-items-center'>

                    <div style={inputGroupStyles} className=''>
                        <label style={labelStyles}>Horizontal alignment:</label>
                        <select style={dropdownStyles} value={alignmentH} onChange={(e)=>{setAlignmentH(e.target.value); updateUrl('h', e.target.value)}}>
                            <option value='left'>Left</option>
                            <option value='center'>Centre</option>
                            <option value='right'>Right</option>
                        </select>
                    </div>

                    <div style={inputGroupStyles} className=''>
                        <label style={labelStyles}>Vertical alignment:</label>
                        <select style={dropdownStyles} value={alignmentV} onChange={(e)=>{setAlignmentV(e.target.value); updateUrl('v', e.target.value)}}>
                            <option value='start'>Top</option>
                            <option value='center'>Centre</option>
                            <option value='end'>Bottom</option>
                        </select>
                    </div>

                    <div style={inputGroupStyles} className=''>
                        <label style={labelStyles}>Textbox width:</label>
                        <input 
                            style={dropdownStyles}
                            type='range' 
                            min='10' 
                            max='100' 
                            step='5' 
                            value={width} 
                            onChange={(e)=>{setWidth(Number(e.target.value)); updateUrl('w', e.target.value)}} 
                        />
                    </div>

                    <div style={inputGroupStyles} className=''>
                        <label style={labelStyles}>Image brightness:</label>
                        <div style={{...dropdownStyles, display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>
                            <input type='range' min='-0.9' max='0.9' step='0.05' value={brightness} onChange={(e)=>{setBrightness(e.target.value); updateUrl('b', e.target.value)}} />
                            <button className='btn btn-sm btn-primary' onClick={()=>{setBrightness(0); updateUrl('b', 0)}}>Reset</button>
                        </div>
                    </div>

                </div>


                <div className='row mt-3'>
                    <div style={inputGroupStyles} className=''>
                        <label style={labelStyles}>Tips:</label>
                        <div className='d-flex flex-column'>
                            <ul style={{textAlign: 'left', fontSize: 14}}>
                                <li>Change image brightness to make writing appear more clearly.</li>
                                <li>Set textbox width, font size and alignment to place quote in less busy areas of picture.</li>
                            </ul>
                        </div>
                    </div>

                    <div className='d-flex flex-column' style={{maxWidth: 600, margin: 'auto'}}>
                        <span>All photos courtesy of www.unsplash.com.</span>
                        <ul style={{marginTop: 20, textAlign: 'left'}}>
                            <li style={{fontSize: 12}}>When shared, all the instructions will be removed so that the picture is emphasised.</li>
                            <li style={{fontSize: 12}}>We cannot guarantee that a quote-view will look exactly the same on different devices.</li>
                        </ul>
                    </div>
                    

                    <div className='w-100 d-flex flex-row justify-content-center mt-5 mb-3'>
                        <button 
                            className='btn btn-primary btn-sm'
                            onClick={()=>{
                                setEdit(false)
                                window.scrollTo(0,0)
                            }}
                        >View without editing options</button>
                    </div>            

                </div>
            </div>
            : 
            <div className='w-100 d-flex flex-row justify-content-center mt-5 mb-3'>
                <button 
                    className='btn btn-primary btn-sm'
                    onClick={()=>{
                        setEdit(true)
                        window.scrollTo(0,0)
                    }}
                >Edit</button>
            </div>            
            }
            
            <ShareLinks 
                link={link} 
                title='Share this quote' 
                styles={{marginTop: edit ? 50 : 0, color: 'white'}} 
            />

        </div>
    )
}

export default QuoteView