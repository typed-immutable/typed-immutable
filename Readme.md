# Typed-immutable [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Gitter][gitter-image]][gitter-url]
=========

Library provides is built upon [immutable.js][] to leverage it’s immutable [persistent][] data and provide structural typing on top of that. Library is not aiming to provide type safety of typed language (some static type checker like [flow][] would be tool for that) although it allows user to define structured types and guarantees that values produced and later transformed will conform to pre-defined structure. Handy use case for such tool would be an application state modelling (in [MVC][] sense), specially if state is centralised but compartmentalized for us by independent components.


## API

In the following sections we would use term "type" for a javascript class that can be instantiated via function call (although use of `new` still possible) and produces immutable persistent data structure that we’ll refer to as "value" as they will have more common with primitive values like strings or numbers than with objects.

### Record

Records are a labeled data structure. They provide a lightweight representation for complex data. Record types can be defined by invoking `Record` function with a type structure descriptor, that is an object that provides field names and types associated with them:

```js
var {Record} = require("typed-immutable")

var Point = Record({x: Number, y: Number})
```

Record types maybe invoked as functions or instantiated as a class to produce a value in form of immutable object with a pre-defined structure:

```js
Point({x:0, y:0}) // => {x:0, y:0}
new Point({x: 0, y:0}) // => {x:0, y:0}
```

Record types enforce pre-defined structure and will fail if input provided does not match it:

```js
Point() // => TypeError: Invalid value for "x" field:
        //               "undefined" is not a number


Point({x: "1", y: "2"}) // => TypeError: Invalid value for "x" field:
                        //     "1" is not a number
```


Record types definitions may also be provided a default values for feilds for a convinence of use:

```js
var Point = Record({x: Number(0), y: Number(0)})
Point() // => { "x": 0, "y": 0 }
Point({x: 20}) // => { "x": 20, "y": 0 }

Point({x: null}) // => TypeError: Invalid value for "x" field:
                 //     "null" is not a number
```

Record fields can be accessed by name via property access syntax:

```js
var p1 = Point({x: 17})
p1.x // => 17
p1.y // => 0
```

Attempts to update a field will fail with error:

```js
p1.x = 30 // =>  TypeError: Cannot set on an immutable record.
```

Instead of changing a record values you can transform them or create new values from existing one similar to how you do that with strings or numbers:

```js
p1 = Point() // => {x:0, y:0}
p1.set("x", 7) // => {x: 7, y:0}
p1 // => {x:0, y:0}
```

Removeing a field from a record simply resets it's value to the default if one was defined.

```js
var p1 = Point({x: 1, y: 25}) // => {x:1, y:25}
p1.remove("y") // => {x:1, y:0}
```

Record types proudce values with only fields that they were defined with everything else
they simply ignore:

```js
Point({x:30, y:40, z:8}) // => {x:30, y:40}
```

Although the do explicitly forbid setting undeclared fields with error:

```js
Point().set("z", 5) // => TypeError: Cannot set unknown field "z" on "Typed.Record({x: Number(0), y: Number(0)})"
```

Record values are actually instances of the record type / class but given immutablity they have much more common with values which is why we refer to them as such:

```js
var p1 = Point()
p1 instanceof Point // true
p1.x // => 0
p1.y // => 0

var p2 = p1.merge({x: 23})
p2 instanceof Point // true
p2.x // => 23
p2.y // => 0

p1.equals(Point()) // => true

p1.equals(p2) // => false

p2.equals(Point({x: 23})) // => true
```

Record values serialize to strings that containing their value and a type signature

```js
Point({x:23}).toString() // => ‘Typed.Record({x: Number(0), y: Number(0)})({ "x": 23, "y": 0 })’
```

But for records with large number of fields it maybe more handy to provide a name, that
can be done during definition:

```js
var Point = Record({x: Number(0), y: Number(0)}, "Point")

Point({x: 4, y: 7}).toString() // => ‘Point({ "x": 4, "y": 7 })’
```

##### Nested records

For any complex data defining records contaning records is crucial, which works exactly as expected:

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

As with primitive fields you could provide defaults to a complex records as well:

```js
var Line = Record({begin: Point({x:23}), end: Point({y:4})}, "Line")
Line().toString() //=> Line({ "begin": Point({ "x": 23, "y": 0 }), "end": Point({ "x": 0, "y": 4 }) })
```

Records can be serialized to JSON and then instantiated back to an equal record value:

```js
Line(line.toJSON()).equals(line) // => true
```

### List

You can define typed lists by providing a `List` function a type that it’s
items are supposed to be of:

```js
var {List} = require("typed-immutable")

var Numbers = List(Number)

Numbers().toString() // ‘Typed.List(Number)([])’

Numbers.of(1, 2, 3).toString() // => ‘Typed.List(Number)([ 1, 2, 3 ])’
```

Typed lists may contain only items of that type and fail with error if attempted to do otherwise:

```js
Numbers([2, 3]).toString() // => Typed.List(Number)([ 2, 3 ])

Numbers([1, 2, 3, "4", "5"]) // => TypeError: Invalid value: "4" is not a number

Numbers([1, 2, 3]).push(null) // => TypeError: Invalid value: "null" is not a number
```

