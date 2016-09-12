import {Typed, Type, Union, Any, typeOf, construct} from "./typed"
import * as Immutable from 'immutable'


const ImmutableList = Immutable.List
const {Indexed} = Immutable.Iterable

const $store = Typed.store
const $type = Typed.type
const $read = Typed.read
const $step = Typed.step
const $init = Typed.init
const $result = Typed.result
const $label = Typed.label
const $typeName = Typed.typeName
const $empty = Typed.empty


const change = (list, f) => {
  const store = f(list[$store])
  if (store === list[$store]) {
    return list
  } else {
    const result = list.__ownerID ? list : construct(list)
    result[$store] = store
    result.size = store.size
    return result
  }
}

const maxSizeFromIterables = (iterables) => {
    let maxSize = 0;
    for (let i = 0; i < iterables.length; i++) {
      const iter = Indexed(iterables[i]);
      if (iter.size > maxSize) {
        maxSize = iter.size;
      }
    }
    return maxSize;
}

const convertValuesToType = (type, values) => {
  const items = []
  const iter = Indexed(values);
  let index = 0
  while (index < iter.size) {
    const value = iter.get(index)
    const result = type[$read](value)

    if (result instanceof TypeError) {
      throw TypeError(`Invalid value: ${result.message}`)
    }

    items.push(result)
    index = index + 1
  }
  return items;
}

const clear = target => target.clear()
const pop = target => target.pop()
const shift = target => target.shift()

class TypeInferer extends Type {
  [Typed.typeName]() {
    return 'TypeInferer'
  }
  [Typed.read](value) {
    // typeOf usually creates type for the value with that
    // value being a default. For type inference we should
    // actually use a base type instead of type with default
    // there for we use prototype of the constructor.
    const type = typeOf(value).constructor.prototype
    this.type = this.type ? Union(this.type, type) : type
    return value
  }
}

function BaseImmutableList() {}
BaseImmutableList.prototype = ImmutableList.prototype

class TypeInferedList extends BaseImmutableList {
  static from(list) {
    const result = construct(this.prototype)
    result[$store] = list[$store]
    result.size = list.size
    return result
  }
  constructor(value) {
    super();
    return TypeInferedList.prototype[$read](value)
  }
  [Typed.init]() {
    const result = construct(this).asMutable()
    result[$type] = new TypeInferer()
    return result
  }
  [Typed.result](result) {
    const list = result.asImmutable()
    list[$type] = result[$type].type

    return list
  }

  [Typed.read](input) {
    const Type = this.constructor

    if (input === null || input === void(0)) {
      if (!this[$empty]) {
        const result = construct(this)
        result[$store] = ImmutableList()
        result.size = 0
        this[$empty] = result
      }

      return this[$empty]
    }

    if (input instanceof Type && input && input.constructor === Type) {
      return input
    }

    const source = Indexed(input)
    const isEmpty = source.size === 0

    if (isEmpty && this[$empty]) {
      return this[$empty]
    }


    let list = this[$init]()
    list.size = source.size
    source.forEach((value, index) => {
      list.set(index, value)
    })

    list = this[$result](list)

    if (isEmpty) {
      this[$empty] = list
    }

    return list
  }
  [Typed.step](result, [key, value]) {
    return change(result, (store=ImmutableList()) => store.set(key, value))
  }

  [Typed.typeName]() {
    return this[$label] || `Typed.List(${this[$type][$typeName]()})`
  }

  toString() {
    return this.__toString(this[$typeName]() + '([', '])')
  }

  has(key) {
    return this[$store].has(key)
  }

  get(index, notSetValue) {
    return this[$store] ? this[$store].get(parseInt(index), notSetValue) :
           notSetValue
  }

  clear() {
    if (this.__ownerID) {
      return change(this, clear)
    }

    return this[$empty] || this[$read]()
  }

  insert(index, value) {
    if (index > this.size) {
      throw TypeError(`Index "${index}" is out of bounds.`)
    }

    const result = this[$type][$read](value)

    if (result instanceof TypeError) {
      throw TypeError(`Invalid value: ${result.message}`)
    }

    return change(this, store => store.insert(index, value))
  }

  remove(index) {
    return change(this, store => store && store.remove(index))
  }

  set(index, value) {
    if (index > this.size) {
      throw TypeError(`Index "${index}" is out of bounds.`)
    }

    const result = this[$type][$read](value)

    if (result instanceof TypeError) {
      throw TypeError(`Invalid value: ${result.message}`)
    }

    return this[$step](this, [index, result])
  }

