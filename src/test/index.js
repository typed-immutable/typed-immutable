import test from "./test"
import * as Immutable from "immutable"
import {Record} from "../record"
import {Tuple} from "../tuple"
import {Reader, Union, Range, Maybe} from "../reader"


test("flat record with defaults values", assert => {
  const Point = Record({
    x: Number(0),
    y: Number(0)
  }, 'Point')

  const p1 = Point()

  assert.equal(p1.x, 0)
  assert.equal(p1.y, 0)
  assert.equal(JSON.stringify(p1),
               JSON.stringify({x:0, y:0}))

  const p2 = Point({x: 10})

  assert.equal(p2.x, 10)
  assert.equal(p2.y, 0)
  assert.equal(JSON.stringify(p2),
               JSON.stringify({x:10, y:0}))

  const p3 = Point({x: 1, y: 2})

  assert.equal(p3.x, 1)
  assert.equal(p3.y, 2)
  assert.equal(JSON.stringify(p3),
               JSON.stringify({x: 1, y: 2}))
})

test("ignores unknown fields", assert => {
  const Point = Record({
    x: Number(0),
    y: Number(0)
  }, 'Point')

  const p1 = Point({z: 20})

  assert.equal(p1.z, void(0))
  assert.equal(JSON.stringify(p1),
               JSON.stringify({x:0, y:0}))
})



test("invalid argument passed to a record", assert => {
  const Point = Record({
    x: Number(0),
    y: Number(0)
  }, 'Point')

  assert.throws(() => {
    Point(null)
  }, /Invalid data structure "null"/)

  assert.throws(() => {
    Point(7)
  }, /Invalid data structure "7"/)

  assert.throws(() => {
    Point(true)
  }, /Invalid data structure "true"/)

  assert.throws(() => {
    Point("{x: 1}")
  }, /Invalid data structure "{x: 1}"/)
})

test("flat record without defaults", assert => {
  const Point = Record({
    x: Number,
    y: Number
  }, 'Point')

  assert.throws(() => {
    Point()
  }, /Invalid value for "x" field/)

  assert.throws(() => {
    Point({x: 1})
  }, /Invalid value for "y" field/)

  const p1 = Point({x: 0, y: 1})

  assert.equal(p1.x, 0)
  assert.equal(p1.y, 1)
})

test("stringify on record", assert => {
  const UnlabledPoint = Record({x: Number, y: Number})

  assert.equal(UnlabledPoint({x:0, y:0}).toTypeName(),
               'Typed.Record({x: Number, y: Number})')

  assert.equal(UnlabledPoint({x:4, y:9}) + '',
               'Typed.Record({x: Number, y: Number})({ "x": 4, "y": 9 })')

  const LabledPoint = Record({x: Number, y: Number}, "Point")

  assert.equal(LabledPoint({x:0, y:0}).toTypeName(),
               'Point')

  assert.equal(LabledPoint({x:4, y:9}) + '',
               'Point({ "x": 4, "y": 9 })')

  const PointDefaults = Record({x: Number(0), y: Number(7)})

  assert.equal(PointDefaults({x:5, y:3}).toTypeName(),
               'Typed.Record({x: Number(0), y: Number(7)})')

  assert.equal(PointDefaults({x:4, y:9}) + '',
               'Typed.Record({x: Number(0), y: Number(7)})({ "x": 4, "y": 9 })')

  const LabledPointDefaults = Record({x: Number(5), y: Number(9)}, "Point")

  assert.equal(LabledPointDefaults({x:0, y:0}).toTypeName(),
               "Point")

  assert.equal(LabledPointDefaults({x:4, y:9}) + '',
               'Point({ "x": 4, "y": 9 })')

})


test("nested records", assert => {
  const Point = Record({x: Number(0), y: Number(0)}, "Point")
  const Line = Record({begin: Point, end: Point}, "Line")

  assert.equal(Line() + '',
               'Line({ "begin": Point({ "x": 0, "y": 0 }), "end": Point({ "x": 0, "y": 0 }) })')

  assert.equal(Line({begin: {x: 5} }) + '',
               'Line({ "begin": Point({ "x": 5, "y": 0 }), "end": Point({ "x": 0, "y": 0 }) })')

  assert.equal(Line({begin: {x: 5}, end: {y: 7} }) + '',
               'Line({ "begin": Point({ "x": 5, "y": 0 }), "end": Point({ "x": 0, "y": 7 }) })')

  const l1 = Line({begin: {x: 5}, end: {y: 7} })

  assert.ok(Line(JSON.parse(JSON.stringify(l1))).equals(l1))

  assert.throws(() => {
    Line({begin: {x: 5}, end: null})
  }, /Invalid value for "end" field/)

  assert.throws(() => {
    Line({begin: {x: 5}, end: {y: "7"}})
  }, /Invalid value for "y" field/)
})

test("Maybe type", assert => {
  assert.throws(() => {
    Maybe({})
  }, /is not a valid/)

  const InputModel = Record({
    value: Maybe(String)
  }, "InputModel")

  assert.equal(InputModel() + '',
               `InputModel({ "value": null })`)

  assert.equal(JSON.stringify(InputModel()),
               JSON.stringify({value: null}))

  assert.equal(JSON.stringify(InputModel({})),
               JSON.stringify({value: null}))

  assert.equal(JSON.stringify(InputModel({value: null})),
               JSON.stringify({value: null}))

  assert.equal(JSON.stringify(InputModel({value: void(0)})),
               JSON.stringify({value: null}))


  assert.throws(_ => InputModel({value: 17}),
                /"17" is not nully/)
  assert.throws(_ => InputModel({value: 17}),
                /nor it is of String type/)

  const i1 = InputModel({value: "hello"})

  assert.equal(i1.value, "hello")
  assert.equal(JSON.stringify(i1),
               JSON.stringify({value: "hello"}))
  assert.equal(i1 + '',
               'InputModel({ "value": "hello" })')
})


test("Range type", assert => {
  const Color = Record({
    red: Range(0, 255, 0),
    green: Range(0, 255, 0),
    blue: Range(0, 255, 0),
    alpha: Maybe(Range(0, 100))
  }, "Color")

  assert.equal(Color() + '',
               'Color({ "red": 0, "green": 0, "blue": 0, "alpha": null })')

  assert.throws(_ => Color({alpha: -10}),
                /"-10" is not nully/)
  assert.throws(_ => Color({alpha: -10}),
                /of Number.Range\(0\.\.100\) type/)

  assert.equal(Color({alpha: 20}) + '',
               'Color({ "red": 0, "green": 0, "blue": 0, "alpha": 20 })')

})

test("Union type", assert => {
  const Status = Record({
    readyState: Union(Number, String)
  })


  assert.throws(_ => Status(),
                /"undefined" does not qualify Union\(Number, String\)/)

  assert.equal(Status({readyState: "loading"}).toString(),
               `Typed.Record({readyState: Union(Number, String)})({ "readyState": "loading" })`)

})
