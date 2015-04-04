import test from "./test"
import * as Immutable from "immutable"
import {Record} from "../record"
import {Typed, typeOf, Union, Range, Maybe} from "../typed"

test("define a constructor", assert => {
  const MyType = Record({a: Number(1),
                         b: Number(2),
                         c: Number(3)})

  const t1 = new MyType()
  const t2 = t1.set("a", 10)
  const t3 = t2.clear()

  assert.ok(t1 instanceof Record)
  assert.ok(t1 instanceof MyType)

  assert.ok(t3 instanceof Record)
  assert.ok(t3 instanceof MyType)

  assert.equal(t1.get("a"), 1)
  assert.equal(t2.get("a"), 10)

  assert.equal(t1.size, 3)
  assert.equal(t2.size, 3)
})

test("passes through records of the same type", assert => {
  const P2 = Record({ x: Number(0), y: Number(0) })
  const P3 = Record({ x: Number(0), y: Number(0), z: Number(0) })
  const p2 = P2()
  const p3 = P3()
  assert.ok(P3(p2) instanceof P3)
  assert.ok(P2(p3) instanceof P2)
  assert.equal(P2(p2), p2)
  assert.equal(P3(p3), p3)
})

test("only allows setting what it knows about", assert => {
  const MyType = Record({a: Number(1),
                         b: Number(2),
                         c: Number(3)})

  const t1 = new MyType({a: 10, b:20})
  assert.throws(_ => t1.set("d", 4),
                /Cannot set unknown field "d"/)
})

test("has a fixed size and falls back to default values", assert => {
  const MyType = Record({a: Number(1),
                         b: Number(2),
                         c: Number(3)})

  const t1 = new MyType({a: 10, b:20})
  const t2 = new MyType({b: 20})
  const t3 = t1.remove("a")
  const t4 = t3.clear()

  assert.equal(t1.size, 3)
  assert.equal(t2.size, 3)
  assert.equal(t3.size, 3)
  assert.equal(t4.size, 3)

  assert.equal(t1.get("a"), 10)
  assert.equal(t2.get("a"), 1)
  assert.equal(t3.get("a"), 1)
  assert.equal(t4.get("b"), 2)

  assert.ok(t2.equals(t3))
  assert.notOk(t2.equals(t4))
  assert.ok(t4.equals(new MyType()))
})

test("converts sequences to records", assert => {
  const MyType = Record({a:1, b:2, c:3})
  const seq = Immutable.Seq({a: 10, b:20})
  const t = new MyType(seq)
  assert.deepEqual(t.toObject(), {a:10, b:20, c:3})
})

test("allows for functional construction", assert => {
  const MyType = Record({a:1, b:2, c:3})
  const seq = Immutable.Seq({a: 10, b:20})
  const t = MyType(seq)
  assert.deepEqual(t.toObject(), {a:10, b:20, c:3})
})

test("skips unknown keys", assert => {
  const MyType = Record({a:1, b:2})
  const seq = Immutable.Seq({b:20, c:30})
  const t = new MyType(seq)

  assert.equal(t.get("a"), 1)
  assert.equal(t.get("b"), 20)
  assert.equal(t.get("c"), void(0))
})

test("flat record with defaults values", assert => {
  const Point = Record({
    x: Number(0),
    y: Number(0)
  }, "Point")

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
  }, "Point")

  const p1 = Point({z: 20})

  assert.equal(p1.z, void(0))
  assert.equal(JSON.stringify(p1),
               JSON.stringify({x:0, y:0}))
})



test("invalid argument passed to a record", assert => {
  const Point = Record({
    x: Number(0),
    y: Number(0)
  }, "Point")

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
  }, "Point")

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

  assert.equal(UnlabledPoint({x:0, y:0})[Typed.typeName](),
               `Typed.Record({x: Number, y: Number})`)

  assert.equal(UnlabledPoint({x:4, y:9}) + "",
               `Typed.Record({x: Number, y: Number})({ "x": 4, "y": 9 })`)

  const LabledPoint = Record({x: Number, y: Number}, "Point")

  assert.equal(LabledPoint({x:0, y:0})[Typed.typeName](),
               "Point")

  assert.equal(LabledPoint({x:4, y:9}) + "",
               `Point({ "x": 4, "y": 9 })`)

  const PointDefaults = Record({x: Number(0), y: Number(7)})

  assert.equal(PointDefaults({x:5, y:3})[Typed.typeName](),
               `Typed.Record({x: Number(0), y: Number(7)})`)

  assert.equal(PointDefaults({x:4, y:9}) + "",
               `Typed.Record({x: Number(0), y: Number(7)})({ "x": 4, "y": 9 })`)

  const LabledPointDefaults = Record({x: Number(5), y: Number(9)}, "Point")

  assert.equal(LabledPointDefaults({x:0, y:0})[Typed.typeName](),
               "Point")

  assert.equal(LabledPointDefaults({x:4, y:9}) + "",
               `Point({ "x": 4, "y": 9 })`)
})


