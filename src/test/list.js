import test from "./test"
import * as Immutable from "immutable"
import {Record} from "../record"
import {List} from "../list"
import {Typed, Union, Maybe} from "../typed"

const NumberList = List(Number)
const StringList = List(String)
const Point = Record({x: Number(0),
                      y: Number(0)},
                     'Point')

const Points = List(Point, 'Points')

const isUpperCase = x => x.toUpperCase() === x
const upperCase = x => x.toUpperCase()
const inc = x => x + 1
const isEvent = x => x % 2 === 0
const sum = (x, y) => x + y
const concat = (xs, ys) => xs.concat(ys)

test("typed list creation", assert => {

  assert.throws(_ => List(),
                /Typed.List must be passed a type descriptor/)

  assert.throws(_ => List({}),
                /Typed.List was passed an invalid type descriptor:/)
})

test("number list", assert => {
  const ns1 = NumberList()
  assert.ok(ns1 instanceof Immutable.List)
  assert.ok(ns1 instanceof List)
  assert.ok(ns1 instanceof NumberList)
  assert.equal(ns1.size, 0)

  const ns2 = ns1.push(5)
  assert.ok(ns1 instanceof Immutable.List)
  assert.ok(ns1 instanceof List)
  assert.ok(ns1 instanceof NumberList)
  assert.equal(ns2.size, 1)
  assert.equal(ns2.get(0), 5)
  assert.equal(ns2.first(), 5)
  assert.equal(ns2.last(), 5)
})

test("empty record list", assert => {
  const v = Points()

  assert.ok(v instanceof Immutable.List)
  assert.ok(v instanceof List)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 0)


})

test("make list as function call", assert => {
  const v = Points([{x: 1}])

  assert.ok(v instanceof Immutable.List)
  assert.ok(v instanceof List)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 1)

  assert.ok(v.get(0) instanceof Record)
  assert.ok(v.get(0) instanceof Point)
  assert.deepEqual(v.toJSON(), [{x:1, y:0}])
})

test("make list of records", assert => {
  const v = Points.of({x:10}, {x:15}, {x:17})
  assert.ok(v instanceof Immutable.List)
  assert.ok(v instanceof List)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 3)

  assert.ok(v.get(0) instanceof Record)
  assert.ok(v.get(0) instanceof Point)

  assert.ok(v.get(1) instanceof Record)
  assert.ok(v.get(1) instanceof Point)

  assert.ok(v.get(2) instanceof Record)
  assert.ok(v.get(2) instanceof Point)

  assert.deepEqual(v.toJSON(), [{x:10, y:0},
                                {x:15, y:0},
                                {x:17, y:0}])
})

test("make list with new", assert => {
  const v = new Points([{x: 3}])

  assert.ok(v instanceof Immutable.List)
  assert.ok(v instanceof List)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 1)

  assert.ok(v.get(0) instanceof Record)
  assert.ok(v.get(0) instanceof Point)
  assert.deepEqual(v.toJSON(), [{x:3, y:0}])
})

test("toString on typed list", assert => {
  const points = Points.of({x: 10}, {y: 2})
  const numbers = NumberList.of(1, 2, 3)
  const strings = StringList.of("hello", "world")

  assert.equal(points.toString(),
               `Points([ Point({ "x": 10, "y": 0 }), Point({ "x": 0, "y": 2 }) ])`)

  assert.equal(numbers.toString(),
               `Typed.List(Number)([ 1, 2, 3 ])`)

  assert.equal(strings.toString(),
               `Typed.List(String)([ "hello", "world" ])`)
})

test("create list from entries", assert => {
  const ns1 = NumberList.of(1, 2, 3, 4)
  assert.equal(ns1.toString(),
               "Typed.List(Number)([ 1, 2, 3, 4 ])")
  assert.equal(ns1[Typed.typeName](),
               "Typed.List(Number)")

  assert.deepEqual(ns1.toJSON(),
                   [1, 2, 3, 4])
})

