import {Typed, typeOf, construct} from "./typed"
import {Seq, Iterable, Map} from 'immutable'

const {Keyed} = Iterable

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
const $type = Typed.type
const $step = Typed.step
const $init = Typed.init
const $result = Typed.result
const $read = Typed.read
const $label = Typed.label
const $empty = Typed.empty
const $typeName = Typed.typeName
const $typeSignature = Typed.typeSignature

class TypedRecord extends Iterable.Keyed {
  constructor() {}
  [Typed.init]() {
    return construct(this).asMutable()
  }
  [Typed.result](result) {
    return result.asImmutable()
  }

  [Typed.read](structure={}) {
    const Type = this.constructor

    if (structure instanceof Type && structure.constructor === Type) {
      return structure
    }

    if (!structure || typeof(structure) !== "object") {
      return TypeError(`Invalid data structure "${structure}" was passed to ${this[$typeName]()}`)
    }

    const seq = Seq(structure)
    const type = this[$type]

    let record
    for (let key in type) {
      const fieldType = type[key]
      const value = seq.has(key) ? seq.get(key) : this.get(key)
      const result = fieldType[$read](value)

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

    const record = result.__ownerID ? result : construct(result)
    record[$store] = store

    return record
  }

  [Typed.typeSignature]() {
    const type = this[$type]
    const body = []
    for (let key in type) {
      body.push(`${key}: ${type[key][$typeName]()}`)
    }

    return `Typed.Record({${body.join(', ')}})`
  }

  [Typed.typeName]() {
    return this[$label] || this[$typeSignature]()
  }

  toString() {
    return this.__toString(this[$typeName]() + '({', '})')
  }

  has(key) {
    return !!this[$type][key]
  }

  get(key, defaultValue) {
    return !this[$type][key] ? defaultValue :
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
    return this[$type][key] ? this.set(key, void(0)) : this
  }

  set(key, value) {
    const fieldType = this[$type][key]

    if (!fieldType) {
      throw TypeError(`Cannot set unknown field "${key}" on "${this[$typeName]()}"`)
    }

    const result = fieldType[$read](value)

    if (result instanceof TypeError) {
      throw TypeError(`Invalid value for ${key} field: ${result.message}`)
    }

    return this[$step](this, [key, result])
  }
  __iterator(type, reverse) {
    return Keyed(this[$type]).map((_, key) => this.get(key)).__iterator(type, reverse);
  }

  __iterate(f, reverse) {
    return Keyed(this[$type]).map((_, key) => this.get(key)).__iterate(f, reverse);
  }

  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }

    const store = this[$store] && this[$store].__ensureOwner(ownerID)
    const result = !ownerID ? this : construct(this)

    result.__ownerID = ownerID
    result[$store] = store
    return result
  }
  wasAltered() {
    return this[$store].wasAltered()
  }
}

export const Record = function(descriptor, label) {
  if (descriptor && typeof(descriptor) === "object") {
    const type = Object.create(null)
    const keys = Object.keys(descriptor)
    const size = keys.length

    if (size > 0) {
      const properties = {
        size: {value: size},
        [$type]: {value: type},
        [$label]: {value: label}
      }

      let index = 0
      while (index < size) {
        const key = keys[index]
        const fieldType = typeOf(descriptor[key])

        if (fieldType) {
          type[key] = fieldType
          properties[key] = {get:Getter(key), set:Setter(key), enumerable: true}
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

        const type = constructor.prototype
        const result = type[$read](structure)

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
      RecordType.prototype = Object.create(RecordPrototype, properties)
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
const RecordPrototype = TypedRecord.prototype


RecordPrototype[Typed.DELETE] = RecordPrototype.remove

// Large part of the Record API is implemented by Immutabel.Map
// and is just copied over.
RecordPrototype.deleteIn = Map.prototype.deleteIn
RecordPrototype.removeIn = Map.prototype.removeIn
RecordPrototype.merge = Map.prototype.merge
RecordPrototype.mergeWith = Map.prototype.mergeWith
RecordPrototype.mergeIn = Map.prototype.mergeIn
RecordPrototype.mergeDeep = Map.prototype.mergeDeep
RecordPrototype.mergeDeepWith = Map.prototype.mergeDeepWith
RecordPrototype.mergeDeepIn = Map.prototype.mergeDeepIn
RecordPrototype.setIn = Map.prototype.setIn
RecordPrototype.update = Map.prototype.update
RecordPrototype.updateIn = Map.prototype.updateIn
RecordPrototype.withMutations = Map.prototype.withMutations
RecordPrototype.asMutable = Map.prototype.asMutable
RecordPrototype.asImmutable = Map.prototype.asImmutable

// Large chuck of API inherited from Iterable does not makes
// much sense in the context of records so we undefine it.
RecordPrototype.map = void(0)
RecordPrototype.filter = void(0)
RecordPrototype.filterNot = void(0)
RecordPrototype.flip = void(0)
RecordPrototype.mapKeys = void(0)
RecordPrototype.mapEntries = void(0)
RecordPrototype.sort = void(0)
RecordPrototype.sortBy = void(0)
RecordPrototype.reverse = void(0)
RecordPrototype.slice = void(0)
RecordPrototype.butLast = void(0)
RecordPrototype.flatMap = void(0)
RecordPrototype.flatten = void(0)
RecordPrototype.rest = void(0)
RecordPrototype.skip = void(0)
RecordPrototype.skipLast = void(0)
RecordPrototype.skipWhile = void(0)
RecordPrototype.skipUntil = void(0)
RecordPrototype.sortBy = void(0)
RecordPrototype.take = void(0)
RecordPrototype.takeLast = void(0)
RecordPrototype.takeWhile = void(0)
RecordPrototype.takeUntil = void(0)
