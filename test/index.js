const test = require('ava')

const Sexprs = require('../')

test('Sexprs', function (t) {
  t.truthy(Sexprs, 'module is require-able')
})

test('parse with defaults', function (t) {
  var sexprs = Sexprs()
  var nonsense = `
    (hello
      (does 145 -1.20
        (this "work or (no)")
      )
    )
  `
  var object = sexprs.parse(nonsense)
  var expected = {
    hello: {
      does: {
        _: [145, -1.20],
        this: 'work or (no)'
      }
    }
  }
  t.deepEqual(object, expected)
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
  var author = `
    (person Mikey
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
  var object = sexprs.parse(author)
  var expected = {
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
  t.deepEqual(object, expected)
})
