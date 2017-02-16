import test from "./test"
import * as Immutable from "immutable"
import {Record} from "../record"
import {Typed, typeOf, Any} from "../typed"

const Point = Record({
  x: Number(0),
  y: Number(0)
}, "Point")

const PointAndAny = Record({
  x: Number(0),
  y: Number(0),
  any: Any
}, "PointAndAny")

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

test("reading records with TypeError in Any field", assert => {
  const reader = typeOf(PointAndAny)

  const aTypeError = new TypeError('error message')

  const v1 = reader[Typed.read]()
  const v2 = reader[Typed.read]({x:10})
  const v3 = reader[Typed.read]({y:10})
  const v4 = reader[Typed.read]({x:1, y:2})
  const v5 = reader[Typed.read]({x:1, y:2, any: 'any'})
  const v6 = reader[Typed.read]({x:1, y:2, any: aTypeError})

  assert.ok(v1 instanceof Record)
  assert.ok(v2 instanceof Record)
  assert.ok(v3 instanceof Record)
  assert.ok(v4 instanceof Record)
  assert.ok(v5 instanceof Record)
  assert.ok(v6 instanceof Record)

  assert.ok(v1 instanceof PointAndAny)
  assert.ok(v2 instanceof PointAndAny)
  assert.ok(v3 instanceof PointAndAny)
  assert.ok(v4 instanceof PointAndAny)
  assert.ok(v5 instanceof PointAndAny)
  assert.ok(v6 instanceof PointAndAny)

  assert.deepEqual(v1.toJSON(), {x:0,y:0,any:undefined})
  assert.deepEqual(v2.toJSON(), {x:10,y:0,any:undefined})
  assert.deepEqual(v3.toJSON(), {x:0,y:10,any:undefined})
  assert.deepEqual(v4.toJSON(), {x:1,y:2,any:undefined})
  assert.deepEqual(v5.toJSON(), {x:1,y:2,any:'any'})
  assert.deepEqual(v6.toJSON(), {x:1,y:2,any:aTypeError})
})

const identity = x => x
test("identical on no change", assert => {
  var p1 = Point({x: 5});

  assert.equal(p1, p1.set('x', 5));
  assert.equal(p1, p1.merge({x: 5}));
  assert.equal(p1, p1.merge({y: 0}));
  assert.equal(p1, p1.merge({x: 5, y: 0}));
  assert.equal(p1, p1.remove('y'));
  assert.equal(p1, p1.update('x', identity));
  assert.equal(p1, p1.update('y', identity));
})

test("identical no change in deep updates", assert => {
  var Line = Record({start: Point, end: Point}, 'Line')

  var l1 = Line({start: {x: 5}, end: {x: 7, y: 2}})

  assert.equal(l1, l1.set('start', l1.start))
  assert.equal(l1, l1.set('end', l1.end))

  assert.equal(l1, l1.merge({start: l1.start}))
  assert.equal(l1, l1.merge({end: l1.end}))
  assert.equal(l1, l1.merge({start: l1.start, end: l1.end}))
  assert.equal(l1, l1.removeIn(['start', 'y']))
  assert.equal(l1, l1.setIn(['start', 'x'], 5))
  assert.equal(l1, l1.setIn(['start', 'x'], 5)
                     .setIn(['end', 'x'], 7))
  assert.equal(l1, l1.mergeIn(['start'], {x: 5}))
  assert.equal(l1, l1.mergeIn(['start'], {x: 5, y: 0}))
  assert.equal(l1, l1.mergeIn(['start'], {y: 0}))
  assert.equal(l1, l1.mergeIn(['end'], {y: 2}))
  assert.equal(l1, l1.mergeIn(['end'], {x: 7}))
  assert.equal(l1, l1.mergeIn(['end'], {y: 2, x: 7}))

  assert.equal(l1, l1.update('start', p => p.set('x', 5)))
})


test('empty record optimization', assert => {
  const Point = Record({x: 0, y: 0}, 'Point')

  assert.equal(Point(), Point())
  assert.notEqual(Point({x: 1}), Point())
  assert.equal(Point({x: 1}).clear(), Point())
  assert.equal(Point({x: 1}).clear(), Point({y: 2}).clear())
  assert.equal(Point({}), Point())
  assert.notEqual(Point({z: 3}), Point())
  assert.ok(Point({z: 3}).equals(Point()))
  assert.notEqual(Point({x:0}), Point())
  assert.ok(Point({x: 0}).equals(Point()))
});
