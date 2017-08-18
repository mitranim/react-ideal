'use strict'

/**
 * Glossary
 *
 *   element          -- representation returned by `React.createElement()`
 *
 *   instance         -- mutable state defined and managed by renderer
 *                       end product of renderer activity, produced from elements
 *                       in the DOM renderer, "instances" are actual DOM nodes
 *
 *   component        -- instance of Component or PureComponent, user-defined
 *                       intermediary step on the way to instances
 *
 *   container        -- mutable host for component tree and scheduling, defined internally in React
 *
 *                       also called FiberRoot and OpaqueRoot
 *
 *                       in react-dom, the user-facing API pretends that
 *                       the root DOM node is the root container,
 *                       while secretly storing the actual container on that node
 *
 *   root             -- ancestral container
 *
 *   container info   -- container.containerInfo property, used by renderer to store custom state
 *
 *   fiber            -- holds elements, instance tree, component tree, schedules updates
 *
 *
 * Information Flow
 *
 *   elements -> fiber
 *            -> components
 *            -> instances -> container
 */

const {createElement} = require('react')
const {noop, slice, id, isFunction, isObject, isArray, isList, isString, validate} = require('fpx')
const {ReactFiberReconciler} = process.env.NODE_ENV === 'production'
  ? require('./build/react16/react-internals.production.min')
  : require('./build/react16/react-internals.development')

const CONTAINER_INFO_INSTANCE_MARKER = 'RootContainerInfoInstance'
const ELEM_INSTANCE_MARKER = 'ElemInstance'
const TEXT_INSTANCE_MARKER = 'TextInstance'

exports.createContainer = createContainer
function createContainer() {
  return internal.createContainer({$$typeof: CONTAINER_INFO_INSTANCE_MARKER, children: []})
}

exports.renderToContainer = renderToContainer
function renderToContainer(container, children, callback) {
  validate(isContainer, container)
  validate(isElementOrElements, children)
  if (callback != null) validate(isFunction, callback)
  const parentComponent = null
  internal.updateContainer(children, container, parentComponent, callback)
}

exports.unmountAtContainer = unmountAtContainer
function unmountAtContainer(container) {
  validate(isContainer, container)
  const children = null
  const parentComponent = null
  internal.updateContainer(children, container, parentComponent)
}

exports.containerToElements = containerToElements
function containerToElements({containerInfo: {children}}) {
  return children.map(instanceToElement)
}

const internal = exports.internal = ReactFiberReconciler({
  createInstance,
  createTextInstance,
  getRootHostContext: noop,
  getChildHostContext: noop,
  getPublicInstance: id,
  finalizeInitialChildren: noop,
  prepareUpdate,
  commitUpdate,
  commitMount: noop,
  commitTextUpdate,
  shouldSetTextContent: False,
  resetTextContent: noop,
  shouldDeprioritizeSubtree: False,
  appendChild,
  appendInitialChild: appendChild,
  appendChildToContainer: appendChild,
  insertBefore,
  insertInContainerBefore: insertBefore,
  removeChild,
  removeChildFromContainer: removeChild,
  scheduleDeferredCallback,
  prepareForCommit: noop,
  resetAfterCommit: noop,
})

function createInstance(type, props) {
  return {
    $$typeof: ELEM_INSTANCE_MARKER,
    type,
    props: propsWithoutChildren(props),
    children: [],
  }
}

function createTextInstance(text) {
  return {$$typeof: TEXT_INSTANCE_MARKER, text}
}

function prepareUpdate(elemInstance, type, oldProps, newProps) {
  return propsWithoutChildren(newProps)
}

function commitUpdate(elemInstance, preparedUpdatePayload) {
  elemInstance.props = preparedUpdatePayload
}

function commitTextUpdate(textInstance, oldText, newText) {
  textInstance.text = newText
}

function appendChild(parentInstance, childInstance) {
  const {children} = parentInstance
  const index = children.indexOf(childInstance)
  if (index !== -1) children.splice(index, 1)
  children.push(childInstance)
}

function insertBefore(parentInstance, childInstance, beforeChildInstance) {
  const {children} = parentInstance
  const index = children.indexOf(childInstance)
  if (index !== -1) children.splice(index, 1)
  const beforeIndex = children.indexOf(beforeChildInstance)
  if (beforeIndex === -1) throw Error('This child does not exist')
  children.splice(beforeIndex, 0, childInstance)
}

function removeChild(parentInstance, childInstance) {
  const {children} = parentInstance
  const index = children.indexOf(childInstance)
  if (index === -1) throw Error('This child does not exist')
  children.splice(index, 1)
}

function scheduleDeferredCallback(callback) {
  process.nextTick(callback, deadline)
}

const deadline = {timeRemaining() {return Infinity}}

function False() {
  return false
}

function isContainer(value) {
  return isObject(value) && 'containerInfo' in value
}

function isElementOrElements(value) {
  return isElement(value) || (isArray(value) && value.every(isElementOrElements))
}

function isElement(value) {
  return (
    value == null ||
    isString(value) ||
    (isObject(value) && value.$$typeof === Symbol.for('react.element'))
  )
}

function propsWithoutChildren(fullProps) {
  const props = {}
  for (const key in fullProps) {
    if (key !== 'children') props[key] = fullProps[key]
  }
  return props
}

function isElemInstance(value) {
  return isObject(value) && value.$$typeof === ELEM_INSTANCE_MARKER
}

function isTextInstance(value) {
  return isObject(value) && value.$$typeof === TEXT_INSTANCE_MARKER
}

function instanceToElement(value) {
  return isElemInstance(value)
    ? createElement(value.type, value.props, ...toArray(value.children).map(instanceToElement))
    : isTextInstance(value)
      ? value.text
      : null
}

function toArray(value) {
  return isArray(value) ? value : isList(value) ? slice(value) : value == null ? [] : [value]
}