Typed lists can also be named for convinience:

```js
var Strings = List(String, "Strings")

Strings.of("hello", "world").toString() // => Strings([ "hello", "world" ])
```

List can be of a complex a specific record type & records can also have fields of typed list:


```js
var Points = List(Point, "Points")
Points().toString() // => Points([])

ps = Points.of({x:3}, {y: 5}).toString()
ps.toString() // => Points([ Point({ "x": 3, "y": 0 }), Point({ "x": 0, "y": 5 }) ])'

ps.get(0) instanceof Point // => true
ps.get(1) instanceof Point // => true

ps.get(0).x // => 3
ps.get(1).y // => 5

ps.push({z:4, x:-4}).toJSON() // => [ { x: 3, y: 0 }, { x: 0, y: 5 }, { x: -4, y: 0 } ]

Points(ps.toJSON()).equals(ps) // => true
```

##### mapping lists form one type to other

One somewhat tricky thing about lists is that while they enforce certain type they can also be as easily converted to list of other type by simply mapping it:

```js
ps = Points.of({x:1}, {x:2})
xs = ps.map(p => p.x)

ps.toString() // => Points([ Point({ "x": 1, "y": 0 }), Point({ "x": 2, "y": 0 }) ])
xs.toString() // => Typed.List(Number)([ 1, 2 ])
```

As you can see from example above original `ps` list was of `Point` records while mapped `xs` list is of numbers and that is refleced in the type of the list. Although given that JS is untyped language theer is no guarantee that mapping function will return values of the same type which makes things little more complex, result of such mapping will be list of union type of all types that mapping funciton produced (see types section for union types).


### Types

As it was illustrated in above sections we strucutre our types using other types there for this libary supports most JS types out of the box and provides few extra to cover more complex cases.

#### JS native types

You can use `Boolean` `Number` `String` `RegExp` JS built-in constructs structures of those types.

#### Maybe

You can define an optional type using `Maybe` that will produce a type whos value can be `undefined` `null` or a value of the provided type:

```js
var {Maybe} = require("typed-immutable")
var Color = Record({
  red: Number(0),
  green: Number(0),
  blue: Number(0),
  opacity: Maybe(Number)
})

Color().toJSON() // => { red: 0, green: 0, blue: 0, opacity: null }
Color({red: 200, opacity: 80}).toJSON() // => { red: 200, green: 0, blue: 0, alpha: 80 }
Color({red: 200, opacity: "transparent"}) // => TypeError: Invalid value for "opacity" field:
                                          // "transparent" is not nully nor it is of Number type
```

#### Union

A union type is a way to put together many different types. This lets you create list or records fields that can take  either one of the several types:

```js
var {Maybe} = require("typed-immutable")
var Form = Record({
  user: Union(Username, Email),
  password: String('')
})

var form = Form()
form.set('user', Username('gozala'))
form.set('user', Email('gozala@mail.com'))
```

#### Custom Type

Library lets you declare your own custom types that then you can use in defining more complex types with records and lists:

```js
var {Typed} = require("typed-immutable")
var Range = (from, to=+Infinity) =>
  Typed(`Typed.Number.Range(${from}..${to})`, value => {
    if (typeof(value) !== 'number') {
      return TypeError(`"${value}" is not a number`)
    }

    if (!(value >= from && value <= to)) {
      return TypeError(`"${value}" isn't in the range of ${from}..${to}`)
    }

    return value
  })

var Color = Record({
  red: Range(0, 255),
  green: Range(0, 255),
  blue: Range(0, 255)
})

Color({red: 20, green: 20, blue: 20}).toJSON() // => { red: 20, green: 20, blue: 20 }
Color({red: 20, green: 20, blue: 300}) // => TypeError: Invalid value for "blue" field:
                                       // "300" isn't in the range of 0..255

Color() // => TypeError: Invalid value for "red" field:
        // "undefined" is not a number

var Color = Record({
  red: Range(0, 255)(0),
  green: Range(0, 255)(0),
  blue: Range(0, 255)(0)
})

Color().toJSON() // => { red: 0, green: 0, blue: 0 }
```

As a matter of fact `Typed` contains bunch of other types including `Typed.Number.Range` similar to one from the example above.

#### Any type

While this defeats the whole purpose there are still cases where use of `Any` type may be a good short term solution. In addition as described in the section about list mapping lists could be mapped to arbitrary types and there are cases where result of mapping is `List(Any)`:

```js
var {Any} = require("typed-immutable")
var Box = Record({value: Any})

var v1 = Box({value: 5})
var v2 = v1.set("value", "hello")
var v3 = v2.set("value", v2)

v1.toString() // => Typed.Record({value: Any})({ "value": 5 })
v2.toString() // => Typed.Record({value: Any})({ "value": "hello" })
v3.toString() // => Typed.Record({value: Any})({ "value": Typed.Record({value: Any})({ "value": "hello" }) })
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
[flow]:http://flowtype.org
