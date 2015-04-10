import {Typed, Type, Union, Any, typeOf, construct} from "./typed"
import * as Immutable from 'immutable'


const ImmutableMap = Immutable.Map
const {Keyed} = Immutable.Iterable

const $store = Typed.store
const $type = Typed.type
const $read = Typed.read
const $step = Typed.step
const $init = Typed.init
const $result = Typed.result
const $label = Typed.label
const $typeName = Typed.typeName
const $empty = Typed.empty

class EntryType extends Type {
  constructor(key, value, label) {
    this.key = key
    this.value = value
    this.label = label
  }
  [Typed.typeName]() {
    return this.label ||
           `${this.key[$typeName]()}, ${this.value[$typeName]()}`
  }
  [Typed.read]([key, value]) {
    const keyResult = this.key[$read](key)
    if (keyResult instanceof TypeError) {
      return TypeError(`Invalid key: ${keyResult.message}`)
    }

    const valueResult = this.value[$read](value)
    if (valueResult instanceof TypeError) {
      return TypeError(`Invalid value: ${valueResult.message}`)
    }

    return [keyResult, valueResult]
  }
}

class InferredEntryType extends EntryType {
  constructor() {
    this.key = null
    this.value = null
  }
  toStatic() {
    return new MapEntryType(this.key, this.value)
  }
  [Typed.typeName]() {
    const key = this.key ? this.key[$typeName]() : "TypeInferred"
    const value = this.value ? this.value[$typeName]() : "TypeInferred"
    return `${key}, ${value}`
  }
  [Typed.read](entry) {
    // typeOf usually creates type for the value with that
    // value being a default. For type inference we should
    // actually use a base type instead of type with default
    // there for we use prototype of the constructor.
    const key = typeOf(entry[0]).constructor.prototype
    this.key = this.key ? Union(this.key, key) : key

    const value = typeOf(entry[1]).constructor.prototype
    this.value = this.value ? Union(this.value, value) : value

    return entry
  }
}

class TypedMap extends Immutable.Map {
  constructor(value) {
    return TypedMap.prototype[$read](value)
  }
  advance(store) {
    const result = store.__ownerID ? this : construct(this)
    result[$store] = store
    result.size = store.size
    result.__ownerID = store.__ownerID
    return result
  }
  [Typed.init]() {
    return this.advance(ImmutableMap()).asMutable()
  }
  [Typed.step](state, entry) {
    const result = this[$type][$read](entry)

    if (result instanceof TypeError) {
      throw result
    }

    const [key, value] = result
    return state.advance(state[$store].set(key, value))
  }
  [Typed.result](state) {
    return state.asImmutable()
  }

  [Typed.read](structure) {
    const constructor = this.constructor

    if (structure === null || structure === void(0)) {
      if (!this[$empty]) {
        this[$empty] = this.advance(ImmutableMap())
      }

      return this[$empty]
    }

    const isInstance = structure instanceof constructor &&
                       structure.constructor === constructor

    if (isInstance) {
      return structure
    }


    const entries = Keyed(structure).entries()
    const type = this[$type]
    let state = this[$init]()

    while (true) {
      const {done, value: entry} = entries.next()

      if (done) {
        break
      }

      const result = type[$read](entry)

      if (result instanceof TypeError) {
        return result
      }

      state = state[$step](state, result)
    }

    return this[$result](state)
  }

  [Typed.typeName]() {
    return this[$label] || `Typed.Map(${this[$type][$typeName]()})`
  }

  toString() {
    return this.__toString(this[$typeName]() + '({', '})')
  }

  has(key) {
    return this[$store].has(key)
  }

  get(key, fallback) {
    return this[$store].get(key, fallback)
  }

  clear() {
    if (this.size === 0) {
      return this
    }

    if (this.__ownerID) {
      return this.advance(this[$store].clear())
    }

    return this[$empty] || this[$read]()
  }

  remove(key) {
    return this.advance(this[$store].remove(key))
  }

  set(key, value) {
    return this[$step](this, [key, value])
  }

  wasAltered() {
    return this[$store].wasAltered()
  }

  __ensureOwner(ownerID) {
    const result = this.__ownerID === ownerID ? this :
                   !ownerID ? this :
                   construct(this)

    const store = this[$store].__ensureOwner(ownerID)
    result[$store] = store
    result.size = store.size
    result.__ownerID = ownerID

    return result
  }
  __iterator(type, reverse) {
    this[$store].__iterator(type, reverse)
  }

  __iterate(f, reverse) {
    this[$store].__iterate(f, reverse)
  }
}
TypedMap.prototype[Typed.DELETE] = TypedMap.prototype.remove

class TypeInferredMap extends TypedMap {
  constructor() {}
  [Typed.init]() {
    const result = this.advance(ImmutableMap()).asMutable()
    result[$type] = new InferredEntryType()
    return result
  }
  [Typed.result](state) {
    const result = state.asImmutable()
    result[$type] = state[$type].toStatic()

    return result
  }
}

export const Map = function(keyDescriptor, valueDescriptor, label) {
  if (keyDescriptor === void(0)) {
    throw TypeError("Typed.Map must be passed a key type descriptor")
  }

  if (valueDescriptor === void(0)) {
    throw TypeError("Typed.Map must be passed a value type descriptor")
  }

  // If both key and value types are Any this is just a plain immutable map.
  if (keyDescriptor === Any && valueDescriptor === Any) {
    return ImmutableMap
  }

  const keyType = typeOf(keyDescriptor)
  const valueType = typeOf(valueDescriptor)

  if (keyType === Any && keyDescriptor !== Any) {
    throw TypeError(`Typed.Map was passed an invalid key type descriptor: ${keyDescriptor}`)
  }

  if (valueType === Any && valueDescriptor !== Any) {
    throw TypeError(`Typed.Map was passed an invalid value type descriptor: ${valueDescriptor}`)
  }

  const type = new EntryType(keyType, valueType, label)

  const MapType = function(value) {
    const isThis = this instanceof MapType
    const constructor = isThis ? this.constructor : MapType

    if (value instanceof constructor) {
      return value
    }

    const result = constructor.prototype[$read](value)

    if (result instanceof TypeError) {
      throw result
    }

    const isCall = isThis && construct.prototype === this

    if (!isCall && isThis) {
      this[$store] = result[$store]
      this.size = result.size
    } else {
      return result
    }

    return this
  }
  MapType.prototype = Object.create(MapPrototype, {
    constructor: {value: MapType},
    [$type]: {value: type},
    [$label]: {value: label}
  })

  return MapType
}
Map.Type = TypedMap
Map.prototype = TypedMap.prototype
const MapPrototype = Map.prototype


