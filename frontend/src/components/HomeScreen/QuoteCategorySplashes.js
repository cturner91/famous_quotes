import React from 'react'

import QuoteCategorySplash from './QuoteCategorySplash'


const QuoteCategorySplashes = (props) => {

    const categories = [
        {title: 'Motivational quotes', bgColor: 'rgba(0,128,0,0.3)', category: 'motivation', quotes: props.motivation || []}, 
        {title: 'Quotes about travelling', bgColor: 'rgba(0,0,128,0.3)', category: 'travel', quotes: props.travel || []}, 
        {title: 'Funny quotes', bgColor: 'rgba(128,0,0,0.3)', category: 'funny', quotes: props.funny || []}, 
        {title: 'Political quotes', bgColor: 'rgba(128,0,128,0.3)', category: 'politics', quotes: props.politics || []},
        {title: 'Quotes to help your career', bgColor: 'rgba(128,128,0,0.3)', category: 'career', quotes: props.career || []}, 
    ]

    return (
        <div style={{marginTop: 30, padding: 10, maxWidth: 800}}>
            <h2 style={{textAlign: 'center'}}>Explore quotes by categories</h2>
            {categories.map( (categoryData, i) => {
                return (
                    <QuoteCategorySplash
                        key={`quoteSplash${i}`}
                        panelSide={i % 2 === 0 ? 'left' : 'right'} 
                        data={categoryData}
                        quotes={categoryData.quotes}
                    />
                )
            })}
        </div>
    )
}

export default QuoteCategorySplashes