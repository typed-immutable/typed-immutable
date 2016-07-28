import test from "./test"
import * as Immutable from "immutable"
import {Map} from "../map"
import {List} from "../list"
import {Any, Typed, Union, Maybe} from "../typed"

const ListAny = List(Any)
const NumberToString = Map(Number, String)
const NumberToNumber = Map(Number, Number)
const StringToNumber = Map(String, Number)
const StringToString = Map(String, String)

test("typed map creation", assert => {

  assert.throws(_ => Map(),
                /Typed.Map must be passed a key type descriptor/)

  assert.throws(_ => Map({}),
                /Typed.Map must be passed a value type descriptor/)
})


test("any => any", assert => {

  assert.equals(Map(Any, Any), Immutable.Map)

})

test("converts from object", assert => {
  const m = StringToNumber({'a': 1, 'b': 2, 'c': 3})
  assert.equals(m.size, 3)
  assert.equals(m.get('a'), 1)
  assert.equals(m.get('b'), 2)
  assert.equals(m.get('c'), 3)

})

test("constructor provides initial values as array of entries", assert => {
  const m = NumberToString([[1, 'a'],[2, 'b',],[3, 'c']])
  assert.equals(m.size, 3)
  assert.equals(m.get(1), 'a')
  assert.equals(m.get(2), 'b')
  assert.equals(m.get(3), 'c')
})


test('constructor provides initial values as sequence', assert => {
  var s = Immutable.Seq({'a': 1, 'b': 2, 'c': 3})
  var m = StringToNumber(s)
  assert.equals(m.size, 3)
  assert.equals(m.get('a'), 1)
  assert.equals(m.get('b'), 2)
  assert.equals(m.get('c'), 3)
})

test('constructor provides initial values as list of lists', assert => {
  var l = ListAny.of(
    ListAny(['a', 1]),
    ListAny(['b', 2]),
    ListAny(['c', 3])
  )
  var m = StringToNumber(l)
  assert.equals(m.size, 3)
  assert.equals(m.get('a'), 1)
  assert.equals(m.get('b'), 2)
  assert.equals(m.get('c'), 3)
})


test("toString on typed map", assert => {
  const numberToString = NumberToString([[1, "Item1"], [2, "Item2"]])
  const numberToNumber = NumberToNumber([[0, 1], [2, 3]])
  const stringToNumber = StringToNumber([["Item1", 1], ["Item2", 2]])

  assert.equal(numberToString.toString(),
               `Typed.Map(Number, String)({ 1: "Item1", 2: "Item2" })`)

  assert.equal(numberToNumber.toString(),
               `Typed.Map(Number, Number)({ 0: 1, 2: 3 })`)

  assert.equal(stringToNumber.toString(),
               `Typed.Map(String, Number)({ "Item1": 1, "Item2": 2 })`)
})


test('constructor is identity when provided map', assert => {
  var m1 = StringToNumber({'a': 1, 'b': 1, 'c': 1})
  var m2 = StringToNumber(m1)
  assert.equal(m1, m2)
})

test('does not accept a scalar', assert => {
  assert.throws(_ => StringToNumber(3), /Expected Array or iterable object of \[k, v\] entries, or keyed object: 3/)
})

test('does not accept strings (iterable, but scalar)', assert => {
  assert.throws(() => StringToNumber('abc'))
})

test('does not accept non-entries array', assert => {
  assert.throws(() => StringToNumber([1,'a', 2]))
})

test('accepts non-iterable array-like objects as keyed collections', assert => {
  var m = StringToNumber({ 'length': 3, '1': 1 })
  assert.equal(m.get('length'), 3)
  assert.equal(m.get('1'), 1)
  assert.deepEqual(m.toJS(), { 'length': 3, '1': 1 })
})

test('accepts flattened pairs via of()', assert => {
  var m = NumberToString.of(1, 'a', 2, 'b', 3, 'c')
  assert.equal(m.size, 3)
  assert.equal(m.get(1), 'a')
  assert.equal(m.get(2), 'b')
  assert.equal(m.get(3), 'c')
})

test('does not accept mismatched flattened pairs via of()', assert => {
  assert.throws(() => NumberToString.of(1, 'a', 2), /Missing value for key: 2/)
})