test("converts sequences to list", assert => {
  const seq = Immutable.Seq([{x: 1}, {x: 2}])
  const v = Points(seq)

  assert.ok(v instanceof Immutable.List)
  assert.ok(v instanceof List)
  assert.ok(v instanceof Points)

  assert.equal(v.size, 2)

  assert.ok(v.get(0) instanceof Record)
  assert.ok(v.get(0) instanceof Point)
  assert.ok(v.get(1) instanceof Record)
  assert.ok(v.get(1) instanceof Point)

  assert.deepEqual(v.toJSON(), [{x:1, y:0},
                                {x:2, y:0}])
})

test("can be subclassed", assert => {
  class Graph extends Points {
    foo() {
      const first = this.first()
      const last = this.last()
      return last.x - first.x
    }
  }

  const v1 = new Graph([{y:3},{x:7},{x:9, y:4}])

  assert.ok(v1 instanceof Immutable.List)
  assert.ok(v1 instanceof List)
  assert.ok(v1 instanceof Points)
  assert.ok(v1 instanceof Graph)

  assert.equal(v1.foo(), 9)
  assert.deepEqual(v1.toJSON(),
                   [{x:0, y:3},
                    {x:7, y:0},
                    {x:9, y:4}])

  const v2 = v1.set(0, {x: 2, y: 4})

  assert.ok(v2 instanceof Immutable.List)
  assert.ok(v2 instanceof List)
  assert.ok(v2 instanceof Points)
  assert.ok(v2 instanceof Graph)

  assert.equal(v2.foo(), 7)
  assert.deepEqual(v2.toJSON(),
                   [{x:2, y:4},
                    {x:7, y:0},
                    {x:9, y:4}])
})

test("short-circuits if already a list", assert => {
  const v1 = Points.of({x: 2, y: 4},
                       {x: 8, y: 3})

  assert.equal(v1, Points(v1))

  assert.equal(v1, new Points(v1))

  const OtherPoints = List(Point)

  assert.ok(OtherPoints(v1) instanceof OtherPoints)
  assert.notOk(OtherPoints(v1) instanceof Points)
  assert.notEqual(v1, OtherPoints(v1))
  assert.ok(v1.equals(OtherPoints(v1)))

  assert.ok(new OtherPoints(v1) instanceof OtherPoints)
  assert.notOk(new OtherPoints(v1) instanceof Points)
  assert.notEqual(v1, new OtherPoints(v1))
  assert.ok(v1.equals(new OtherPoints(v1)))

  class SubPoints extends Points {
    head() {
      return this.first()
    }
  }

  assert.notEqual(v1, new SubPoints(v1))
  assert.ok(v1.equals(new SubPoints(v1)))


  assert.equal(new SubPoints(v1).head(),
               v1.first())
})

test("can be cleared", assert => {
  const v1 = Points.of({x:1}, {x:2}, {x:3})
  const v2 = v1.clear()

  assert.ok(v1 instanceof Points)
  assert.ok(v2 instanceof Points)

  assert.equal(v1.size, 3)
  assert.equal(v2.size, 0)

  assert.deepEqual(v1.toJSON(),
                   [{x:1, y:0}, {x:2, y:0}, {x:3, y:0}])

  assert.deepEqual(v2.toJSON(),
                   [])

  assert.equal(v2.first(), void(0))
})

test("can construct records", assert => {
  const v1 = Points()
  const v2 = v1.push({x:1})
  const v3 = v2.push({y:2})
  const v4 = v3.push({x:3, y:3})
  const v5 = v4.push(void(0))

  assert.ok(v1 instanceof Points)
  assert.ok(v2 instanceof Points)
  assert.ok(v3 instanceof Points)
  assert.ok(v4 instanceof Points)
  assert.ok(v5 instanceof Points)

  assert.equal(v1.size, 0)
  assert.equal(v2.size, 1)
  assert.equal(v3.size, 2)
  assert.equal(v4.size, 3)
  assert.equal(v5.size, 4)

  assert.deepEqual(v1.toJSON(), [])
  assert.deepEqual(v2.toJSON(), [{x:1, y:0}])
  assert.deepEqual(v3.toJSON(), [{x:1, y:0},
                                 {x:0, y:2}])
  assert.deepEqual(v4.toJSON(), [{x:1, y:0},
                                 {x:0, y:2},
                                 {x:3, y:3}])
  assert.deepEqual(v5.toJSON(), [{x:1, y:0},
                                 {x:0, y:2},
                                 {x:3, y:3},
                                 {x:0, y:0}])
})

