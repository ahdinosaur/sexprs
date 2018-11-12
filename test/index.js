const test = require('ava')
const dent = require('endent')

const Sexprs = require('../')

test('Sexprs', function (t) {
  t.truthy(Sexprs, 'module is require-able')
})

test('defaults', function (t) {
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

test('basic operators', function (t) {
  var sexprs = Sexprs({
    operators: {
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
      (location
        121
        121
      )
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

test('hasMany', function (t) {
  var sexprs = Sexprs({
    operators: {
      xy: {
        hasMany: true
      }
    }
  })
  var inputString = dent`
    (points
      (xy
        0
        0
      )
      (xy
        1
        1
      )
      (xy
        2
        2
      )
      (xy
        3
        3
      )
    )
  `
  var object = sexprs.parse(inputString)
  var expectedObject = {
    points: {
      xy: [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3]
      ]
    }
  }
  t.deepEqual(object, expectedObject)

  var string = sexprs.stringify(expectedObject)
  var expectedString = inputString + '\n'
  t.deepEqual(string, expectedString)
})

test('hasMany(path)', function (t) {
  var sexprs = Sexprs({
    operators: {
      thing: {
        hasMany: (path) => {
          return path.length === 3
        }
      }
    }
  })
  var inputString = dent`
    (root
      (thing
        (name pie)
      )
      (related
        (thing
          (name mince)
        )
        (thing
          (name cheese)
        )
      )
    )
  `
  var object = sexprs.parse(inputString)
  var expectedObject = {
    root: {
      thing: { name: 'pie' },
      related: {
        thing: [
          { name: 'mince' },
          { name: 'cheese' }
        ]
      }
    }
  }
  t.deepEqual(object, expectedObject)

  var string = sexprs.stringify(expectedObject)
  var expectedString = inputString + '\n'
  t.deepEqual(string, expectedString)
})

test('empty string', function (t) {
  var sexprs = Sexprs()
  var inputString = '(name "")'
  var object = sexprs.parse(inputString)
  var expectedObject = { name: '' }
  t.deepEqual(object, expectedObject)

  var string = sexprs.stringify(expectedObject)
  var expectedString = inputString + '\n'
  t.deepEqual(string, expectedString)
})