test('converts back to JS object', assert => {
  var m = StringToNumber({'a': 1, 'b': 2, 'c': 3})
  assert.deepEqual(m.toObject(), {'a': 1, 'b': 2, 'c': 3})
})

test('iterates values', assert => {
  const m = StringToNumber({'a': 1, 'b': 2, 'c': 3})
  var calls = []
  var iterator = (v, k) => calls.push([v, k])
  m.forEach(iterator)
  assert.deepEqual(calls, [
    [1, 'a'],
    [2, 'b'],
    [3, 'c']
  ])
})

test('merges two maps', assert => {
  var m1 = StringToNumber({'a': 1, 'b': 2, 'c': 3})
  var m2 = StringToNumber({'wow': 13, 'd': 5, 'b': 66})
  var m3 = m1.merge(m2)
  assert.deepEqual(m3.toObject(), {
    'a': 1, 'b': 2, 'c': 3,
    'wow': 13, 'd': 5, 'b': 66
  })
})


test('is persistent to sets', assert => {
  var m1 = StringToString()
  var m2 = m1.set('a', 'Aardvark')
  var m3 = m2.set('b', 'Baboon')
  var m4 = m3.set('c', 'Canary')
  var m5 = m4.set('b', 'Bonobo')
  assert.equals(m1.size, 0)
  assert.equals(m2.size, 1)
  assert.equals(m3.size, 2)
  assert.equals(m4.size, 3)
  assert.equals(m5.size, 3)
  assert.equals(m3.get('b'), 'Baboon')
  assert.equals(m5.get('b'), 'Bonobo')
})

test('is persistent to deletes', assert => {
  var m1 = StringToString()
  var m2 = m1.set('a', 'Aardvark')
  var m3 = m2.set('b', 'Baboon')
  var m4 = m3.set('c', 'Canary')
  var m5 = m4.remove('b')
  assert.equals(m1.size, 0)
  assert.equals(m2.size, 1)
  assert.equals(m3.size, 2)
  assert.equals(m4.size, 3)
  assert.equals(m5.size, 2)
  assert.equals(m3.has('b'), true)
  assert.equals(m3.get('b'), 'Baboon')
  assert.equals(m5.has('b'), false)
  assert.equals(m5.get('b'), undefined)
  assert.equals(m5.get('c'), 'Canary')
})

test('is persistent to setIn', assert => {
  var m1 = StringToString({a: 'a', b: 'b'})
  const StringToMap = Map(String, StringToString)
  var m2 = StringToMap({level1: m1})
  var m3 = m2.setIn(['level1', 'a'], 'AA')
  var m4 = m3.setIn(['level1', 'a'], 'BB')
  assert.throws(() => m2.setIn(['level1', 'a'], 5))
  assert.throws(() => m2.setIn(['level1', 5], 'a'))
  assert.throws(() => m2.setIn([1, 'a'], 'a'))
  assert.deepEquals(m3.toJS(), {level1: {a: 'AA', b: 'b'}})
  assert.deepEquals(m4.toJS(), {level1: {a: 'BB', b: 'b'}})
})

test('is persistent to updateIn', assert => {
  var m1 = StringToString({a: 'a', b: 'b'})
  const StringToMap = Map(String, StringToString)
  var m2 = StringToMap({level1: m1})
  var m3 = m2.updateIn(['level1', 'a'], c => c+c)
  var m4 = m3.updateIn(['level1', 'a'], c => c+c)
  assert.throws(() => m2.updateIn(['level1', 'a'], 5))
  assert.throws(() => m2.updateIn(['level1', 5], 'a'))
  assert.throws(() => m2.updateIn([1, 'a'], 'a'))
  assert.deepEquals(m1.toJS(), {a: 'a', b: 'b'})
  assert.deepEquals(m2.toJS(), {level1: {a: 'a', b: 'b'}})
  assert.deepEquals(m3.toJS(), {level1: {a: 'aa', b: 'b'}})
  assert.deepEquals(m4.toJS(), {level1: {a: 'aaaa', b: 'b'}})
})


test('can map many items', assert => {
  var m = StringToNumber()
  for (var ii = 0; ii < 2000; ii++) {
     m = m.set('thing:' + ii, ii)
  }
  assert.equals(m.size, 2000)
  assert.equals(m.get('thing:1234'), 1234)
})

