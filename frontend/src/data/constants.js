import mountainView from '../images/compressed/mountain-view.jpg'
import mountainRoad from '../images/compressed/mountain-road.jpg'
import mountainLake from '../images/compressed/mountain-lake.jpg'
import mountainTraveller from '../images/compressed/mountain-traveller.jpg'
import business from '../images/compressed/business.jpg'
import citySkyline from '../images/compressed/city-skyline.jpg'
import gym from '../images/compressed/gym.jpg'
import library from '../images/compressed/library.jpg'
import dirtyHands from '../images/compressed/dirty-hands.jpg'
import mountainMisty from '../images/compressed/mountain-misty.jpg'
import mountainTop from '../images/compressed/mountain-top.jpg'
import nightSky from '../images/compressed/night-sky.jpg'
import pen from '../images/compressed/pen.jpg'
import running from '../images/compressed/running.jpg'
import success from '../images/compressed/success.jpg'
import sunrise from '../images/compressed/sunrise.jpg'
import waterSunrise from '../images/compressed/water-sunrise.jpg'
import fire from '../images/compressed/fire.jpg'
import womensTeam from '../images/compressed/womens-sports-team.jpg'
import maleTeam from '../images/compressed/male-football-team.jpg'
import yoga from '../images/compressed/yoga.jpg'
import tree from '../images/compressed/tree.jpg'

export const EMAIL = 'famous-quotes.uk@gmail.com'

export const DEBUG = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development')

export const PROD_BASE_URL = 'https://famous-quotes.uk' // relative quotes are '/xxx', so this cannot end with a '/'

export const APP_URL = DEBUG ? '/' : '/'  // must be '/' in prod - otherwise header links go funny e.g. /famous-quotes.uk/https://www.famous-quotes.uk/
export const APP_LOGIN_URL       = `${APP_URL}login/`
export const APP_LOGOUT_URL      = `${APP_URL}logout/`
export const APP_ACCOUNT_URL     = `${APP_URL}account/`
export const APP_QUOTE_URL       = `${APP_URL}quote/`
export const APP_QUOTE_VIEW_URL  = `${APP_URL}quote-view/`
export const APP_QUOTES_URL      = `${APP_URL}quotes/`
export const APP_QOTD_URL        = `${APP_URL}quote-of-the-day/`
export const APP_ADD_QUOTE_URL   = `${APP_URL}add-quote/`
export const APP_CONTACT_URL     = `${APP_URL}contact/`
export const APP_PRIVACY_URL     = `${APP_URL}privacy-policy/`
export const APP_DEVELOPER_URL   = `${APP_URL}developer-info/`
export const APP_REGISTER_URL    = `${APP_URL}register/`
export const APP_FEATURES_URL    = `${APP_URL}new-features/`
export const APP_PASSWORD_RESET  = `${APP_URL}password-reset/`
export const APP_PASSWORD_FORGOT = `${APP_URL}forgot-password/`
export const APP_QUOTELIST_URL   = `${APP_URL}quotelist/`
export const APP_ABOUT_URL       = `${APP_URL}about-us/`
export const APP_TERMS_URL       = `${APP_URL}terms-of-service/`


export const API_URL = DEBUG ? 'http://localhost:8000/api' : '/api'
export const API_LOGIN_URL           = `${API_URL}/login/`
export const API_LOGOUT_URL          = `${API_URL}/logout/`
export const API_SESSION_URL         = `${API_URL}/validate/`
export const API_USER_URL            = `${API_URL}/users/`
export const API_QUOTE_URL           = `${API_URL}/quotes/`
export const API_QUOTE_LIST_URL      = `${API_URL}/quote-list/`
export const API_VOTES_URL           = `${API_URL}/votes/`
export const API_REPORT_URL          = `${API_URL}/quotes/report/`
export const API_CATEGORIES_URL      = `${API_URL}/categories/`
export const API_QOTD_URL            = `${API_URL}/quotes/qotd/`
export const API_FORGOT_PASSWORD_URL = `${API_URL}/forgot-password/`
export const API_PASSWORD_RESET_URL  = `${API_URL}/reset-password/`
export const API_COMMENTS_URL        = `${API_URL}/comments/`
export const API_HOME_URL            = `${API_URL}/home/`
export const API_ANALYTICS_URL       = `${API_URL}/analytics/`


export const defaultMaxN = 2400  // max number of quotes (know the limit for random quote number generation)
export const DEFAULT_N_QUOTES = 20

export const COMMIT_ANALYTICS_EVERY_N_EVENTS = 10
export const COMMIT_ANALYTICS_EVERY_N_SECONDS = 30


