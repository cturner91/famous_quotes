import axios from 'axios'
import { API_SESSION_URL, API_URL, API_USER_URL, COMMIT_ANALYTICS_EVERY_N_EVENTS, COMMIT_ANALYTICS_EVERY_N_SECONDS } from './constants'

axios.defaults.withCredentials = true  // necessary to persist sessions
// axios.defaults.baseURL = API_URL


// a lot of the time, we will want to perform the same actions if things go wrong on the request
// and we will want to reuse headers etc
// capture this in a generic request function
export const genericRequest = async ({url, method, data={}, headers={}}) => {
    var axiosResponse = null
    await axios({
        url, method, data,
        headers: {'Content-Type': 'application/json', ...headers}
    })
    .then( response => axiosResponse = response)
    .catch( error   => axiosResponse = error.response)
    return axiosResponse
}


export function getValue(data, path) {
    if (!data) return undefined
    if (typeof data !== 'object') return undefined

    var i, len = path.length
    for (i = 0; i < len; ++i) {
        if (typeof data === 'object' && data !== null && Object.keys(data).indexOf(path[i]) >= 0) { // note: null counts as type object... gofigure
            data = data[path[i]]
        } else {
            return undefined
        }
    }
    return data
}

// I need to write tests for this function...
let test_data = {user: {id: 1, first_name: 'Conor'}}
console.assert( typeof getValue(test_data, ['user']) === 'object', 'getValue test 1 failed')
console.assert( getValue(test_data, ['user','id']) === 1, 'getValue test 2 failed')
console.assert( getValue(test_data, ['user','first_name']) === 'Conor', 'getValue test 3 failed')
console.assert( getValue(test_data, ['user','last_name']) === undefined, 'getValue test 4 failed')

console.assert( getValue('test_data', ['user','id']) === undefined, 'getValue test 5 failed')
console.assert( getValue(test_data, ['user','first_name', 'string']) === undefined, 'getValue test 6 failed')


export const getCurrentWindowLocation = () => { return window.location.href }
export const getCurrentWindowSearch = () => { return window.location.search }


