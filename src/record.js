import {Typed} from "./core"
import {Reader} from "./reader"
import * as Immutable from 'immutable'

const {Keyed} = Immutable.Iterable
const {Seq, Map} = Immutable

const Getter = key => function() {
  return this.get(key)
}

const Setter = key => function(value) {
  if (!this.__ownerID) {
    throw TypeError("Cannot set on an immutable record.")
  }
  this.set(key, value)
}


const $store = Typed.store
const $construct = Typed.construct
const $readers = Typed.readers
const $read = Typed.read
const $step = Typed.step
const $init = Typed.init
const $result = Typed.result
const $label = Typed.label
const $empty = Typed.empty

class TypedRecord extends Typed.Iterable.Keyed {
  constructor() {}
  [Typed.read](structure={}) {
    if (!structure || typeof(structure) !== "object") {
      return TypeError(`Invalid data structure "${structure}" was passed to ${this.toTypeName()}`)
    }

    const seq = Seq(structure)
    const readers = this[$readers]

    let record
    for (let key in readers) {
      const reader = readers[key]
      const value = seq.has(key) ? seq.get(key) : this.get(key)
      const result = reader[$read](value)

      if (result instanceof TypeError) {
        return TypeError(`Invalid value for "${key}" field:\n ${result.message}`)
      }

      record = this[$step](record || this[$init](), [key, result])
    }

    return this[$result](record)
  }
  [Typed.step](result, [key, value]) {
    const store = result[$store] ? result[$store].set(key, value) :
                  new Map([[key, value]])

    const record = result.__ownerID ? result : result[$construct]()
    record[$store] = store

    return record
  }

  toTypeSignature() {
    const readers = this[$readers]
    const body = []
    for (let key in readers) {
      body.push(`${key}: ${readers[key].toTypeName()}`)
    }

    return `Typed.Record({${body.join(', ')}})`
  }

  toTypeName() {
    return this[$label] || this.toTypeSignature()
  }

  toString() {
    return this.__toString(this.toTypeName() + '({', '})')
  }

  has(key) {
    return !!this[$readers][key]
  }

  get(key, defaultValue) {
    return !this[$readers][key] ? defaultValue :
           !this[$store] ? defaultValue :
           this[$store].get(key, defaultValue);
  }

  clear() {
    if (this.__ownerID) {
      this[$store] && this[$store].clear()
      return this
    }

    const RecordType = this.constructor
    return this[$empty] ||
           (RecordType[$empty] = new RecordType())
  }

  remove(key) {
    return this[$readers][key] ? this.set(key, void(0)) : this
  }

  set(key, value) {
    const reader = this[$readers][key]

    if (!reader) {
      throw TypeError(`Cannot set unknown field "${key}" on "${this.toTypeName()}"`)
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

export const Record = function(descriptor, label) {
  if (descriptor && typeof(descriptor) === "object") {
    const readers = Object.create(null)
    const keys = Object.keys(descriptor)
    const size = keys.length

    if (size > 0) {
      const properties = {
        size: {value: size},
        [$readers]: {value: readers},
        [$label]: {value: label}
      }

      let index = 0
      while (index < size) {
        const key = keys[index]
        const reader = Reader.for(descriptor[key])

        if (reader) {
          readers[key] = reader
          properties[key] = {get:Getter(key), set:Setter(key)}
        } else {
          throw TypeError(`Invalid field descriptor provided for a "${key}" field`)
        }

        index = index + 1
      }

      const RecordType = function(structure) {
        const isNew = this instanceof RecordType
        const constructor = isNew ? this.constructor : RecordType

        if (structure instanceof constructor) {
          return structure
        }

        const result = constructor.prototype[$read](structure)

        if (result instanceof TypeError) {
          throw result
        }

        if (isNew) {
          this[$store] = result[$store]
        } else {
          return result
        }
      }

      properties.constructor = {value: RecordType}
      RecordType.prototype = Object.create(TypedRecordPrototype, properties)
      const prototype = RecordType.prototype

      return RecordType
    } else {
      throw TypeError(`Typed.Record descriptor must define at least on field`)
    }
  } else {
    throw TypeError(`Typed.Record must be passed a descriptor of fields`)
  }
}
Record.Type = TypedRecord
Record.prototype = TypedRecord.prototype
const TypedRecordPrototype = TypedRecord.prototype