export const COLORS = {
    main: (alpha) => `rgba(117, 187, 253, ${alpha})`,
    linkColor: '#007bff',
    voteHistoryUpvotes: 'rgb(117, 187, 253)',
    voteHistoryDownvotes: 'rgba(160, 160, 160)',
}

// note: displayName SHOULD be able to be pre-pended onto the word 'quotes' e.g. 'Most Upvoted' Quotes
export const sortByOptions = [  
    {param: '-popularity', displayName: 'Most Popular'}, // put this first so it appears as default
    {param: 'popularity', displayName: 'Least Popular'},
    {param: 'oldest', displayName: 'Oldest'},
    {param: 'newest', displayName: 'Newest'},
    {param: '-total_upvotes', displayName: 'Most Upvoted'},
    {param: '-total_downvotes', displayName: 'Most Downvoted'},
    {param: 'random', displayName: 'Random'},
]


export const homeScreenSplashImages = [
    {
        img: mountainView, 
        // imgFullRes: mountainViewOg,
        alt: 'The view from the top of a mountain range', 
        quote: 'The world is a book and those who do not travel read only one page.', 
        author: 'St. Augustine', 
        textStyles: function() {
            let styles = {  // applicable in all scenarios
                justifyContent: 'start',
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.2)',
            }
            if (window.innerWidth < 500) {
                styles = {...styles, ...{
                    fontSize: 16,
                    paddingBottom: 5,
                }}
            } else if (window.innerWidth < 700) {
                styles = {...styles, ...{
                    paddingTop: 30,
                    fontSize: 22,
                    paddingBottom: 5,
                }}
            } else {
                styles = {...styles, ...{
                    paddingTop: 30,
                    fontSize: 26,
                }}
            }
            return styles
        }
    }, {
        img: mountainRoad, 
        // imgFullRes: mountainRoadOg,
        alt: 'A long road leading into the mountains', 
        quote: 'A journey of a thousand miles begins with a single step.', 
        author: 'Chinese proverb',
        textStyles: function() {
            let styles = {paddingTop: 40,}
            if (window.innerWidth < 500) {
                styles = {...styles, ...{paddingTop:20, fontSize: 20,}}
            } else if (window.innerWidth < 700) {
                styles = {...styles, ...{fontSize: 24,}}
            } else {
                styles = {...styles, ...{fontSize: 30,}}
            }
            return styles
        }
    }, {
        img: mountainLake, 
        // imgFullRes: mountainLakeOg,
        alt: 'A lake in front of a beautiful mountain', 
        quote: 'Do not follow where the path may lead. Go instead where there is no path and leave a trail.', 
        author: 'Ralph Waldo Emerson',
        textStyles: function() {
            let styles = {
                paddingBottom: 10, 
                backgroundColor: 'rgba(255,255,255,0.4)',
                justifyContent: 'end', 
                fontWeight: 'bold', 
            }
            if (window.innerWidth < 500) {
                styles = {...styles, ...{
                    fontSize: 14, 
                }}
            } else if (window.innerWidth < 700) {
                styles = {...styles, ...{
                    fontSize: 20, 
                }}
            } else {
                styles = {...styles, ...{
                    fontSize: 24, 
                }}
            }
            return styles
        }
    }, {
        img: mountainTraveller, 
        // imgFullRes: mountainTravellerOg,
        alt: 'A lone traveller in a mountain scene', 
        quote: 'Not all those who wander are lost.', 
        author: 'J.R.R. Tolkein',
        textStyles: function() {
            let styles = {}
            if (window.innerWidth < 500) {
                styles = {...styles, ...{
                    fontSize: 20,
                }}
            } else if (window.innerWidth < 700) {
                styles = {...styles, ...{
                    fontSize: 28,
                }}
            } else {
                styles = {...styles, ...{
                    fontSize: 30, fontWeight: 'bold',
                }}
            }
            return styles
        }
    }, {
        img: fire, 
        // imgFullRes: fire,
        alt: 'A burning flame on a black background', 
        quote: 'Education is the kindling of a flame, not the filling of a vessel', 
        author: 'Socrates',
        textStyles: function() {
            let styles = {color: 'white'}
            if (window.innerWidth < 500) {
                styles = {...styles, ...{
                    fontSize: 20,
                }}
            } else if (window.innerWidth < 700) {
                styles = {...styles, ...{
                    fontSize: 28,
                }}
            } else {
                styles = {...styles, ...{
                    fontSize: 30,
                }}
            }
            return styles
        }
    }, {
        img: gym, 
        // imgFullRes: gym,
        alt: 'Photo of a gym with physical training equipment', 
        quote: 'I hated every minute of training, but I said "Don\'t quit. Suffer now, and live the rest of your life as a champion."', 
        author: 'Muhammed Ali',
        textStyles: function() {
            let styles = {color: 'white', justifyContent: 'end', backgroundColor: 'rgba(0,0,0,0.5)'}
            if (window.innerWidth < 500) {
                styles = {...styles, ...{
                    fontSize: 16,
                }}
            } else if (window.innerWidth < 700) {
                styles = {...styles, ...{
                    fontSize: 20,
                }}
            } else {
                styles = {...styles, ...{
                    fontSize: 24,
                }}
            }
            return styles
        }
    } , {
        img: tree, 
        // imgFullRes: tree,
        alt: '', 
        quote: 'The best time to plant a tree was 20 years ago. The second best time is now.', 
        author: 'Chinese proverb',
        textStyles: function() {
            let styles = {
                color: 'black', 
                justifyContent: 'end', 
                backgroundColor: 'rgba(255,255,255,0.3)',
                fontWeight: 'bold',
            }

            if (window.innerWidth < 500) {
                styles = {...styles, ...{
                    fontSize: 16, paddingBottom: 0
                }}
            } else if (window.innerWidth < 700) {
                styles = {...styles, ...{
                    fontSize: 18, paddingBottom: 10,
                }}
            } else {
                styles = {...styles, ...{
                    fontSize: 24, paddingBottom: 10,
                }}
            }
            return styles
        }
    } , {
        img: womensTeam, 
        // imgFullRes: womensTeam,
        alt: 'Women\'s lacrosse team celebrating', 
        quote: 'Sports do not build character. They reveal it.', 
        author: 'Heywood Broun',
        textStyles: function() {
            let styles = {justifyContent: 'end', color: 'white', backgroundColor: 'rgba(0,0,0,0.4)'}
            if (window.innerWidth < 500) {
                styles = {...styles, ...{
                    fontSize: 16,
                }}
            } else if (window.innerWidth < 700) {
                styles = {...styles, ...{
                    fontSize: 24,
                }}
            } else {
                styles = {...styles, ...{
                    fontSize: 30,
                }}
            }
            return styles
        }
    },
]

