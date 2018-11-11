const test = require('ava')
const dent = require('endent')

const Sexprs = require('../')

test('Sexprs', function (t) {
  t.truthy(Sexprs, 'module is require-able')
})

test('parse with defaults', function (t) {
  var sexprs = Sexprs()
  var inputString = dent`
    (hello
      (does
        145
        -1.2
        (this "work or (no)")
      )
    )
  `
  var object = sexprs.parse(inputString)
  var expectedObject = {
    hello: {
      does: {
        _: [145, -1.20],
        this: 'work or (no)'
      }
    }
  }
  t.deepEqual(object, expectedObject)

  var string = sexprs.stringify(expectedObject)
  var expectedString = inputString + '\n'
  t.deepEqual(string, expectedString)
})

test('parse with defaults', function (t) {
  var sexprs = Sexprs({
    formats: {
      person: {
        args: ['name']
      },
      location: {
        args: ['lat', 'long']
      },
      likes: {
        hasMany: true
      }
    }
  })
  var inputString = dent`
    (person
      Mikey
      (version 1.0.0)
      (website http://dinosaur.is)
      (location 121 121)
      (likes
        (name chocolate)
      )
      (likes
        (name JavaScript)
      )
    )
  `
  var object = sexprs.parse(inputString)
  var expectedObject = {
    person: {
      name: 'Mikey',
      version: '1.0.0',
      website: 'http://dinosaur.is',
      location: { lat: 121, long: 121 },
      likes: [
        { name: 'chocolate' },
        { name: 'JavaScript' }
      ]
    }
  }
  t.deepEqual(object, expectedObject)

  var string = sexprs.stringify(expectedObject)
  var expectedString = inputString + '\n'
  t.deepEqual(string, expectedString)
})
