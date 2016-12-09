import * as Immutable from 'immutable'

import test from './test'
import {Record} from '../record'


test('can use Immutable.js objects in records', assert => {
  var X = Record({
    a: new Immutable.Map({foo: 'bar'}),
  })

  var x1 = new X()
  assert.equals(x1.a.get('foo'), 'bar')
  assert.equals(x1.a.get('baz'), undefined)
  assert.equals(x1.a.get('baz', 'bacon'), 'bacon')

  var x2 = new X({
    a: new Immutable.Map({spam: 'eggs'}),
  })
  assert.equals(x2.a.get('spam'), 'eggs')
  assert.equals(x2.a.get('foo'), undefined)
  assert.equals(x2.a.get('baz', 'bacon'), 'bacon')

  var x3 = new X({
    a: {spam: 'eggs'},
  })
  assert.equals(x3.a instanceof Immutable.Map, true)
  assert.equals(x3.a.get('spam'), 'eggs')
  assert.equals(x3.a.get('foo'), undefined)
  assert.equals(x3.a.get('baz', 'bacon'), 'bacon')
})


test('can use Immutable.js classes in records', assert => {
  var X = Record({
    a: Immutable.Map,
  })

  assert.throws(_ => {
    var x1 = new X()
  })

  var x2 = new X({
    a: new Immutable.Map({spam: 'eggs'}),
  })
  assert.equals(x2.a.get('spam'), 'eggs')
  assert.equals(x2.a.get('foo'), undefined)
  assert.equals(x2.a.get('baz', 'bacon'), 'bacon')

  var x3 = new X({
    a: {spam: 'eggs'},
  })
  assert.equals(x3.a instanceof Immutable.Map, true)
  assert.equals(x3.a.get('spam'), 'eggs')
  assert.equals(x3.a.get('foo'), undefined)
  assert.equals(x3.a.get('baz', 'bacon'), 'bacon')
})


test('sets work too', assert => {
  var Y = Record({s: new Immutable.Set(['foo'])})
  assert.equals(new Y().s.has('foo'), true)
  assert.equals(new Y().s.has('bar'), false)

  var y2 = new Y({s: ['foo', 'bar', 'baz']})
  assert.equals(y2.s.has('baz'), true)

  assert.throws(() => { var y3 = new Y({s: null}) })
})