test("can update sub-records", assert => {
  const v1 = Points.of({x: 4}, {y: 4})
  const v2 = v1.setIn([0, "y"], 5)
  const v3 = v2.set(2, void(0))
  const v4 = v3.setIn([1, "y"], void(0))

  assert.ok(v1 instanceof Points)
  assert.ok(v2 instanceof Points)
  assert.ok(v3 instanceof Points)
  assert.ok(v4 instanceof Points)

  assert.equal(v1.size, 2)
  assert.equal(v2.size, 2)
  assert.equal(v3.size, 3)
  assert.equal(v4.size, 3)

  assert.deepEqual(v1.toJSON(),
                   [{x:4, y:0},
                    {x:0, y:4}])

  assert.deepEqual(v2.toJSON(),
                   [{x:4, y:5},
                    {x:0, y:4}])

  assert.deepEqual(v3.toJSON(),
                   [{x:4, y:5},
                    {x:0, y:4},
                    {x:0, y:0}])

  assert.deepEqual(v4.toJSON(),
                   [{x:4, y:5},
                    {x:0, y:0},
                    {x:0, y:0}])
})

test("serialize & parse", assert => {
  const ns1 = NumberList.of(1, 2, 3, 4)

  assert.ok(NumberList(ns1.toJSON()).equals(ns1),
            "parsing serialized typed list")

  assert.ok(ns1.constructor(ns1.toJSON()).equals(ns1),
            "parsing with constructor")
})

test("serialize & parse nested", assert => {
  const v1 = Points.of({x:1}, {x:2}, {y:3})

  assert.ok(Points(v1.toJSON()).equals(v1))
  assert.ok(v1.constructor(v1.toJSON()).equals(v1))
  assert.ok(v1.equals(new Points(v1.toJSON())))

  assert.ok(Points(v1.toJSON()).get(0) instanceof Point)
})

test("construct with array", assert => {
  const ns1 = NumberList([1, 2, 3, 4, 5])

  assert.ok(ns1 instanceof NumberList)
  assert.ok(ns1.size, 5)
  assert.equal(ns1.get(0), 1)
  assert.equal(ns1.get(1), 2)
  assert.equal(ns1.get(2), 3)
  assert.equal(ns1.get(3), 4)
  assert.equal(ns1.get(4), 5)
})

test("construct with indexed seq", assert => {
  const seq = Immutable.Seq([1, 2, 3])
  const ns1 = NumberList(seq)

  assert.ok(ns1 instanceof NumberList)
  assert.ok(ns1.size, 3)
  assert.equal(ns1.get(0), 1)
  assert.equal(ns1.get(1), 2)
  assert.equal(ns1.get(2), 3)
})

test("does not construct form a scalar", assert => {
  assert.throws(_ => NumberList(3),
                /Expected Array or iterable object of values/)
})


test("can not construct with invalid data", assert => {
  const Point = Record({x:Number, y:Number}, "Point")
  const Points = List(Point, "Points")

  assert.throws(_ => Points.of({x:1, y:0}, {y:2, x:2}, {x:3}),
                /"undefined" is not a number/)
})

test("set and get a value", assert => {
  const ns = NumberList()
  const ns2 = ns.set(0, 7)

  assert.equal(ns.size, 0)
  assert.equal(ns.count(), 0)
  assert.equal(ns.get(0), void(0))

  assert.equal(ns2.size, 1)
  assert.equal(ns2.count(), 1)
  assert.equal(ns2.get(0), 7)
})

test("set and get records", assert => {
  const v1 = Points()
  const v2 = v1.set(0, {x:7})

  assert.equal(v1.size, 0)
  assert.equal(v1.count(), 0)
  assert.equal(v1.get(0), void(0))

  assert.equal(v2.size, 1)
  assert.equal(v2.count(), 1)
  assert.ok(v2.get(0) instanceof Point)
  assert.ok(v2.get(0).toJSON(), {x:7, y:0})
})

