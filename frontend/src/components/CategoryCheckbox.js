import React, {useState} from 'react'

const CategoryCheckbox = ({category, toggleCategory, useNames, className, checkedDefault}) => {

    const [checked, setChecked] = useState(checkedDefault ? true : false)

    const labelStyle = {
        width: 120,
        textAlign: 'left',
        marginLeft: 10,
    }

    const clickHandler = () => {
        setChecked(!checked)
        if (useNames) {
            toggleCategory(category.category)
        } else {
            toggleCategory(category.id)
        }
        
    }

    return (
        <div 
            className={className ? className : 'col-6 col-sm-4 col-md-3 text-center'}
            onClick={clickHandler}
        >
            <input type='checkbox' checked={checked} readOnly />
            <label style={labelStyle}>{category.category}</label>
        </div>
    )
}

export default CategoryCheckbox