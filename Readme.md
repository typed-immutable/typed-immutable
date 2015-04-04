# Typed-immutable [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Gitter][gitter-image]][gitter-url]
=========

Library is built upon [immutable.js][] to provides immutable [Persistent][]
data structures and adds a runtime structural typing on top of that. While such
typeing comes with a cost and does not provide nearly as much safety as types
in typed languages it still quite handy for modeling (in [MVC][] sense)
application state, specially when such state is centralized although being used
by independent components.


## API

### Record

Records are a labeled data structure. They provide a lightweight representation
for complex data. You can think of them as [structs]() or immutable JS objects
with predefined shape. Record type / class can be defined using `Record` function
and it's strucutal type descriptor:

```js
var {Record} = require("typed-immutable")

var StrictPoint = Record({x: Number, y: Number})

StrictPoint() // => TypeError: Invalid value for "x" field:
        //               "undefined" is not a number

StrictPoint({x: 0, y: 0}) // => {x:0, y:0}
```


Record may be provided a descriptor with a values for convinience:

```js
var Point = Record({x: Number(0), y: Number(0)})
Point() // => { "x": 0, "y": 0 }
Point({x: 20}) // => { "x": 20, "y": 0 }
```

Record values (they are instances but given immutability it's better
to think of them as values) can have named access to it's fields:

```js
var p1 = Point()
p1 instanceof Point // true
p1.x // => 0
p1.y // => 0

var p2 = Point({x: 23})
p2 instanceof Point // true
p2.x // => 23
p2.y // => 0

p1.equals(Point()) // => true

p1.equals(p2) // => false

p2.equals(p1.set("x", 23)) // => true

p2.set("y", 5).equals(p2) // => false

p1.x = 4 // TypeError: Cannot set on an immutable record.


p2.toString() // => 'Typed.Record({x: Number, y: Number})({ "x": 23, "y": 0 })'
```

Record can be given a names during definition:

```js
var Point = Record({x: Number(0), y: Number(0)}, "Point")

Point({x: 4, y: 7}).toString() // => 'Point({ "x": 4, "y": 7 })'
```

Records can be as nested:


```js
var Line = Record({begin: Point, end: Point}, "Line")
var line = Line({end: {x: 70}})

line instanceof Line // => true

line.toString() // => Line({ "begin": Point({ "x": 0, "y": 0 }), "end": Point({ "x": 70, "y": 0 }) })

line.begin // => {x: 0, y:0}
line.begin instanceof Point // => true

line.end // => {x: 70, y:0}
line.end instanceof Point // => true
```

Records can be serialized to JSON and parsed to produce equal record values:

```js
Line(line.toJSON()).equals(line) // => true
```

### List

You can define typed lists by providing a `List` function a type that it's
items are supposed to be of:

```js
var {List} = require("typed-immutable")

var Numbers = List(Number)

Numbers() // => {}
Numbers().toString() // 'Typed.List(Number)([])'

Numbers.of(1, 2, 3).toString() // => 'Typed.List(Number)([ 1, 2, 3 ])'
```


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/typed-immutable
[npm-image]: https://img.shields.io/npm/v/typed-immutable.svg?style=flat

[travis-url]: https://travis-ci.org/Gozala/typed-immutable
[travis-image]: https://img.shields.io/travis/Gozala/typed-immutable.svg?style=flat

[gitter-url]: https://gitter.im/Gozala/typed-immutable?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[gitter-image]: https://badges.gitter.im/Join%20Chat.svg



[immutable.js]:http://facebook.github.io/immutable-js/
[Persistent]:http://en.wikipedia.org/wiki/Persistent_data_structure
[MVC]:http://en.wikipedia.org/wiki/Model–view–controller
[structs]:http://en.wikipedia.org/wiki/Struct_(C_programming_language)
