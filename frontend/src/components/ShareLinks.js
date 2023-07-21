import React from 'react'

import ShareLink from './ShareLink'


const ShareLinks = ({
    whatsapp=true,
    facebook=true,
    linkedin=true,
    twitter=true,
    generic=true,
    styles={},
    title,
    link=window.location.href,
    orientation=''
}) => {

    const divStyles = {
        maxWidth: '100%',
        display: 'flex',
        flexDirection: orientation || 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
    }

    const copyToClipboard = async (link) => { 
        await navigator.clipboard.writeText(link) 
        alert('Link copied to clipboard.')
    }

    return (
        <div className='d-flex flex-column align-items-center' style={styles}>
            <h2 style={{textAlign: 'center'}}>{title || 'Share this page'}</h2>
            <div style={divStyles}>
                {!whatsapp ? null : <ShareLink link={link} type='Whatsapp' />}
                {!facebook ? null : <ShareLink link={link} type='Facebook' />}
                {!twitter  ? null : <ShareLink link={link} type='Twitter' />}
                {!linkedin ? null : <ShareLink link={link} type='LinkedIn' />}

                {!generic  ? null : 
                    <button 
                        style={{width: 130}}
                        className='btn btn-sm btn-dark mt-3' 
                        onClick={()=>copyToClipboard(link)}
                    >
                        Copy link
                    </button>
                }
            </div>
        </div>
    )
}

export default ShareLinks