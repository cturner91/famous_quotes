import React, {useState} from 'react'

import { passwordStrength } from '../data/utils'


const PasswordSetter = (props) => {

    const [strength, setStrength] = useState(0)
    const [match, setMatch] = useState(true)

    const [showStrengthTests, setShowStrengthTests] = useState(true)
    const [strengthTests, setStrengthTests] = useState([])

    const inputGroupStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        width: '90%',
        maxWidth: 400,
    }
    const labelStyles = {
        fontWeight: 'bold',
        marginTop: 20,
    }
    const inputStyle = {
        maxWidth: 400,
    }

    const strengthBoxStyle = {
        width: '100%',
        height: 7,
        borderRadius: 3,
        border: '1px solid rgba(0,0,0,0.1)',
    }
    const strengthStyle = {
        width: `${strength*100}%`,
        height: 5,
        backgroundColor: strength < 0.5 ? 'darkred' : strength < 0.75 ? 'gold' : 'darkgreen',
        transition: 'width 200ms ease-in-out',
    }
    const matchStyles = {
        // display: match ? 'none' : 'block',
        opacity: match ? 0 : 1,
        height: 20,
        fontSize: 12,
        color: 'darkred',
        border: '1px solid darkred',
        borderRadius: 3,
        width: '100%',
        textAlign: 'center',
        transition: 'opacity 400ms ease-in-out',
    }

    return (
        <>
            <div style={inputGroupStyles}>
            <label style={labelStyles}>{props.inputLabel1 || 'Set password:'}</label>
            <input 
                type='password'
                className='form-control' 
                style={inputStyle}
                value={props.password1}
                onChange={(e)=>{
                    props.setPassword1(e.target.value)
                    const strengthResults = passwordStrength(e.target.value)
                    setStrength(strengthResults['strength'])
                    setStrengthTests(strengthResults['tests'])
                }}
            />
            
            <div 
                className='d-flex flex-column align-items-start w-100' 
                onClick={()=>setShowStrengthTests(!showStrengthTests)}
                style={{transition: 'all 200ms ease-in-out'}}
            >
                <span style={{fontSize: 10}}>Password strength:</span>
                <div style={strengthBoxStyle}>
                    <div style={strengthStyle}></div>
                </div>

                {showStrengthTests && props.password1.length > 0 ? 
                strengthTests.filter(test=>!test.result).map( (test,i) => {
                        return (
                            <div key={i}>
                                {i===0 ? <div style={{fontSize: 12, marginTop: 5}}><b>Password recommendations</b> (optional):</div> : null}
                                <div style={{fontSize: 12}}>
                                    {test.name}
                                </div>
                            </div>
                        )
                    })
                : null}

            </div>

        </div>

        <div style={inputGroupStyles}>
            <label style={labelStyles}>{props.inputLabel2 || 'Confirm password:'}</label>
            <input 
                className='form-control' 
                type='password'
                style={inputStyle}
                value={props.password2}
                onChange={(e)=>{
                    props.setPassword2(e.target.value)
                    if (e.target.value.length > 0 && props.password1 !== e.target.value) {setMatch(false)}
                    else {setMatch(true)}
                }} 
            />
            <span style={matchStyles}>Passwords do not match!</span>
        </div>
    </>
    )
}

export default PasswordSetter