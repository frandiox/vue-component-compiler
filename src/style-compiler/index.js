const postcss = require('postcss')
const defaults = require('lodash.defaultsdeep')

const trim = require('./plugins/trim')
const scopeId = require('./plugins/scope-id')

function compileStyle (style, filename, config) {
  const plugins = [trim].concat(config.plugins)
  const options = Object.assign({
    to: filename,
    from: filename
  }, config.options)

  // source map
  if (config.needMap && !style.map) {
    if (!style.map) {
      throw Error('Previous source map is missing.')
    }

    options.map = {
      inline: false,
      annotation: false,
      prev: style.map
    }
  }

  if (!style.descriptor) {
    throw Error('SFC block descriptor is missing.')
  }

  // add plugin for scoped css rewrite
  if (style.descriptor.scoped) {
    if (typeof (config.scopeId) !== 'string') {
      throw Error(`'scopeId' is required to compile scoped style.`)
    }
    plugins.push(scopeId({ id: config.scopeId }))
  }

  return postcss(plugins).process(style.code, options).then(result => {
    const output = { code: result.css }

    if (config.needMap) { output.map = result.map }
    result.warnings().forEach(warning => config.onWarn(warning))

    return output
  })
}

module.exports = function compileStyles (styles, filename, config) {
  config = defaults(config, {
    needMap: true,
    plugins: [],
    options: {},
    onWarn: message => console.warn(message)
  })

  return Promise.all(styles.map(style => compileStyle(style, filename, config)))
}