  push(...values) {
    const type = this[$type]
    const items = []
    const count = values.length
    let index = 0
    while (index < count) {
      const value = values[index]
      const result = type[$read](value)

      if (result instanceof TypeError) {
        throw TypeError(`Invalid value: ${result.message}`)
      }

      items.push(result)
      index = index + 1
    }

    return change(this, store =>
      store ? store.push(...items) : ImmutableList(...items))
  }
  pop() {
    return change(this, pop)
  }
  unshift(...values) {
    const type = this[$type]
    const items = []
    const count = values.length
    let index = 0

    while (index < count) {
      const value = values[index]
      const result = type[$read](value)

      if (result instanceof TypeError) {
        throw TypeError(`Invalid value: ${result.message}`)
      }

      items.push(result)
      index = index + 1
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

  merge(...iterables) {
    const maxSize = maxSizeFromIterables(iterables);
    const typedIterables = iterables.map(convertValuesToType.bind(null, this[$type]));
    if (maxSize > this.size) {
      return change(this, store => store.setSize(maxSize)).merge(...typedIterables);
    }
    return change(this, store => store.merge(...typedIterables));
  }

  mergeWith(merger, ...iterables) {
    const maxSize = maxSizeFromIterables(iterables);
    const typedIterables = iterables.map(convertValuesToType.bind(null, this[$type]));
    if (maxSize > this.size) {
      return change(this, store => store.setSize(maxSize).mergeWith(merger, ...typedIterables));
    }
    return change(this, store => store.mergeWith(merger, ...typedIterables));
  }

  mergeDeep(...iterables) {
    const maxSize = maxSizeFromIterables(iterables);
    const typedIterables = iterables.map(convertValuesToType.bind(null, this[$type]));
    if (maxSize > this.size) {
      return change(this, store => store.setSize(maxSize).mergeDeep(...typedIterables));
    }
    return change(this, store => store.mergeDeep(...typedIterables));
  }

  mergeDeepWith(merger, ...iterables) {
    const maxSize = maxSizeFromIterables(iterables);
    const typedIterables = iterables.map(convertValuesToType.bind(null, this[$type]));
    if (maxSize > this.size) {
      return change(this, store => store.setSize(maxSize).mergeDeepWith(merger, ...typedIterables));
    }
    return change(this, store => store.mergeDeepWith(merger, ...typedIterables));
  }

  __ensureOwner(ownerID) {
    const result = this.__ownerID === ownerID ? this :
                   !ownerID ? this :
                   construct(this)

    result.__ownerID = ownerID
    result[$store] = this[$store] ? this[$store].__ensureOwner(ownerID) :
                     ImmutableList().__ensureOwner(ownerID)
    result.size = result[$store].size

    return result
  }
  __iterator(type, reverse) {
    return Indexed(this[$store]).map((_, key) => this.get(key)).__iterator(type, reverse)
  }

  __iterate(f, reverse) {
    return Indexed(this[$store]).map((_, key) => this.get(key)).__iterate(f, reverse)
  }
}
TypeInferedList.prototype[Typed.DELETE] = TypeInferedList.prototype.remove;

const BaseTypeInferedList = function() {}
BaseTypeInferedList.prototype = TypeInferedList.prototype

class TypedList extends BaseTypeInferedList {
  constructor() {
    super()
  }
  [Typed.init]() {
    return construct(this).asMutable()
  }
  [Typed.result](result) {
    return result.asImmutable()
  }
  map(mapper, context) {
    if (this.size === 0) {
      return this
    } else {
      const result = TypeInferedList.from(this).map(mapper, context)
      if (this[$store] === result[$store]) {
        return this
      }
      if (result[$type] === this[$type]) {
        const list = construct(this)
        list[$store] = result[$store]
        list.size = result.size
        return list
      } else {
        return result
      }
    }
  }
  flatMap(mapper, context) {
    if (this.size === 0) {
      return this
    } else {
      const result = TypeInferedList.from(this).flatMap(mapper, context)
      if (this[$store] === result[$store]) {
        return this
      }
      if (result[$type] === this[$type]) {
        const list = construct(this)
        list[$store] = result[$store]
        list.size = result.size
        return list
      } else {
        return result
      }
    }
  }

}

export const List = function(descriptor, label) {
  if (descriptor === void(0)) {
    throw TypeError("Typed.List must be passed a type descriptor")
  }

  if (descriptor === Any) {
    return Immutable.List
  }

  const type = typeOf(descriptor)

  if (type === Any) {
    throw TypeError(`Typed.List was passed an invalid type descriptor: ${descriptor}`)
  }

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
      this.size = result.size
    } else {
      return result
    }

    return this
  }
  ListType.of = ImmutableList.of
  ListType.prototype = Object.create(ListPrototype, {
    constructor: {value: ListType},
    [$type]: {value: type},
    [$label]: {value: label}
  })

  return ListType
}
List.Type = TypedList
List.prototype = TypedList.prototype
const ListPrototype = TypedList.prototype
