import axios from "axios"
import { API_ANALYTICS_URL, COMMIT_ANALYTICS_EVERY_N } from "./constants"
import { currentDateIso, genericRequest, getValue, shouldCommitAnalytics } from "./utils"


const GlobalReducer = (state, action) => {
    switch (action.type) {
        case 'SET_USER':
            return {...state, user: action.user, sessionChecked: true}

        case 'SET_SESSION_CHECKED':
            return {...state, sessionChecked: action.value}
    
        case 'SET_QUOTE':  // single QUOTE is used in many places e.g. quote views etc. Still worth keeping as standalone state
            return {...state, quote: action.quote}

        case 'SET_QUOTES':
            return {...state, quotes: action.quotes}

        case 'EXTEND_QUOTES':
            let quotesList = [...state.quotes, ...action.quotes]
            if (quotesList.length > 100) {  // keep max 100 quotes in memory at a time?
                quotesList = quotesList.slice(quotesList.length-100)
            }
            return {...state, quotes: quotesList}
        
        case 'SET_SEARCH':
            return {...state, search: action.search}
        
        case 'REMOVE_QUOTE_FROM_LIST':
            if (!state.user || !state.user.quotelists) return {...state}
            let user = state.user
            let idx = -1
            for (let i=0; i < user.quotelists.length; i++) {
                if (user.quotelists[i].id === action.quotelistId) {
                    idx = i
                    break
                }
            }
            if (idx===-1) return {...state}
            let quotes = user.quotelists[idx].quotes.filter( quote => quote.id !== action.quoteId )
            user.quotelists[idx].quotes = quotes
            return {...state, user}

        case 'REMOVE_QUOTELIST':
            if (!state.user || !state.user.quotelists) return {...state}
            let user2 = state.user
            user2.quotelists = user2.quotelists.filter( quotelist => quotelist.id !== action.quotelistId )
            return {...state, user: user2}

        case 'ADD_ANALYTIC':
            if (!action.action) return {...state}
            let analytics = state.analytics
            analytics.push({'datetime': currentDateIso(), 'action': action.action})

            if (action.forceCommit || shouldCommitAnalytics(analytics)) {
                axios.post(
                    API_ANALYTICS_URL,
                    {
                        user: getValue(state, ['user','id']) || null,
                        data: analytics,
                    },
                    {'Content-Type': 'application/json'},
                )
                .then( d => {
                    // console.log(d)
                })
                .catch( err => {
                    // console.log(err)
                })

                // just assume that request is successful? Struggling to make this work async...
                return {...state, analytics: []}
            }
            return {...state, analytics}

        case 'ADD_QUOTELIST':
            const quotelists = state.user.quotelists
            quotelists.push(action.quotelist)

            const state_copy = {...state}
            state_copy['user']['quotelists'] = quotelists
            return {...state_copy}

        default:
            return {...state}
    }
}

export default GlobalReducer