test("can not set invalid value", assert => {
  const ns = NumberList()

  assert.throws(_ => ns.set(0, "foo"),
                /"foo" is not a number/)

  assert.equal(ns.size, 0)
})

test("can not set invalid structure", assert => {
  const v = Points()

  assert.throws(_ => v.set(0, 5),
                /Invalid data structure/)
})

test("can not set undeclared fields", assert => {
  const v = Points.of({x: 9})

  assert.throws(_ => v.setIn([0, "d"], 4),
                /Cannot set unknown field "d"/)
})

test("counts from the end of the list on negative index", assert => {
  const ns = NumberList.of(1, 2, 3, 4, 5, 6, 7)
  assert.equal(ns.get(-1), 7)
  assert.equal(ns.get(-5), 3)
  assert.equal(ns.get(-9), void(0))
  assert.equal(ns.get(-999, 1000), 1000)
})

test("coerces numeric-string keys", assert => {
  // Of course, TypeScript protects us from this, so cast to "any" to test.
  const ns = NumberList.of(1, 2, 3, 4, 5, 6)


  assert.equal(ns.get('1'), 2)
  assert.equal(ns.get('-1'), 6)
  assert.equal(ns.set('3', 10).get('-3'), 10)
})

test("setting creates a new instance", assert => {
  const v1 = NumberList.of(1)
  const v2 = v1.set(0, 15)

  assert.equal(v1.get(0), 1)
  assert.equal(v2.get(0), 15)

  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)
})

test("size includes the highest index", assert => {
  const v0 = NumberList()
  const v1 = v0.set(0, 1)
  const v2 = v1.set(1, 2)
  const v3 = v2.set(2, 3)

  assert.equal(v0.size, 0)
  assert.equal(v1.size, 1)
  assert.equal(v2.size, 2)
  assert.equal(v3.size, 3)

  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)
  assert.ok(v3 instanceof NumberList)
})

test("get helpers make for easier to read code", assert => {
  const v1 = NumberList.of(1, 2, 3)

  assert.equal(v1.first(), 1)
  assert.equal(v1.get(1), 2)
  assert.equal(v1.last(), 3)
})

test('slice helpers make for easier to read code', assert => {
  const v0 = NumberList.of(1, 2, 3)
  const v1 = NumberList.of(1, 2)
  const v2 = NumberList.of(1)
  const v3 = NumberList()

  assert.deepEqual(v0.rest().toArray(), [2, 3]);
  assert.ok(v0.rest() instanceof NumberList)
  assert.deepEqual(v0.butLast().toArray(), [1, 2])
  assert.ok(v0.butLast() instanceof NumberList)

  assert.deepEqual(v1.rest().toArray(), [2])
  assert.ok(v1.rest() instanceof NumberList)
  assert.deepEqual(v1.butLast().toArray(), [1])
  assert.ok(v1.butLast() instanceof NumberList)

  assert.deepEqual(v2.rest().toArray(), [])
  assert.ok(v2.rest() instanceof NumberList)
  assert.deepEqual(v2.butLast().toArray(), [])
  assert.ok(v2.butLast() instanceof NumberList)

  assert.deepEqual(v3.rest().toArray(), [])
  assert.ok(v3.rest() instanceof NumberList)
  assert.deepEqual(v3.butLast().toArray(), [])
  assert.ok(v3.butLast() instanceof NumberList)
})

test('can set at with in the bonds', assert => {
  const v0 = NumberList.of(1, 2, 3)
  const v1 = v0.set(1, 20) // within existing tail
  const v2 = v1.set(3, 30) // at last position

  assert.throws(_ => v1.set(4, 4),
                /Index "4" is out of bound/)
  assert.throws(_ => v2.set(31, 31),
                /Index "31" is out of bound/)

  assert.equal(v2.size, v1.size + 1)

  assert.deepEqual(v0.toArray(), [1, 2, 3])
  assert.deepEqual(v1.toArray(), [1, 20, 3])
  assert.deepEqual(v2.toArray(), [1, 20, 3, 30])

  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)
})