test("nested records", assert => {
  const Point = Record({x: Number(0), y: Number(0)}, "Point")
  const Line = Record({begin: Point, end: Point}, "Line")

  assert.equal(Line() + "",
               `Line({ "begin": Point({ "x": 0, "y": 0 }), "end": Point({ "x": 0, "y": 0 }) })`)

  assert.equal(Line({begin: {x: 5} }) + "",
               `Line({ "begin": Point({ "x": 5, "y": 0 }), "end": Point({ "x": 0, "y": 0 }) })`)

  assert.equal(Line({begin: {x: 5}, end: {y: 7} }) + "",
               `Line({ "begin": Point({ "x": 5, "y": 0 }), "end": Point({ "x": 0, "y": 7 }) })`)

  const l1 = Line({begin: {x: 5}, end: {y: 7} })

  assert.ok(Line(JSON.parse(JSON.stringify(l1))).equals(l1))

  assert.throws(() => {
    Line({begin: {x: 5}, end: null})
  }, /Invalid value for "end" field/)

  assert.throws(() => {
    Line({begin: {x: 5}, end: {y: "7"}})
  }, /Invalid value for "y" field/)
})

test("defines a constructor", assert => {
  const Point = Record({x:Number(0),
                        y:Number(0)})

  const p1 = new Point()
  const p2 = p1.set("x", 10)

  assert.equal(p1.x, 0)
  assert.equal(p2.x, 10)
})

test("can have mutations apply", assert => {
  const Point = Record({x: Number(0),
                        y: Number(0)})

  const p = new Point()

  assert.throws(_ => p.x = 10,
               /Cannot set on an immutable record/)

  const p2 = p.withMutations(m => {
    m.x = 10
    m.y = 20
  })

  assert.equal(p2.x, 10, "x was updated")
  assert.equal(p2.y, 20, "y was updated")
})

test("can be subclassed", assert => {
  class Alphabet extends Record({a:Number(1),
                                 b:Number(2),
                                 c:Number(3)}) {
    soup() {
      return this.a + this.b + this.c
    }
  }

  const t = new Alphabet()
  const t2 = t.set("b", 200)

  assert.ok(t instanceof Record)
  assert.ok(t instanceof Alphabet)
  assert.equal(t.soup(), 6)

  assert.ok(t2 instanceof Record)
  assert.ok(t2 instanceof Alphabet)
  assert.equal(t2.soup(), 204)
})

test("short-circuits if already a record", assert => {
  const Point = Record({x: Number(0), y: Number(0)})
  const p = new Point({x: 1, y: 2})

  assert.equal(p, Point(p))
  assert.equal(p, new Point(p))

  const OtherPoint = Record({x: Number(0), y: Number(0)})

  assert.notEqual(p, OtherPoint(p))
  assert.ok(p.equals(OtherPoint(p)))
  assert.notEqual(p, new OtherPoint(p))
  assert.ok(p.equals(new OtherPoint(p)))
  assert.equal(OtherPoint(p).x, 1)
  assert.equal(OtherPoint(p).y, 2)

  class SubPoint extends Point {
    stringify() {
      return `${this.x}:${this.y}`
    }
  }

  assert.notEqual(p, new SubPoint(p))
  assert.ok(p.equals(new SubPoint(p)))

  assert.equal(new SubPoint(p).stringify(),
               "1:2")
})

test("can be cleared", assert => {
  const Point = Record({x: Number(1), y: Number(2)})
  const p = Point({y: 20})

  assert.equal(p.x, 1)
  assert.equal(p.y, 20)

  const pc = p.clear()

  assert.equal(pc.x, 1)
  assert.equal(pc.y, 2)
})

test("can not be cleared when no defaults", assert => {
  const Point = Record({x: Number, y: Number})
  const p = Point({x: 1, y: 1})

  assert.equal(p.x, 1)
  assert.equal(p.y, 1)

  assert.throws(_ => p.clear(),
                /Invalid value for "x" field/)
})

test("can construct sub-records", assert => {
  const Field = Record({
    value: String(""),
    isFocused: Boolean(false)
  })

  const Login = Record({
    user: Field,
    password: Field
  })

  const l1 = Login()

  assert.ok(l1.user instanceof Field)
  assert.ok(l1.password instanceof Field)
  assert.ok(l1.user.value === "")
  assert.ok(l1.user.isFocused === false)
  assert.ok(l1.password.value === "")
  assert.ok(l1.password.isFocused === false)

  assert.ok(l1.equals(new Login()))

  const l2 = Login({user: {value: "gozala"}})

  assert.ok(l2.user instanceof Field)
  assert.ok(l2.password instanceof Field)
  assert.ok(l2.user.value === "gozala")
  assert.ok(l2.user.isFocused === false)
  assert.ok(l2.password.value === "")
  assert.ok(l2.password.isFocused === false)

  const l3 = Login({user: {value: "gozala"},
                    password: {isFocused: true},
                    extra: {isFocused: false}})

  assert.ok(l3.user instanceof Field)
  assert.ok(l3.password instanceof Field)
  assert.ok(l3.user.value === "gozala")
  assert.ok(l3.user.isFocused === false)
  assert.ok(l3.password.value === "")
  assert.ok(l3.password.isFocused === true)
  assert.ok(l2.extra === undefined)
})


