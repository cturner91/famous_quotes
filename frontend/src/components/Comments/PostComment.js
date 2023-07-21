import React, {useContext, useState} from 'react'
import { API_COMMENTS_URL } from '../../data/constants'
import { GlobalContext } from '../../data/GlobalContext'
import { containsSwearWord, genericRequest } from '../../data/utils'

const PostComment = (props) => {

    const {dispatch} = useContext(GlobalContext)

    const [comment, setComment] = useState('')
    const [posting, setPosting] = useState(false)

    const quoteId = props.quoteId || -1  // -1 indicates it's a profile comment?

    const commentSubmitHandler = async () => {
        setPosting(true)
        const response = await genericRequest({
            url: API_COMMENTS_URL,
            method: 'POST',
            data: {quote: quoteId, comment}
        })
        // console.log(response)

        const analyticScreen = quoteId === -1 ? 'account screen' : `quote screen:quote ${quoteId}`

        if (response.status===201) {
            dispatch({type: 'ADD_ANALYTIC', action: `${analyticScreen}:add comment button:click:success`})
            alert('Comment created successfully')
            props.raiseComment(response.data.data)
            setComment('')
        } else {
            dispatch({type: 'ADD_ANALYTIC', action: `${analyticScreen}:add comment button:click:failed`})
            alert('Something went wrong:\n'+response.data.message)
        }
        setPosting(false)
    }

    const buttonIsDisabled = () =>{
        const result = {disabled: false, message: ''}
        if (!props.user) {
            result['disabled'] = true
            result['message'] = 'Please log in / register to add comments.'
        }
        if (comment.length===0) {
            result['disabled'] = true
            result['message'] = ''
        }
        if (containsSwearWord(comment)) {
            result['disabled'] = false
            result['message'] = "I think I've found a swear word in one of your inputs. People posting abuse will be banned in line with our Terms of Service. Please consider if this swearing is appropriate."
        }
        return result
    }
    const results = buttonIsDisabled()


    if (!props.quoteId) return null

    return (
        <div className='d-flex flex-column align-items-center w-100'>
            <textarea 
                className='form-control' 
                rows='3' 
                placeholder='Enter your comment'
                value={comment}
                onChange={(e)=>setComment(e.target.value)}
                style={{minWidth: 350, width: '80%', maxWidth: 600}}
            ></textarea>

            {!results['message'] ? null :
                <div style={{color: 'darkred', minWidth: 350, width: '80%', maxWidth: '95%'}}>{results['message']}</div>
            }
                
            {posting ? 
                <div className='spinner-border mt-3' style={{width: 50, height: 50, fontSize: 30}}></div>
            :
            <button 
                className='btn btn-primary my-3'
                onClick={commentSubmitHandler}
                disabled={results['disabled']}
            >
                Add comment
            </button>
            }
        </div>
    )
}

export default PostComment