test('maps values', assert => {
  var m = StringToString({a:'a', b:'b', c:'c'})
  var r = m.map(value => value.toUpperCase())
  assert.deepEquals(r.toObject(), {a:'A', b:'B', c:'C'})
  assert.deepEquals(m.toObject(), {a:'a', b:'b', c:'c'})
})

test('maps values but changes types', assert => {
  var m = StringToString({a:'a', b:'b', c:'c'})
  assert.throws(() => m.map(value => value.charCodeAt(0)), /is not a string/)
})


test('maps keys', assert => {
  var m = StringToString({a:'a', b:'b', c:'c'})
  var r = m.mapKeys(key => key.toUpperCase())
  assert.deepEquals(r.toObject(), {A:'a', B:'b', C:'c'})
  assert.deepEquals(m.toObject(), {a:'a', b:'b', c:'c'})
})

test('maps keys changes types', assert => {
  var m = StringToString({a:'a', b:'b', c:'c'})
  assert.throws(() => m.mapKeys(key => key.charCodeAt(0), /is not a string/))
})


test('filters values', assert => {
  var m = StringToNumber({a:1, b:2, c:3, d:4, e:5, f:6})
  var r = m.filter(value => value % 2 === 1)
  assert.deepEquals(r.toObject(), {a:1, c:3, e:5})
  assert.deepEquals(m.toObject(), {a:1, b: 2, c:3, d:4, e:5, f:6})
})

test('filterNots values', assert => {
  var m = StringToNumber({a:1, b:2, c:3, d:4, e:5, f:6})
  var r = m.filterNot(value => value % 2 === 1)
  assert.deepEqual(r.toObject(), {b:2, d:4, f:6})
  assert.deepEquals(m.toObject(), {a:1, b: 2, c:3, d:4, e:5, f:6})
})


test('derives keys', assert => {
  var v = StringToNumber({a:1, b:2, c:3, d:4, e:5, f:6})
  assert.deepEquals(v.keySeq().toArray(), ['a', 'b', 'c', 'd', 'e', 'f'])
})

test('flips keys and values', assert => {
  var v = StringToString({a:'1', b:'2', c:'3', d:'4', e:'5', f:'6'})
  assert.deepEquals(v.flip().toObject(), {'1':'a', '2':'b', '3':'c', '4':'d', '5':'e', '6':'f'})
})

test('can convert to a list', assert => {
  var m = StringToNumber({a:1, b:2, c:3})
  var v = m.toList()
  var k = m.keySeq().toList()
  assert.equals(v.size, 3)
  assert.equals(k.size, 3)
  // Note: Map has undefined ordering, this List may not be the same
  // order as the order you set into the Map.
  assert.equals(v.get(1), 2)
  assert.equals(k.get(1), 'b')
})

test('sets', assert => {
  var map = StringToNumber()
  var len = 100
  for (var ii = 0; ii < len; ii++) {
    assert.equals(map.size, ii)
    map = map.set(''+ii, ii)
    assert.throws(() => map.set(ii, ii))
    assert.throws(() => map.set(''+ii, ''+ii))
  }
  assert.equals(map.size, len)
  assert.equals(Immutable.is(map.toSet(), Immutable.Range(0, len).toSet()), true)
})

test('allows chained mutations', assert => {
  var m1 = StringToNumber()
  var m2 = m1.set('a', 1)
  var m3 = m2.withMutations(m => m.set('b', 2).set('c', 3))
  var m4 = m3.set('d', 4)
  assert.throws(() => m2.withMutations(m => m.set('b', 'b')))
  assert.throws(() => m2.withMutations(m => m.set(2, 2)))

  assert.deepEquals(m1.toObject(), {})
  assert.deepEquals(m2.toObject(), {'a':1})
  assert.deepEquals(m3.toObject(), {'a': 1, 'b': 2, 'c': 3})
  assert.deepEquals(m4.toObject(), {'a': 1, 'b': 2, 'c': 3, 'd': 4})
})

test('expresses value equality with unordered sequences', assert => {
  var m1 = StringToNumber({ A: 1, B: 2, C: 3 })
  var m2 = StringToNumber({ C: 3, B: 2, A: 1 })
  assert.equals(Immutable.is(m1, m2), true)
})
