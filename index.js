const moo = require('moo')
const get = require('get-in')
const set = require('set-in')

var lexer = moo.compile({
  whitespace: {
    match: /[ \t\n]+/,
    lineBreaks: true
  },
  number: {
    match: /-?[0-9]+(?:\.[0-9]+)?/,
    value: Number
  },
  symbol: /[^ \t\n()"]+/,
  string: {
    match: /"(?:\\["\\]|[^\n"\\])*"/,
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

  /*
   * example
   *
   * (module
   *    name
   *    (version 1.0.0)
   *    (author mikey)
   *    (location 121 121)
   *    (favorite chocolate)
   *    (favorite sleep)
   * )
   *
   * formats:
   *   module:
   *     args: ['name']
   *   location:
   *     args: ['lat', 'long']
   *   favorite:
   *     hasMany: true
   *
   *
  */

  function parse (string) {
    lexer.reset(string)

    var object = {}
    var path = []
    var levels = []
    var argIndexes = []
    var isNextTokenKey = false

    for (var token of lexer) {
      if (token.type === 'whitespace') {
        continue
      } else if (token.type === 'listStart') {
        isNextTokenKey = true
      } else if (isNextTokenKey) {
        isNextTokenKey = false

        if (token.type !== 'symbol') {
          throw new Error(lexer.formatError(token, 'Expected symbol as first token after list start.'))
        }

        let level = formats[token.value]
        if (level == null) level = {}
        level = Object.assign(level, { key: token.value })
        console.log('level', level)

        levels.push(level)
        path.push(token.value)
        argIndexes.push(0)

        if (level.hasMany) {
          set(object, path, [])
        } else {
          set(object, path, { _: [] })
        }
      } else if (token.type === 'listEnd') {
        var sofar = get(object, path)
        console.log('sofar', sofar)
        if (Object.keys(sofar).length === 1) {
          // if value at path has only _, then merge up
          if ('_' in sofar && sofar._.length === 1) {
            set(object, path, sofar._[0])
          } else {
            set(object, path, sofar._)
          }
        } else if (sofar._.length === 0) {
          // or if _ is empty, delete it
          delete sofar._
        }

        levels.pop()
        path.pop()
        argIndexes.pop()
      } else {
        var nextValue = token.type === 'number' ? Number(token.value) : token.value
        let level = levels[levels.length - 1]
        console.log('level', level, JSON.stringify(object, null, 2))
        if (level.args != null) {
          var argIndex = argIndexes[argIndexes.length - 1]
          if (argIndex < level.args.length) {
            var nextKey = level.args[argIndex]
            set(object, [...path, nextKey], nextValue)
          } else {
            throw new Error(lexer.formatError(token, 'More args than expected.'))
          }
        } else if (level.hasMany) {
          set(object, [...path, '-'], token.value)
        } else {
          set(object, [...path, '_', '-'], token.value)
        }
      }
    }

    return object
  }

  function stringify (object) {
  }
}
