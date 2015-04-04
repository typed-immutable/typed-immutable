import test from "./test"
import * as Immutable from "immutable"
import {Record} from "../record"
import {Typed, typeOf, Union, Maybe} from "../typed"

const Point = Record({
  x: Number(0),
  y: Number(0)
}, "Point")

test("reading record short-cirquits", assert => {
  const v = Point()
  const reader = typeOf(Point)

  assert.equal(reader[Typed.read](v), v)
})


test("reading records", assert => {
  const reader = typeOf(Point)

  const v1 = reader[Typed.read]()
  const v2 = reader[Typed.read]({x:10})
  const v3 = reader[Typed.read]({y:10})
  const v4 = reader[Typed.read]({x:1, y:2})

  assert.ok(v1 instanceof Record)
  assert.ok(v2 instanceof Record)
  assert.ok(v3 instanceof Record)
  assert.ok(v4 instanceof Record)

  assert.ok(v1 instanceof Point)
  assert.ok(v2 instanceof Point)
  assert.ok(v3 instanceof Point)
  assert.ok(v4 instanceof Point)

  assert.deepEqual(v1.toJSON(), {x:0,y:0})
  assert.deepEqual(v2.toJSON(), {x:10,y:0})
  assert.deepEqual(v3.toJSON(), {x:0,y:10})
  assert.deepEqual(v4.toJSON(), {x:1,y:2})
})
