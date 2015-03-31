import {Typed} from "./core"
import {Reader} from "./reader"
import * as Immutable from 'immutable'

const {Keyed} = Immutable.Iterable
const {Seq, List} = Immutable

const $store = Typed.store
const $construct = Typed.construct
const $readers = Typed.readers
const $read = Typed.read
const $step = Typed.step
const $init = Typed.init
const $result = Typed.result
const $label = Typed.label

const LazyGet = key => function() {
  var value = this.get(key)
  Object.defineProperty(this, key, {value: value})
  return value
}

class TypedTuple extends Typed.Iterable.Indexed {
  constructor() {}
  [Typed.read](structure) {
    const seq = Seq(structure)
    const readers = this[$readers]

    let record
    for (let key in readers) {
      const reader = readers[key]
      const value = seq.get(key)
      const result = reader[$read](value)

      if (result instanceof TypeError) {
        return TypeError(`Invalid value for ${key} field: ${result.message}`)
      }

      record = this[$step](record || this[$init](), [key, result])
    }

    return this[$result](record)
  }
  [Typed.step](result, [key, value]) {
    const store = result[$store] ? result[$store].set(key, value) :
                  List.of(value)

    const record = result.__ownerID ? result : result[$construct]
    record[$store] = store

    return record
  }

  toTypeSignature() {
    const readers = this[$readers]
    const body = []
    for (let key in readers) {
      body.push(`${readers[key].toTypeName()}`)
    }

    return `Typed.Tuple(${body.join(', ')})`
  }

  toTypeName() {
    return this[$label] || this.toTypeSignature()
  }

  toString() {
    return this.__toString(this.toTypeName() + '(', ')')
  }

  has(key) {
    return !!this[$readers][key]
  }

  get(key, defaultValue) {
    return !this[$readers][key] ? defaultValue :
           !this[$store] ? defaultValue :
           this[$store].get(key, defaultValue);
  }

  remove(key) {
    return this[$readers][key] ? this.set(key, void(0)) : this
  }

  set(key, value) {
    const reader = this[$readres][key]

    if (!reader) {
      throw TypeError(`Cannot set unknown field "${key}" on "${this.typeName()}"`)
    }

    const result = reader[$read](value)

    if (result instanceof TypeError) {
      throw TypeError(`Invalid value for ${key} field: ${result.message}`)
    }

    return this[$step](this, [key, result])
  }
  __iterator(type, reverse) {
    return Keyed(this[$readers]).map((_, key) => this.get(key)).__iterator(type, reverse);
  }

  __iterate(f, reverse) {
    return Keyed(this[$readers]).map((_, key) => this.get(key)).__iterate(f, reverse);
  }
}

export const Tuple = function(...types) {
  const readers = Object.create(null)
  const size = types.length

  if (size > 0) {
    const properties = {
      size: {value: size},
      length: {value: size},
      [$readers]: {value: readers},
      [$label]: {value: null}
    }

    let index = 0
    while (index < size) {
      const reader = Reader.for(types[index])

      if (reader) {
        readers[index] = reader
        properties[index] = {get: LazyGet(index)}
      } else {
        throw TypeError(`Invalid descriptor for the "${index}" field`)
      }

      index = index + 1
    }

    const TupleType = function(...structures) {
      const result = TupleType.prototype[$read](structures)

      if (result instanceof TypeError) {
        throw result
      }

      return result
    }

    properties.constructor = {value: TupleType}
    TupleType.prototype = Object.create(TypedTuple.prototype, properties)

    return TupleType
  } else {
    throw TypeError(`Typed.Tuple must be passed at least on field descriptor`)
  }
}
