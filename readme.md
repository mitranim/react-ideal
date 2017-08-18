## Overview

`react-ideal` allows you to run React apps on the server without a DOM polyfill.
It allows the view tree to update _over time_, so you can wait until it's ready
before rendering static markup.

The view tree exists as an abstract, _ideal_ version of itself, updating over
time as you'd expect in a client-side app. This allows you to implement true
isomorphic rendering while maintaining the client-side model of data fetching,
where each view loads its data independently.

In technical terms, this is an alternate _renderer_ for React that provides
crucial functionality omitted by `react-dom/server`.

**Requires React version 16+.**

## TOC

  * [Overview](#overview)
  * [TOC](#toc)
  * [Renderer Comparison](#renderer-comparison)
  * [Usage](#usage)
  * [Gotchas](#gotchas)

## Renderer Comparison

`react-dom`         → browser, live/async

`react-native`      → mobile, live/async

`react-dom/server`  → Node, sync

`react-ideal`       → Node, live/async       → elements → `react-dom/server` → markup

Key differences with `react-dom/server`:

  * Creates a live component tree that updates over time
  * Properly handles unmounting
  * Doesn't render to string; you still need `react-dom/server` for that

## Usage

Install from NPM:

```sh
npm install --exact react-ideal
```

Make sure you have React 16+:

```sh
npm install --exact react@16 react-dom@16
```

Use on server:

```js
const {createElement} = require('react')
const {createContainer, renderToContainer, unmountAtContainer, containerToElements} = require('react-ideal')
const {renderToStaticMarkup} = require('react-dom/server')

function myRequestHandler(req, res, next) {
  const container = createContainer()
  const rootElem = createElement(MyReactComponent)
  renderToContainer(container, rootElem)

  somehowWaitUntilViewsAreReady(container, () => {
    const [element] = containerToElements(container)
    const markup = `<!doctype html>${renderToStaticMarkup(element)}`
    req.end(markup)
    unmountAtContainer(container)
  })
}
```

## Gotchas

### Async

Unlike `react-dom/server`, the initial rendering is asynchronous. If you're
whipping up a small demo where rendering is done in one pass, make sure to wait
for that pass to finish:

```js
const container = createContainer()
const rootElem = createElement(MyReactComponent)
renderToContainer(container, rootElem, () => {
  const [element] = containerToElements(container)
  const markup = `<!doctype html>${renderToStaticMarkup(element)}`
  unmountAtContainer(container)
})
```

### Readiness

To take advantage of `react-ideal`, you need the view components to signal their
readiness status. For now, this is out of scope for `react-ideal`, but is
trivial to implement. Here's a recipe:

```js
const {createElement: E} = require('react')
const {createContainer, renderToContainer, unmountAtContainer, containerToElements} = require('react-ideal')
const {renderToStaticMarkup} = require('react-dom/server')
const PropTypes = require('prop-types')
const {Future} = require('posterus')

async function renderAsync() {
  const container = createContainer()
  const readiness = new Readiness()
  const rootElem = E(ReadinessContext, {readiness}, E(AsyncView))
  renderToContainer(container, rootElem)

  try {
    await readiness.future
    const [element] = containerToElements(container)
    const markup = `<!doctype html>${renderToStaticMarkup(element)}`
    return markup
  }
  finally {
    unmountAtContainer(container)
  }
}

class AsyncView extends PureComponent {
  constructor() {
    super(...arguments)
    this.state = {greeting: ''}
  }

  componentWillMount() {
    this.context.readiness.unready(this)

    setTimeout(() => {
      this.setState({greeting: 'Hello world!'})
      this.context.readiness.ready(this)
    }, 50)
  }

  render() {
    const {state: {greeting}} = this
    if (!greeting) return null
    return E('span', {className: 'row-center-center'}, greeting)
  }
}

AsyncView.contextTypes = {readiness: PropTypes.object}

class ReadinessContext extends PureComponent {
  getChildContext() {
    return {readiness: this.props.readiness}
  }
  render() {
    return this.props.children
  }
}

ReadinessContext.propTypes = {readiness: PropTypes.object}
ReadinessContext.childContextTypes = {readiness: PropTypes.object}

class Readiness {
  constructor() {
    this.future = new Future()
    this.notReady = new Set()
  }

  isFullyReady() {
    return !this.notReady.size
  }

  ready(component) {
    this.notReady.delete(component)
    if (this.isFullyReady()) this.future.arrive()
  }

  unready(component) {
    this.notReady.add(component)
  }
}
```
