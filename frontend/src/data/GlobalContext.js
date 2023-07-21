import React, { createContext, useReducer } from 'react'

import GlobalReducer from './GlobalReducer'


export const defaultContext = {
    user: null,

    // pre-load a known quote so that when a user goes to quote-views page, it's not nonsensical
    quote: {
      id: 79,
      author: 'Chinese proverb',
      quote: 'The best time to plant a tree was 20 years ago. The second best time is today.'
    },
    quotes: [],
    analytics: [],
    maxQuoteId: 2400,
    search: {categories: []},
    sessionChecked: false,
}

export const GlobalContext = createContext(defaultContext)

export const GlobalContextProvider = (props) => {
    
    const [state, dispatch] = useReducer(GlobalReducer, defaultContext)
    
    return (
        <GlobalContext.Provider value={{state, dispatch}}>
            {props.children}
        </GlobalContext.Provider>
    )
}
