const moo = require('moo')
const get = require('get-in')
const set = require('set-in')

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

module.exports = Sexprs

function Sexprs (options = {}) {
  const {
    formats = {}
  } = options

  return {
    parse,
    stringify
  }

  function parse (string) {
    lexer.reset(string)

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

        // get format for level
        let level = formats[token.value]
        if (level == null) level = {}
        level = Object.assign(level, { key: token.value })

        // keep track of next level
        levels.push(level)
        argIndexes.push(0)

        // add value as key
        path.push(token.value)

        // if has many of this level
        if (level.hasMany) {
          // add index as key
          let sofar = get(object, path)
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
        let sofar = get(object, path)

        if (Object.keys(sofar).length === 1) {
          // if value at path has only _, then merge up
          if ('_' in sofar && sofar._.length === 1) {
            set(object, path, sofar._[0])
          } else {
            set(object, path, sofar._)
          }
        } else if ('_' in sofar && sofar._.length === 0) {
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
        var nextValue = token.value
        var numericValue = Number(nextValue)
        if (!isNaN(numericValue)) {
          nextValue = numericValue
        }

        let level = levels[levels.length - 1]

        if (level.args != null) {
          var argIndex = argIndexes[argIndexes.length - 1]++
          if (argIndex < level.args.length) {
            var nextKey = level.args[argIndex]
            set(object, [...path, nextKey], nextValue)
          } else {
            throw new Error(lexer.formatError(token, 'More args than expected.'))
          }
        } else {
          set(object, [...path, '_', '-'], nextValue)
        }
      }
    }

    return object
  }

  function stringify (object) {
  }
}
