const postcss = require('postcss')
const cssModules = require('postcss-modules')
const defaults = require('lodash.defaultsdeep')

const trim = require('./plugins/trim')
const scopeId = require('./plugins/scope-id')

module.exports = function compileStyle (style, filename, config) {
  config = defaults(config, {
    async: false,
    needMap: true,
    plugins: [],
    options: {},
    onWarn: message => console.warn(message)
  })

  const plugins = [trim].concat(config.plugins)
  const options = Object.assign({
    to: filename,
    from: filename
  }, config.options)

  // source map
  if (config.needMap) {
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

  let modules
  if (style.descriptor.module) {
    plugins.push(cssModules({
      getJSON: (_, output) => { modules = output }
    }))
  }

  const output = postcss(plugins).process(style.code, options)
  const prepare = result => {
    const output = { code: result.css, modules }

    if (config.needMap) { output.map = result.map }
    result.warnings().forEach(warning => config.onWarn(warning))

    return output
  }

  return (config.async) ? output.then(prepare) : prepare(output)
}
