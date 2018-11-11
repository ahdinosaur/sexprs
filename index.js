const moo = require('moo')
const { get, set } = require('libnested')
const { isArray } = Array

module.exports = Sexprs

function Sexprs (options = {}) {
  const {
    operators = {}
  } = options

  // setup s-expression parser
  var lexer = moo.compile({
    whitespace: {
      match: /[\s]+/,
      lineBreaks: true
    },
    symbol: /[^\s"()]+/,
    string: {
      match: /"(?:\\["]|[^"])*"/,
      value: value => value.slice(1, -1)
    },
    listStart: '(',
    listEnd: ')'
  })

  return {
    parse,
    stringify
  }

  function parse (string) {
    lexer.reset(string)

    // setup data to track
    var object = {}
    var path = []
    var levels = []
    var argIndexes = []
    var isNextTokenKey = false

    // iterate through tokens
    for (var token of lexer) {
      if (token.type === 'whitespace') {
        // ignore whitespace
        continue
      } else if (token.type === 'listStart') {
        // if start of list, next token is key
        isNextTokenKey = true
      } else if (isNextTokenKey) {
        // if key,
        //
        isNextTokenKey = false

        // then must be symbol
        if (token.type !== 'symbol') {
          throw new Error(lexer.formatError(token, 'Expected symbol as first token after list start.'))
        }

        // keep track of next level
        let level = operators[token.value]
        if (level == null) level = {}
        level = Object.assign(level, { key: token.value })
        levels.push(level)

        // keep track of arguments
        argIndexes.push(0)

        // add value as key
        //
        path.push(token.value)

        // get current data
        let sofar = get(object, path)

        // if has many of this level
        if (level.hasMany) {
          // add index as key
          if (sofar == null) {
            set(object, path, [])
            path.push(0)
          } else {
            path.push(sofar.length)
          }
        }

        // start next object
        set(object, path, { _: [] })
      } else if (token.type === 'listEnd') {
        // if end of list
        //

        // get current data
        let sofar = get(object, path)

        if (Object.keys(sofar).length === 1) {
          // if has only special _ list
          if (sofar._.length === 1) {
            // if only one item in list, then set first value
            set(object, path, sofar._[0])
          } else {
            // else then set list
            set(object, path, sofar._)
          }
        } else if (sofar._.length === 0) {
          // or if _ is empty, delete it
          delete sofar._
        }

        // clean up next level
        //
        var level = levels.pop()

        // if has many of this level, remove index
        if (level.hasMany) path.pop()

        // remove tracked data
        path.pop()
        argIndexes.pop()
      } else {
        // if value
        //
        var nextValue = token.value

        // convert value to number, if possible
        var numericValue = Number(nextValue)
        if (!isNaN(numericValue)) {
          nextValue = numericValue
        }

        // get current level
        let level = levels[levels.length - 1]

        // get current argument index
        var argIndex = argIndexes[argIndexes.length - 1]++

        // if keyed index, set object at value
        if (level.args != null && argIndex < level.args.length) {
          var nextKey = level.args[argIndex]
          set(object, [...path, nextKey], nextValue)
        } else {
          // if unknown key
          // if no list of arguments, add to special _ list
          set(object, [...path, '_', argIndex], nextValue)
        }
      }
    }

    return object
  }

  function stringify (object, depth = 0) {
    if (isString(object)) {
      return indent(depth) + maybeQuoteString(object)
    } else if (isNumber(object)) {
      return indent(depth) + object.toString()
    }

    var strings = []
    for (let [key, value] of Object.entries(object)) {
      const format = operators[key]
      if (format != null && format.hasMany && isArray(value)) {
        value.forEach(item => {
          strings.push(`${stringify({ [key]: item }, depth)}`)
        })
        continue
      }

      strings.push(`${indent(depth)}(${key}`)

      if (value == null) {
        strings.push(')')
      } else if (isString(value) || isNumber(value)) {
        strings.push(` ${stringify(value)})`)
      } else {
        var args = []
        var kwargs = {}

        if (isArray(value)) {
          args = value
        } else {
          kwargs = Object.assign({}, value)

          if ('_' in value) {
            args = value._
            delete kwargs._
          }

          if (format != null && isArray(format.args)) {
            format.args.forEach(argKey => {
              args.unshift(kwargs[argKey])
              delete kwargs[argKey]
            })
          }
        }

        strings.push('\n')

        args.forEach(arg => {
          strings.push(`${stringify(arg, depth + 1)}\n`)
        })

        if (Object.keys(kwargs).length > 0) {
          strings.push(`${stringify(kwargs, depth + 1)}`)
        }

        // strings.push(`${indent(depth)})`)
        strings.push(`${indent(depth)})`)
      }
      strings.push('\n')
    }
    return strings.join('')
  }
}

function indent (depth) {
  return ' '.repeat(depth * 2)
}

const isSymbolRe = /^[^\s"()]+$/

function maybeQuoteString (value) {
  if (isSymbolRe.test(value)) {
    return `${value}`
  } else {
    return `"${value}"`
  }
}

function isString (object) {
  return typeof object === 'string'
}

function isNumber (object) {
  return typeof object === 'number'
}