// Note: the id value is used for sharing URLs - it MUST remain consistent!!
export const quoteViewImages = [
    {id:  0, img: business, name: 'Skyscrapers',  },
    {id:  1, img: citySkyline, name: 'City skyline',  },
    // {id:  2, img: desertAtDusk, name: 'Desert at dusk',  },
    // {id:  3, img: desertNightSky, name: 'Desert night sky',  },
    {id:  4, img: gym, name: 'Gym',  },
    {id:  5, img: library, name: 'Library', },
    {id:  6, img: dirtyHands, name: 'Dirty hands', },
    {id:  7, img: mountainLake, name: 'Lake with mountain', },
    {id:  8, img: mountainMisty, name: 'Misty mountain', },
    {id:  9, img: mountainRoad, name: 'Long road', },
    // {id: 10, img: mountainSun, name: 'Sand dunes', },
    {id: 11, img: mountainTop, name: 'Hikers on a mountain', },
    {id: 12, img: mountainTraveller, name: 'Traveller in mountain range', },
    {id: 13, img: mountainView, name: 'Glacier in summer', },
    {id: 14, img: nightSky, name: 'Starry sky', },
    {id: 15, img: pen, name: 'Writing pen', },
    {id: 16, img: running, name: 'Woman hiking', },
    {id: 17, img: success, name: 'Man atop a mountain', },
    {id: 18, img: sunrise, name: 'Sunrise', },
    // {id: 19, img: sunset, name: 'Sunset', },
    {id: 20, img: waterSunrise, name: 'Sunset over water', },

    {id: 21, img: fire, name: 'Fire', },
    {id: 22, img: womensTeam, name: 'Lacrosse team', },
    {id: 23, img: yoga, name: 'Yoga', },
    {id: 24, img: maleTeam, name: 'American football team', },
    {id: 25, img: tree, name: 'Single tree', },
]


export const quoteViewFonts = [
    { name: 'Caveat', css: '"Caveat", cursive', },
    { name: 'Handlee', css: '"Handlee", cursive', },
    { name: 'Architect\'s Daughter', css: '"Architects Daughter", cursive', },
    { name: 'Indie Flower', css: '"Indie Flower", cursive', },
    { name: 'Times New Roman', css: '"Times New Roman", sans-serif', },
    { name: 'Arial', css: '"Arial", sans-serif', },
]
