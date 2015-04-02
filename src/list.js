import {Typed} from "./core"
import {Reader} from "./reader"
import * as Immutable from 'immutable'


const ImmutableList = Immutable.List
const {Indexed} = Immutable.Iterable

const $store = Typed.store
const $construct = Typed.construct
const $reader = Typed.reader
const $read = Typed.read
const $step = Typed.step
const $init = Typed.init
const $result = Typed.result
const $label = Typed.label
const $empty = Typed.empty


const change = (list, f) => {
  const result = list.__ownerID ? list : list[$construct]()
  const store = f(list[$store])
  result[$store] = store
  result.size = store.size
  return result
}

const clear = target => target.clear()
const pop = target => target.pop()
const shift = target => target.shift()

class TypedList extends Immutable.List {
  constructor() {}
  [Typed.construct]() {
    return Object.create(this.constructor.prototype)
  }
  [Typed.init]() {
    return this[$construct]().asMutable()
  }
  [Typed.result](result) {
    return result.asImmutable()
  }

  [Typed.read](input) {
    if (input === null || input === void(0)) {
      const Type = this.constructor

      if (!Type[$empty]) {
        const result = this[$construct]()
        result[$store] = ImmutableList()
        result.size = 0
        Type[$empty] = result
      }

      return Type[$empty]
    }

    const list = this[$init]()
    Indexed(input).forEach((value, index) => {
      list.set(index, value)
    })

    return this[$result](list)
  }
  [Typed.step](result, [key, value]) {
    return change(result, (store=ImmutableList()) => store.set(key, value))
  }

  toTypeSignature() {
    const reader = this[$reader]
    return `Typed.List(${reader.toTypeName()})`
  }

  toTypeName() {
    return this[$label] || this.toTypeSignature()
  }

  toString() {
    return this.__toString(this.toTypeName() + '([', '])')
  }

  has(key) {
    return this[$store].has(key)
  }

  get(index, notSetValue) {
    return this[$store] ? this[$store].get(index, notSetValue) :
           notSetValue
  }

  clear() {
    if (this.__ownerID) {
      return change(this, clear)
    }

    return this[$empty] || this[$read]()
  }

  remove(index) {
    return change(this, store => store && store.remove(index))
  }

  set(index, value) {
    if (index > this.size) {
      throw TypeError(`Index "${index}" is out of bound`)
    }

    const result = this[$reader][$read](value)

    if (result instanceof TypeError) {
      throw TypeError(`Invalid value: ${result.message}`)
    }

    return this[$step](this, [index, result])
  }

  push(...values) {
    const reader = this[$reader]
    const items = []
    for (let value of values) {
      const result = reader[$read](value)

      if (result instanceof TypeError) {
        throw TypeError(`Invalid value: ${result.message}`)
      }

      items.push(result)
    }

    return change(this, store =>
      store ? store.push(...items) : ImmutableList(...items))
  }
  pop() {
    return change(this, pop)
  }
  unshift(...values) {
    const reader = this[$reader]
    const items = []
    for (let value of values) {
      const result = reader[$read](value)

      if (result instanceof TypeError) {
        throw TypeError(`Invalid value: ${result.message}`)
      }

      items.push(result)
    }

    return change(this, store =>
      store ? store.unshift(...items) : ImmutableList(...items))
  }
  shift() {
    return change(this, shift)
  }
  setSize(size) {
    if (size > this.size) {
      throw TypeError(`setSize may only downsize`)
    }

    return change(this, store => store.setSize(size))
  }
  slice(begin, end) {
    return change(this, store => store && store.slice(begin, end))
  }

  wasAltered() {
    return this[$store].wasAltered()
  }

  __ensureOwner(ownerID) {
    const result = this.__ownerID === ownerID ? this :
                   !ownerID ? this :
                   this[$construct]()

    result.__ownerID = ownerID
    result[$store] = this[$store] ? this[$store].__ensureOwner(ownerID) :
                     ImmutableList().__ensureOwner(ownerID)

    return result
  }
  __iterator(type, reverse) {
    return Indexed(this[$store]).map((_, key) => this.get(key)).__iterator(type, reverse)
  }

  __iterate(f, reverse) {
    return Indexed(this[$store]).map((_, key) => this.get(key)).__iterate(f, reverse)
  }
}

export const List = function(type, label) {
  const reader = Reader.for(type)
  if (reader) {
    const ListType = function(value) {
      const isListType = this instanceof ListType
      const Type = isListType ? this.constructor : ListType

      if (value instanceof Type) {
        return value
      }

      const result = Type.prototype[$read](value)

      if (result instanceof TypeError) {
        throw result
      }

      // `list.map(f)` will in fact cause `list.constructor(items)` to be
      // invoked there for we need to check if `this[$store]` was
      // assigned to know if it's that or if it's a `new ListType()` call.
      if (isListType && !this[$store]) {
        this[$store] = result[$store]
      } else {
        return result
      }

      return this
    }
    ListType.of = ImmutableList.of
    ListType.prototype = Object.create(ListPrototype, {
      constructor: {value: ListType},
      [$reader]: {value: reader},
      [$label]: {value: label}
    })

    return ListType
  } else {
    if (type === void(0)) {
      throw TypeError("Typed.List must be passed a type descriptor")
    } else {
      throw TypeError("Typed.List was passed an invalid type descriptor: ${type}")
    }
  }
}
List.Type = TypedList
List.prototype = TypedList.prototype
const ListPrototype = TypedList.prototype

ListPrototype[Typed.DELETE] = ListPrototype.remove;
