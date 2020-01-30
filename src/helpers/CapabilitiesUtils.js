const _ = require('lodash')
const debug = require('debug')('botium-CapabilitiesUtils')
const { toJsonWeak } = require('./utils')

module.exports.getAllCapValues = (capNamePrefix, caps) => {
  const allCapValues = []
  const jsonPathCaps = _.pickBy(caps, (v, k) => k.startsWith(capNamePrefix))
  _(jsonPathCaps).keys().sort().each((key) => {
    const val = caps[key]

    if (_.isArray(val)) {
      val.forEach(p => {
        allCapValues.push(`${p}`.trim())
      })
    } else if (_.isString(val)) {
      val.split(',').forEach(p => {
        allCapValues.push(p.trim())
      })
    }
  })
  return allCapValues
}

/**
 * Extract repetitive capabilities into list.
 * Key is checked, but the value is free
 * @param caps
 * @param prefix
 * @returns {Array}
 */
module.exports.flatCababilities = (caps, prefix) => {
  const result = []
  let capNames = []
  for (const name of Object.keys(caps)) {
    if (name.startsWith(prefix)) {
      capNames.push(name)
    }
  }
  capNames = capNames.sort()

  if (capNames.length === 1 && capNames[0] === prefix) {
    const val = toJsonWeak(caps[capNames[0]])
    if (_.isArray(val)) {
      val.forEach(entry => result.push(entry))
    } else {
      result.push(val)
    }
  } else {
    const prefixRegexp = new RegExp(`^${prefix}\\.\\d+`)
    let currentGroup
    let currentObject = {}
    for (const capName of capNames) {
      if (capName === prefix) {
        throw new Error(`Incorrect structure. Global definition must be unique. See Capability ${capName}`)
      }
      if (capName.charAt(prefix.length) !== '.') {
        debug(`From flatten result skipped capability ${capName} using prefix ${prefix}`)
        continue
      }
      let capGroup = capName.match(prefixRegexp)
      if (!capGroup.length) {
        throw new Error(`Capability name invalid. No valid grouping found in capability ${capName} using prefix ${prefix}`)
      }
      capGroup = capGroup[0]

      if (capGroup === capName) {
        const val = toJsonWeak(caps[capName])
        result.push(val)
      } else {
        if (capName.charAt(capGroup.length) !== '.') {
          throw new Error(`Capability name invalid. No valid grouping found in capability ${capName} using prefix ${prefix}`)
        }

        const key = capName.substr(capGroup.length + 1)

        if (!key.length) {
          throw new Error(`Capability name invalid. No key after grouping in capability ${capName} using prefix ${prefix}`)
        }

        if (currentGroup && currentGroup !== capGroup) {
          result.push(currentObject)
          currentObject = {}
        }

        currentObject[key] = toJsonWeak(caps[capName])
        currentGroup = capGroup
      }
    }
    if (currentObject && currentGroup) {
      result.push(currentObject)
      currentObject = null
      currentGroup = null
    }
  }

  return result
}
