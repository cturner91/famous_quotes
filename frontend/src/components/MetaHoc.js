const MetaHoc = (props) => {
    // props.metas must be an array of objects with four keys: idKey, idValue, updateKey, and updateValue
    // idKey and idValue indicate how to identify the appropriate meta tag (e.g. idkey='name' and idvalue='description')
    // updateKey and updateValue then specifies which attribute gets updated and to what value
    // this approach works for any HTML element

    // Note: this component can only UPDATE EXISTING metadata tags
    // Maybe I'll upgrade it later to be able to add new metadata tags...


    if (props.title) { document.title = props.title }

    if (!props.elementType) return null
    if (!props.metas) return null
    if (props.metas.length===0) return null


    const documentMetas = document.getElementsByTagName(props.elementType)
    // documentMetas does not support array functions

    for (let i=0; i<documentMetas.length; i++) {
        const docMeta = documentMetas[i]

        props.metas.map( (propMeta) => {
            const idKey = propMeta.idKey
            const idValue = propMeta.idValue
            const updateKey = propMeta.updateKey
            const updateValue = propMeta.updateValue
            let idKeyIdx = -1, updateKeyIdx = -1

            // find the idKey
            for (let k=0; k<docMeta.attributes.length; k++) {
                const attr = docMeta.attributes[k]
                if (attr.name===idKey && attr.value===idValue) {
                    idKeyIdx = k
                    break
                }
            }

            // if idKey was found, try to find the updateKey
            if (idKeyIdx >= 0) {
                for (let k=0; k<docMeta.attributes.length; k++) {
                    const attr = docMeta.attributes[k]
                    if (attr.name===updateKey) {
                        updateKeyIdx = k
                        break
                    }
                }    
            }

            // if both were found, make the update
            if (idKeyIdx >= 0 && updateKeyIdx >= 0) {
                docMeta.attributes[updateKeyIdx].value = updateValue
            }
        })
    }

    return null
}

export default MetaHoc