export const passwordStrength = (password) => {

    const checkCharPresentinString = (string, allowableChars) => {
        for (let i=0; i<allowableChars.length; i++) {
            if ( string.indexOf(allowableChars[i]) >= 0) return true
        }
        return false
    }

    const results = {tests: [
        {name: 'Minimum recommended length 8 characters', result: false},
        {name: 'Recommended length 12+ characters', result: false},
        {name: 'One lower case character', result: false},
        {name: 'One upper case character', result: false},
        {name: 'One number', result: false},
        {name: 'One symbol', result: false},
    ]}
    if (password.length >= 8) results.tests[0]['result'] = true
    if (password.length >= 12) results.tests[1]['result'] = true
    if (checkCharPresentinString(password, 'abcdefghijklmnopqrstuvwxyz')) results.tests[2]['result'] = true
    if (checkCharPresentinString(password, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')) results.tests[3]['result'] = true
    if (checkCharPresentinString(password, '0123456789')) results.tests[4]['result'] = true
    if (checkCharPresentinString(password, '!@£$%^&*()€#-=_+[]{};\'\\:"|<>?,./~`§±')) results.tests[5]['result'] = true

    // calculate strength score
    results['strength'] = results.tests.filter(test=>test.result).length / results.tests.length
    return results
}
console.assert( passwordStrength('pass')['strength'] === 1/6, 'passwordStrength 1 test failed')
console.assert( passwordStrength('password')['strength'] === 1/3, 'passwordStrength 2 test failed')
console.assert( passwordStrength('password1')['strength'] === 1/2, 'passwordStrength 3 test failed')
console.assert( passwordStrength('password1!')['strength'] === 2/3, 'passwordStrength 4 test failed')
console.assert( passwordStrength('Password1!')['strength'] === 5/6, 'passwordStrength 5 test failed')
console.assert( passwordStrength('Password1!!!')['strength'] === 1, 'passwordStrength 6 test failed')


export const deduplicate = (arr, keyString='') => {
    if (arr.length===0) return arr
    const arrSet = new Set()
    const keep = arr.map( ()=>true )
    arr.forEach( (v,i) => {
        const value = keyString ? getValue(v, keyString) : v
        if (arrSet.has(value)) {
            keep[i] = false
        } else {
            arrSet.add(value)
        }
    })
    return arr.filter( (v,i) => keep[i])
}
let result
result = deduplicate([1,2,2,3,3,3])
console.assert( result.length===3, 'deduplicate 1a test failed')
console.assert( result[0]===1, 'deduplicate 1a test failed')
console.assert( result[1]===2, 'deduplicate 1b test failed')
console.assert( result[2]===3, 'deduplicate 1c test failed')

result = deduplicate([{key: 'one'},{key: 'one'}], ['key'])
console.assert( Object.keys(result).length===1, 'deduplicate 2a test failed')
console.assert( result[0]['key']==='one', 'deduplicate 2b test failed')

result = deduplicate([{key: 'one'},{key: 'two'}], ['key'])
console.assert( Object.keys(result).length===2, 'deduplicate 3a test failed')
console.assert( result[0]['key']==='one', 'deduplicate 3b test failed')
console.assert( result[1]['key']==='two', 'deduplicate 3c test failed')


export const checkLoggedIn = () => {
    axios({
        url: API_SESSION_URL,
        method: 'POST',
    })
    .catch ( error => { return null })
    .then( response => {
        // console.log(response)
        if (response['data']['valid']) {
            const userId = response['data']['user']
            axios({
                url: `${API_USER_URL}?id=${userId}&s=1`,
                method: 'GET',
            })
            .catch( error => { return null })
            .then( response => {
                // console.log(response)
                const userData = response['data']['user']
                return userData
            })    
        }
        return null
    })
}

export const checkLoggedInAsync = async () => {
    const response1 = await genericRequest({
        url: API_SESSION_URL,
        method: 'POST',
    })
    // console.log(response1)
    if (response1.status === 200) {
        if (!response1['data']['valid']) return null

        const userId = response1['data']['user']
        const response2 = await genericRequest({
            url: `${API_USER_URL}?id=${userId}&s=1`,
            method: 'GET',
        })
        // console.log(response2)
        if (response2.status===200) {
            const userData = response2['data']['user']
            return userData
        } else {
            return null
        }
    } else {
        return null
    }
}

export const containsSwearWord = (string) => {
    const stringLower = string.toLowerCase()
    const puncs = '!.,?;:\'"'.split('')
    for (let word of [
            'shit','fuck','dick','cock','cunt','wank','wanker','bullshit',
            'asshole','tits','fanny','twat','gangbang','rape','nigger','motherfucker',
    ]) {
        if (stringLower.indexOf(word) >= 0) return true
        // if (stringLower.indexOf(word+'s') >= 0) return true
        // if (stringLower.indexOf(' '+word) >= 0) return true
        // if (stringLower.indexOf(word+' ') >= 0) return true
        for (let punc of puncs) {
            if (stringLower.indexOf(word+punc) >= 0) return true
        }
    }
    return false
}
console.assert(containsSwearWord('Fuck this shit'), 'swearing test 1 failed')
console.assert(containsSwearWord('Cock and balls'), 'swearing test 2 failed')
console.assert(containsSwearWord('Cock!'), 'swearing test 3 failed')
console.assert(!containsSwearWord('the ass carried his bag'), 'swearing test 4 failed')
console.assert(containsSwearWord('Hes a total wanker'), 'swearing test 5 failed')
console.assert(containsSwearWord('CAPITAL WANKSTAIN'), 'swearing test 6 failed')
// console.assert(!containsSwearWord('Stopcocks are a plumbing term'), 'swearing test 7 failed')
console.assert(containsSwearWord('dick'), 'swearing test 8 failed')
console.assert(containsSwearWord('dicks'), 'swearing test 9 failed')


export const currentDateIso = (numericDt) => {
    const now = (new Date()).toISOString().replace('T',' ').replace('Z','')
    const idx = now.indexOf('.')
    return now.slice(0, idx)
}


export const friendlyDate = (dt, options) => {
    // dt is an ISO8601 string, options is a object of different options

    // parse into date-parts
    const year   = dt.substr(0,4)
    const month  = dt.substr(5,2)
    const day    = dt.substr(8,2)
    const hour   = dt.substr(11,2)
    const minute = dt.substr(14,2)
    const second = dt.substr(17,2)
    const micros = dt.substr(20,6)

    const months = {
        '01': {short: 'Jan', long: 'January'},
        '02': {short: 'Feb', long: 'February'},
        '03': {short: 'Mar', long: 'March'},
        '04': {short: 'Apr', long: 'April'},
        '05': {short: 'May', long: 'May'},
        '06': {short: 'Jun', long: 'June'},
        '07': {short: 'Jul', long: 'July'},
        '08': {short: 'Aug', long: 'August'},
        '09': {short: 'Sep', long: 'September'},
        '10': {short: 'Oct', long: 'October'},
        '11': {short: 'Nov', long: 'November'},
        '12': {short: 'Dec', long: 'December'},
    }

    if (options.format==='%Y-%m-%d') {
        return `${year}-${month}-${day}`
    } else if (options.format==='%Y-%m-%d %H:%M:%S') {
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    }

    // default is ISO8601?
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}
console.assert(friendlyDate('2023-02-07T21:20:17.873506Z', {format: '%Y-%m-%d'})==='2023-02-07', 'friendlyDate test 1 failed')
console.assert(friendlyDate('2023-02-07T21:20:17.873506Z', {format: 'LOL'})==='2023-02-07 21:20:17', 'friendlyDate test 2 failed')
console.assert(friendlyDate('2023-02-07T21:20:17.873506Z', {format: '%Y-%m-%d %H:%M:%S'})==='2023-02-07 21:20:17', 'friendlyDate test 3 failed')


export const shouldCommitAnalytics = (analytics) => {
    if (analytics.length >= COMMIT_ANALYTICS_EVERY_N_EVENTS) {
        return true
    }

    // if the first event recorded was over X seconds ago, then commit this whole batch
    const firstDatetime = analytics[0]['datetime']
    if (Number(new Date()) - Number(new Date(firstDatetime)) >= COMMIT_ANALYTICS_EVERY_N_SECONDS*1000) {
        return true
    }
    return false
}
