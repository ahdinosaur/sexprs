# sexprs

parse and format S-expressions as JavaScript objects

```shell
npm install --save sexprs
```

## background

[Kicad](http://kicad-pcb.org/) files are S-expressions, i wanted an easy way to consume and produce these files.

i also think S-expressions are a cool file format, maybe i'll use them for something in the future. :wink:

## example

```js
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
var inputString = `
  (person Mikey
    (version 1.0.0)
    (website http://dinosaur.is)
    (location 121 121)
    (likes (name chocolate))
    (likes (name JavaScript))
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
```

## usage

### `Sexprs = require('sexprs')`

### `sexprs = Sexprs(options)`

`options` is object with keys:

- `formats`: an object where
  - keys are names of S-expression operators (the first symbol after an open parentheses)
  - values are objects with possible keys:
    - `args`: how to interpret indexed arguments as keys
    - `hasMany`: whether values should be grouped into an array

### `object = sexprs.parse(string)`

### `string = sexprs.format(object)

## license

The Apache License

Copyright &copy; 2018 Michael Williams

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