test("can update sub-records", assert => {
    const Field = Record({
      value: String(""),
      isFocused: Boolean(false)
    })

    const Login = Record({
      user: Field,
      password: Field,
    })

    const l1 = Login()
    assert.ok(l1.user instanceof Field)
    assert.ok(l1.password instanceof Field)
    assert.ok(l1.user.value === "")
    assert.ok(l1.user.isFocused === false)
    assert.ok(l1.password.value === "")
    assert.ok(l1.password.isFocused === false)

    var l2 = l1.set("user", {value: "gozala"})
    assert.ok(l2.user instanceof Field)
    assert.ok(l2.password instanceof Field)
    assert.ok(l2.user.value === "gozala")
    assert.ok(l2.user.isFocused === false)
    assert.ok(l2.password.value === "")
    assert.ok(l2.password.isFocused === false)

    var l3 = l1.updateIn(["user"],
                         _ => ({value: "updateIn"}))
    assert.ok(l3.user instanceof Field)
    assert.ok(l3.password instanceof Field)
    assert.ok(l3.user.value === "updateIn")
    assert.ok(l3.user.isFocused === false)
    assert.ok(l3.password.value === "")
    assert.ok(l3.password.isFocused === false)

    var l4 = l2.set("user", void(0))
    assert.ok(l4.user instanceof Field)
    assert.ok(l4.password instanceof Field)
    assert.ok(l4.user.value === "")
    assert.ok(l4.user.isFocused === false)
    assert.ok(l4.password.value === "")
    assert.ok(l4.password.isFocused === false)

    var l5 = l1.merge({user: {value: "merge"}})
    assert.ok(l5.user instanceof Field)
    assert.ok(l5.password instanceof Field)
    assert.ok(l5.user.value === "merge")
    assert.ok(l5.user.isFocused === false)
    assert.ok(l5.password.value === "")
    assert.ok(l5.password.isFocused === false)
})

test("can use instances as fields", assert => {
  const Field = Record({isFocused: false,
                        value: ""})

  const Login = Record({user: Field({isFocused: true}),
                        password: Field})

  const l1 = Login()

  assert.ok(l1.user instanceof Field)
  assert.ok(l1.password instanceof Field)
  assert.ok(l1.user.value === "")
  assert.ok(l1.user.isFocused === true)
  assert.ok(l1.password.value === "")
  assert.ok(l1.password.isFocused === false)

  const l2 = Login({user: {isFocused: false, value: "gozala"},
                    password: {isFocused: true}})

  assert.ok(l2.user instanceof Field)
  assert.ok(l2.password instanceof Field)
  assert.ok(l2.user.value === "gozala")
  assert.ok(l2.user.isFocused === false)
  assert.ok(l2.password.value === "")
  assert.ok(l2.password.isFocused === true)
})

test("Maybe type", assert => {
  assert.throws(() => {
    Maybe({})
  }, /is not a valid/)

  const InputModel = Record({
    value: Maybe(String)
  }, "InputModel")

  assert.equal(InputModel() + "",
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
  assert.equal(i1 + "",
               `InputModel({ "value": "hello" })`)
})


test("Range type", assert => {
  const Color = Record({
    red: Typed.Number.Range(0, 255, 0),
    green: Typed.Number.Range(0, 255, 0),
    blue: Typed.Number.Range(0, 255, 0),
    alpha: Maybe(Typed.Number.Range(0, 100))
  }, "Color")

  assert.equal(Color() + "",
               `Color({ "red": 0, "green": 0, "blue": 0, "alpha": null })`)

  assert.throws(_ => Color({alpha: -10}),
                /"-10" is not nully/)
  assert.throws(_ => Color({alpha: -10}),
                /of Typed.Number.Range\(0\.\.100\) type/)

  assert.equal(Color({alpha: 20}) + "",
               `Color({ "red": 0, "green": 0, "blue": 0, "alpha": 20 })`)

})

test("Union type", assert => {
  const Status = Record({
    readyState: Union(Number, String)
  })


  assert.throws(_ => Status(),
                /"undefined" does not satisfy Union\(Number, String\)/)

  assert.equal(Status({readyState: "loading"}).toString(),
               `Typed.Record({readyState: Union(Number, String)})({ "readyState": "loading" })`)

})