test('can contain a large number of indices', assert => {
  const input = Immutable.Range(0,20000)
  const numbers = NumberList(input)
  let iterations = 0

  assert.ok(numbers.every(value => {
    const result = value === iterations
    iterations = iterations + 1
    return result
  }))
})

test('push inserts at highest index', assert => {
  const v0 = NumberList.of(1, 2, 3)
  const v1 = v0.push(4, 5, 6)

  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 6)

  assert.deepEqual(v0.toArray(), [1, 2, 3])
  assert.deepEqual(v1.toArray(), [1, 2, 3, 4, 5, 6])
})

test('pop removes the highest index, decrementing size', assert => {
  const v0 = NumberList.of(1, 2, 3)
  const v1 = v0.pop()
  const v2 = v1.push(4)


  assert.equal(v0.last(), 3)
  assert.equal(v0.size, 3)
  assert.deepEqual(v0.toArray(), [1, 2, 3])

  assert.ok(v1 instanceof NumberList)
  assert.equal(v1.last(), 2)
  assert.equal(v1.size, 2)
  assert.deepEqual(v1.toArray(), [1, 2])

  assert.ok(v2 instanceof NumberList)
  assert.equal(v2.last(), 4)
  assert.equal(v2.size, 3)
  assert.deepEqual(v2.toArray(), [1, 2, 4])
})

test('pop on empty', assert => {
  const v0 = NumberList.of(1)
  const v1 = v0.pop()
  const v2 = v1.pop()
  const v3 = v2.pop()
  const v4 = v3.pop()
  const v5 = v4.pop()

  assert.equal(v0.size, 1)
  assert.deepEqual(v0.toArray(), [1])

  ![v1, v2, v3, v4, v5].forEach(v => {
    assert.ok(v instanceof NumberList)
    assert.equal(v.size, 0)
    assert.deepEqual(v.toArray(), [])
  })
})

test('test removes any index', assert => {
  const v0 = NumberList.of(1, 2, 3)
  const v1 = v0.remove(2)
  const v2 = v1.remove(0)
  const v3 = v2.remove(9)
  const v4 = v0.remove(3)
  const v5 = v3.push(5)


  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)
  assert.ok(v3 instanceof NumberList)
  assert.ok(v4 instanceof NumberList)
  assert.ok(v5 instanceof NumberList)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 2)
  assert.equal(v2.size, 1)
  assert.equal(v3.size, 1)
  assert.equal(v4.size, 3)
  assert.equal(v5.size, 2)

  assert.deepEqual(v0.toArray(), [1, 2, 3])
  assert.deepEqual(v1.toArray(), [1, 2])
  assert.deepEqual(v2.toArray(), [2])
  assert.deepEqual(v3.toArray(), [2])
  assert.deepEqual(v4.toArray(), [1, 2, 3])
  assert.deepEqual(v5.toArray(), [2, 5])
})

test("shift removes from the front", assert => {
  const v0 = NumberList.of(1, 2, 3)
  const v1 = v0.shift()

  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)


  assert.deepEqual(v0.toArray(), [1, 2, 3])
  assert.deepEqual(v1.toArray(), [2, 3])

  assert.equal(v0.first(), 1)
  assert.equal(v1.first(), 2)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 2)
})

test("unshift insert items in the front", assert => {
  const v0 = NumberList.of(1, 2, 3)
  const v1 = v0.unshift(11, 12, 13)

  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)


  assert.deepEqual(v0.toArray(), [1, 2, 3])
  assert.deepEqual(v1.toArray(), [11, 12, 13, 1, 2, 3])

  assert.equal(v0.first(), 1)
  assert.equal(v1.first(), 11)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 6)
})


test('finds values using indexOf', assert => {
  var v = NumberList.of(1, 2, 3, 2, 1)

  assert.equal(v.indexOf(2), 1)
  assert.equal(v.indexOf(3), 2)
  assert.equal(v.indexOf(4), -1)
});

test('finds values using findIndex', assert => {
  var v = StringList.of('a', 'b', 'c', 'B', 'a')

  assert.equal(v.findIndex(isUpperCase), 3)
  assert.equal(v.findIndex(x => x.length > 1), -1)
})

