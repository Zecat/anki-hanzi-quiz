import { bracketEval } from './utils.js'
import { attach_event_obs } from './event_binding.js'

function snakeToCamel(str) {
  return str.replace(/([-_]\w)/g, (match) => match.toUpperCase().replace('-', '').replace('_', ''));
}

const attach_attr_obs = (attrName, query, node, scope, prefixes) => {
  let propOnly = false
  if (attrName[0]==".") {
    attrName = snakeToCamel(attrName.substring(1))
    propOnly = true
  }
  const onAttrBindingChange = (newVal, transform, useValue, forwardVal) => {
    if (transform)
      newVal = transform(newVal)

    if (propOnly) {
    //console.log(attrName, node, newVal)
      Reflect.set(node, attrName, newVal)
      return
    }
    if (useValue) {
      (newVal === false || newVal == undefined )? node.removeAttribute(attrName) : node.setAttribute(attrName, newVal===true ? '': newVal)
    } else {
      newVal ? node.setAttribute(attrName, forwardVal) : node.removeAttribute(attrName)
    }
  }
  bracketEval(query, scope, prefixes, onAttrBindingChange)
}

export const attach_attributes_obs = (node, scope, prefixes) => [...node.attributes].forEach(attr => {
  if (attr.name == "class") return

  //if (attr.name === '@@context') {
  //  const contexts = attr.value.split(',')
  //  contexts.map(context => {
  //    const [key, pathStr] = context.trim().split(':')
  //    const path = pathStr.trim().split('.')
  //    prefixes[key] = path
  //  })

  //  console.log("==========================", attr.value, prefixes)
  //  return
  //}
  if (attr.name[0] === '@') {
    attach_event_obs(attr.name.substring(1), attr.value, node, scope, prefixes)
    node.removeAttribute(attr.name)
    return
  }

  attach_attr_obs(attr.name, attr.value, node, scope, prefixes)
})