test('finds values using findEntry', assert => {
  var v = StringList.of('a', 'b', 'c', 'B', 'a')

  assert.deepEqual(v.findEntry(isUpperCase), [3, 'B'])
  assert.equal(v.findEntry(x => x.length > 1), void(0))
})

test('maps values', assert => {
  var v0 = NumberList.of(1, 2, 3)
  var v1 = v0.map(inc)

  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)
  assert.ok(v1 instanceof Immutable.List)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toArray(), [1, 2, 3])
  assert.deepEqual(v1.toArray(), [2, 3, 4])
})

test('maps records to any', assert => {
  const v0 = Points.of({x:1}, {y:2}, {x:3, y:3})
  const v1 = v0.map(({x, y}) => ({x: x+1, y: y*y}))

  assert.ok(v0 instanceof Points)
  assert.notOk(v1 instanceof Points)
  assert.ok(v1 instanceof Immutable.List)
  assert.equal(v1[Typed.typeName](), 'Typed.List(Any)')

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toJSON(),
                   [{x:1, y:0},
                    {x:0, y:2},
                    {x:3, y:3}])

  assert.deepEqual(v1.toJSON(),
                   [{x:2, y:0},
                    {x:1, y:4},
                    {x:4, y:9}])
})

test('maps records to records', assert => {
  const v0 = Points.of({x:1}, {y:2}, {x:3, y:3})
  const v1 = v0.map(point => point.update('x', inc)
                                  .update('y', inc))

  assert.ok(v0 instanceof Points)
  assert.ok(v1 instanceof Points)
  assert.ok(v1 instanceof Immutable.List)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toJSON(),
                   [{x:1, y:0},
                    {x:0, y:2},
                    {x:3, y:3}])

  assert.deepEqual(v1.toJSON(),
                   [{x:2, y:1},
                    {x:1, y:3},
                    {x:4, y:4}])
})


test('filters values', assert => {
  const v0 = NumberList.of(1, 2, 3, 4, 5, 6)
  const v1 = v0.filter(isEvent)

  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)

  assert.equal(v0.size, 6)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toArray(), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(v1.toArray(), [2, 4, 6])
})

test('reduces values', assert => {
  const v = NumberList.of(1, 10, 100)

  assert.equal(v.reduce(sum), 111)
  assert.equal(v.reduce(sum, 1000), 1111)

  assert.ok(v instanceof NumberList)
  assert.deepEqual(v.toArray(), [1, 10, 100])
})

test('reduces from the right', assert => {
  const v = StringList.of('a','b','c')

  assert.equal(v.reduceRight(concat), 'cba')
  assert.equal(v.reduceRight(concat, 'seeded'), 'seededcba')

  assert.ok(v instanceof StringList)
  assert.deepEqual(v.toArray(), ['a', 'b', 'c'])
})

test('takes and skips values', assert => {
  const v0 = NumberList.of(1, 2, 3, 4, 5, 6)
  const v1 = v0.skip(2)
  const v2 = v1.take(2)

  assert.ok(v0 instanceof NumberList)
  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)

  assert.equal(v0.size, 6)
  assert.equal(v1.size, 4)
  assert.equal(v2.size, 2)

  assert.deepEqual(v0.toArray(), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(v1.toArray(), [3, 4, 5, 6])
  assert.deepEqual(v2.toArray(), [3, 4])
})

test('efficiently chains array methods', assert => {
  const v = NumberList.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14)

  assert.equal(v.filter(x => x % 2 == 0)
                .skip(2)
                .map(x => x * x)
                .take(3)
                .reduce((a, b) => a + b, 0),
               200)

  assert.ok(v instanceof NumberList)
  assert.equal(v.size, 14)
  assert.deepEqual(v.toArray(),
                   [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])

})

test('convert to map', assert => {
  const v = StringList.of("a", "b", "c")
  const m = v.toMap()

  assert.ok(v instanceof StringList)
  assert.equal(v.size, 3)
  assert.deepEqual(v.toArray(), ["a", "b", "c"])

  assert.equal(m.size, 3)
  assert.equal(m.get(1), "b")
})

test('reverses', assert => {
  const v0 = StringList.of("a", "b", "c")
  const v1 = v0.reverse()

  assert.ok(v0 instanceof StringList)
  assert.ok(v1 instanceof StringList)

  assert.equal(v0.size, 3)
  assert.equal(v1.size, 3)

  assert.deepEqual(v0.toArray(), ["a", "b", "c"])
  assert.deepEqual(v1.toArray(), ["c", "b", "a"])
})

test('ensures equality', assert => {
  // Make a sufficiently long list.
  const array = Array(100).join('abcdefghijklmnopqrstuvwxyz').split('')

  const v1 = StringList(array)
  const v2 = StringList(array)

  assert.ok(v1 != v2)
  assert.ok(v1.equals(v2))
})

test('concat works like Array.prototype.concat', assert => {
  const v1 = NumberList.of(1, 2, 3);
  const v2 = v1.concat(4, NumberList.of(5, 6), [7, 8], Immutable.Seq({a:9,b:10}), Immutable.Set.of(11,12));

  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)

  assert.equal(v1.size, 3)
  assert.equal(v2.size, 12)

  assert.deepEqual(v1.toArray(), [1, 2, 3])
  assert.deepEqual(v2.toArray(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
})

test('allows chained mutations', assert => {
  const v1 = NumberList()
  const v2 = v1.push(1)
  const v3 = v2.withMutations(v => v.push(2).push(3).push(4))
  const v4 = v3.push(5)

  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)
  assert.ok(v3 instanceof NumberList)
  assert.ok(v4 instanceof NumberList)

  assert.equal(v1.size, 0)
  assert.equal(v2.size, 1)
  assert.equal(v3.size, 4)
  assert.equal(v4.size, 5)

  assert.deepEqual(v1.toArray(), [])
  assert.deepEqual(v2.toArray(), [1])
  assert.deepEqual(v3.toArray(), [1,2,3,4])
  assert.deepEqual(v4.toArray(), [1,2,3,4,5])
})

test('allows chained mutations using alternative API', assert => {
  const v1 = NumberList()
  const v2 = v1.push(1)
  const v3 = v2.asMutable().push(2).push(3).push(4).asImmutable()
  const v4 = v3.push(5)

  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)
  assert.ok(v3 instanceof NumberList)
  assert.ok(v4 instanceof NumberList)

  assert.equal(v1.size, 0)
  assert.equal(v2.size, 1)
  assert.equal(v3.size, 4)
  assert.equal(v4.size, 5)

  assert.deepEqual(v1.toArray(), [])
  assert.deepEqual(v2.toArray(), [1])
  assert.deepEqual(v3.toArray(), [1,2,3,4])
  assert.deepEqual(v4.toArray(), [1,2,3,4,5])
})

test('allows size to be set', assert => {
  const input = Immutable.Range(0, 2000)
  const v1 = NumberList(input)
  const v2 = v1.setSize(1000)
  assert.throws(_ => v2.setSize(1500),
                /setSize may only downsize/)
  const v3 = v2.setSize(1000)

  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)
  assert.ok(v3 instanceof NumberList)

  assert.equal(v1.size, 2000)
  assert.equal(v2.size, 1000)
  assert.equal(v3.size, 1000)

  assert.equal(v1.get(900), 900)
  assert.equal(v1.get(1300), 1300)
  assert.equal(v1.get(1800), 1800)

  assert.equal(v2.get(900), 900)
  assert.equal(v2.get(1300), void(0))
  assert.equal(v2.get(1800), void(0))

  assert.equal(v3.get(900), 900)
  assert.equal(v3.get(1300), void(0))
  assert.equal(v3.get(1800), void(0))

  assert.ok(v2.equals(v3))
})

test('can be efficiently sliced', assert => {
  const input = Immutable.Range(0, 2000)
  const v1 = NumberList(input)
  const v2 = v1.slice(100,-100)

  assert.ok(v1 instanceof NumberList)
  assert.ok(v2 instanceof NumberList)

  assert.equal(v1.size, 2000)
  assert.equal(v2.size, 1800)

  assert.equal(v2.first(), 100)
  assert.equal(v2.rest().size, 1799)
  assert.equal(v2.last(), 1899)
  assert.equal(v2.butLast().size, 1799)
})
