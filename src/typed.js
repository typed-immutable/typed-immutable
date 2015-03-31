if (typeof(Symbol) === 'undefined') {
  Symbol = hint => `@@${hint}`
  Symbol.for = Symbol
}

if (!Object.assign) {
  Object.assign = (target, source) => {
    Object.keys(source).forEach(key => {
      target[key] = source[key]
    })
    return target
  }
}

const require = (path) => window[path]
const exports = window.Typed = {}

import * as Immutable from 'immutable'

const { Seq, Map } = Immutable
const KeyedIterable = Immutable.Iterable.Keyed
const IndexedIterable = Immutable.Iterable.Indexed
const ImmutableRecordPrototype = Immutable.Record.prototype

const $fields = Symbol.for("typed/fields")
const $keys = Symbol.for("typed/field-names")
const $name = Symbol.for("typed/name")
const $isTyped = Symbol.for("typed/is-typed")
const $default = Symbol.for("typed/default")
const $read = Symbol.for("typed/read")
const $parse = Symbol.for("typed/parse")
const $write = Symbol.for("typed/write")
const $store = Symbol.for("typed/store")
const $ownerID = Symbol.for("typed/ownerID")
const $type = Symbol.for("typed/type")

const DELETE = 'delete'

export class Typed extends Iterable {
  [$blank]() {
    return Object.create(this.constructor.prototype)
  }
  [$init]() {
    return Object.create(this.constructor.prototype,
                         {[$store]: new Map()}).asMutable()
  }
  [$step](result, [key, value]) {
    return this.set(key, value)
  }
  [$result](result) {
    return result.asImmutable()
  }
  constructor() {
    class TypedType extends Typed {
      constructor(data) {
        const result = Typed.prototype[$init]()
        Typed.prototype[$write](data, result)
        return Typed.prototype[$result](result)
      }
    }
  }
}
Typed.prototype[$isTyped] = true

export class TypedRecord extends Typed {
  constructor(descriptor) {
    if (descriptor && typeof(descriptor) === "object") {
      const fields = Object.create(null)
      const keys = Object.keys(descriptor)
      const size = keys.length

      if (size > 0) {
        const properties = {
          size: {value: size},
          [$keys]: {value: keys},
          [$fields]: {value: fields},
          [$name]: {value: name}
        }

        let index = 0
        while (index < size) {
          const key = keys[index]
          const field = typeof(descriptor[key]) !== "function" ? descriptor[key] :
                        descriptor[key] ? descriptor[key].prototype :
                        descriptor[key]

          if (field && field[$isTyped]) {
            fields[key] = field
            properties[key] = {
              get: function() {
                var value = this.get(key)
                Object.defineProperty(this, key, {value: value})
                return value
              }
            }
          } else {
            throw TypeError(`Invalid descriptor for the "${key}" field`)
          }

          index = index + 1
        }

        class RecordType extends TypedRecord {
          constructor(structure) {
            const result = prototype[$read](structure)
            if (result instanceof TypeError) {
              throw result
            }

            return result
          }
        }
        const prototype = RecordType.prototype

        return RecordType
      } else {
        throw TypeError(`Strucutre descriptor passed to Typed.Record  must contain at least on field`)
      }
    } else {
      throw TypeError(`Typed.Record must be passed a structure descriptor`)
    }
  }

  [$init]() {
    return Object.create(this.constructor.prototype,
                         {[$store]: new Map()}).asMutable()
  }

  [$read](structure) {
    const seq = Seq(structure)
    const keys = this[$keys]
    const fields = this[$fields]
    const count = keys.length
    let result, index = 0
    while (index < count) {
      const key = keys[index]
      const field = fields[key]
      const value = seq.get(key)
      const entry = field[$read](value)

      if (entry instanceof TypeError) {
        return entry
      }

      result = this[$step](result || this[$init](), input)
      index = index + 1
    }

    return this[$result](result)
  }

  has(key) {
    return key in this[$fields]
  }

  get(key, defaultValue) {
    if (!this.has(key)) {
      return defaultValue;
    }

    return this[$store] ? this[$store].get(key, defaultValue) : defaultValue;
  }

  remove(key) {
    return this[$fields][key] ? this.set(key, void(0)) : this
  }

  set(key, value) {
    const field = this[$fields][key]

    if (!field) {
      throw TypeError(`Cannot set unknown field "${key}" on "${this.typeName()}"`)
    }

    const result = field[$read](value)

    if (result instanceof TypeError) {
      throw result
    }

    const store = this[$store] && this[$store].set(key, value)

    if (this.__ownerID || store == this[$store]) {
      return this
    } else {
      return this[$blank](store)
    }
  }

  __iterator(type, reverse) {
    return KeyedIterable(this[$fields]).map((_, key) => this.get(key)).__iterator(type, reverse);
  }

  __iterate(fn, reverse) {
    return KeyedIterable(this[$fields]).map((_, key) => this.get(key)).__iterate(fn, reverse);
  }
}


export class Record extends Immutable.Record {
  static toString() {
    const prototype = this.prototype
    const keys = prototype[$keys]
    const fields = prototype[$fields]
    const body = keys ? keys.map(key => key + ': ' + fields[key]) : []
    const source = 'Typed.Record({' + body.join(', ') + '})'

    Object.defineProperty(this, 'toString', {value: () => source})


    return source
  }
  static [$read](structure) {
    const result = this[$parse](structure, this)
    return result instanceof TypeError ? result :
           this[$write](result)
  }
  static [$write](store) {
    return Object.create(this.prototype, {
      [$store]: {value: store}
    })
  }
  static [$parse](structure) {
    const seq = Seq(structure)
    const keys = this[$keys]
    const fields = this[$fields]
    const count = keys.length
    let index = 0
    let store
    while (index < count) {
      const key = keys[index]
      const value = fields[key][$read](seq.get(key))

      if (value instanceof TypeError) {
        return TypeError(`Invalid value for "${key}" field:\n ${value.message}`)
      }

      store = store || Map().asMutable()
      store.set(key, value)
      index = index + 1
    }
    return store.asImmutable()
  }
  constructor(descriptor, name) {
    if (descriptor && typeof(descriptor) === "object") {
      const fields = Object.create(null)
      const keys = Object.keys(descriptor)
      const size = keys.length

      if (size > 0) {
        const properties = {
          size: {value: size},
          [$keys]: {value: keys},
          [$fields]: {value: fields},
          [$name]: {value: name}
        }

        let index = 0
        while (index < size) {
          const key = keys[index]
          const field = descriptor[key]

          if (field && field[$isTyped]) {
            fields[key] = field
            properties[key] = {
              get: function() {
                var value = this.get(key)
                Object.defineProperty(this, key, {value: value})
                return value
              }
            }
          } else {
            throw TypeError(`Invalid descriptor for the "${key}" field`)
          }

          index = index + 1
        }

        const RecordType = function(structure) {
          const result = RecordType[$parse](structure)

          if (result instanceof TypeError) {
            throw result
          }

          if (this instanceof RecordType) {
            this[$store] = result
          } else {
            return RecordType[$write](result)
          }
        }
        RecordType.toString = Record.toString
        RecordType[$keys] = keys
        RecordType[$fields] = fields
        RecordType[$write] = Record[$write]
        RecordType[$parse] = Record[$parse]
        RecordType[$read] = Record[$read]
        RecordType[$isTyped] = true

        properties.constructor = {value: RecordType}
        RecordType.prototype = Object.create(RecordPrototype, properties)

        return RecordType
      } else {
        throw TypeError(`Strucutre descriptor passed to Typed.Record  must contain at least on field`)
      }
    } else {
      throw TypeError(`Typed.Record must be passed a structure descriptor`)
    }
  }
  toString() {
    const typeName = this[$name] || this.constructor.toString()
    return this.__toString(typeName + '({', '})')
  }

  has(key) {
    return key in this[$fields]
  }

  get(key, defaultValue) {
    if (!this.has(key)) {
      return defaultValue;
    }

    return this[$store] ? this[$store].get(key, defaultValue) : defaultValue;
  }

  remove(key) {
    return this[$fields][key] ? this.set(key, void(0)) : this
  }

  set(key, value) {
    const field = this[$fields][key]

    if (!field) {
      throw TypeError(`${this.constructor} has no "${key}" field`)
    }

    const value = field[$read](value)

    if (value instanceof TypeError) {
      throw value
    }

    if (!this.has(key)) {
      throw new Error('Cannot set unknown key "' + k + '" on ' + this.constructor);
    }

    const store = this[$store] && this[$store].set(key, value)

    if (this.__ownerID || store == this[$store]) {
      return this
    }

    return this.constructor[$write](store)
  }

  __iterator(type, reverse) {
    return KeyedIterable(this[$fields]).map((_, key) => this.get(key)).__iterator(type, reverse);
  }

  __iterate(fn, reverse) {
    return KeyedIterable(this[$fields]).map((_, key) => this.get(key)).__iterate(fn, reverse);
  }
}
const RecordPrototype = Record.prototype
RecordPrototype.ImmutableRecordPrototypeSet = ImmutableRecordPrototype.set


export class Field {
  constructor(name, parse, defaultValue) {
    const FieldType = function(defaultValue) {
      if (!(this instanceof FieldType)) {
        return new FieldType(defaultValue)
      }

      this[$default] = defaultValue
    }


    FieldType[$isTyped] = true
    FieldType[$read] = Field[$read]
    FieldType.toString = Field.toString
    FieldType.prototype = Object.create(FieldPrototype, {
      constructor: {value: FieldType},
      [$name]: {value: name},
      [$parse]: {value: parse},
      [$default]: {value: defaultValue, writable: true}
    })

    return FieldType
  }
  static toString() {
    return this.prototype.toString()
  }
  static [$read](value) {
    return this.prototype[$read](value)
  }
  get [$isTyped]() {
    Object.defineProperty(this, $isTyped, {
      value: true
    })
    return true
  }
  [$read](value=this[$default]) {
    return this[$parse](value, this)
  }
  toString() {
    const defaultValue = this[$default]
    const name = this[$name]
    const value = defaultValue === void(0) ? name :
                  `${name}(${defaultValue})`

//    Object.defineProperty(this, 'toString', {value: () => value})

    return value
  }
}
const FieldPrototype = Field.prototype


export const Number = Field('Typed.Number', value =>
  typeof(value) === "number" ? value :
  TypeError('Can not use non number value for a number field'))
Record.Number = Number

export const String = Field('Typed.String', value =>
  typeof(value) === "string" ? value :
  TypeError('Can not use non string value for string field'))
Record.String = String


export const Boolean = Field('Typed.Boolean', value =>
  value === true ? true :
  value === false ? false :
  TypeError('Can not use non boolean value for boolean field'))
Record.Boolean = Boolean


export const Maybe = Type => {
  if (!(Type && Type[$isTyped])) {
    throw TypeError('Maybe must be created with a valid Typed.Field')
  }

  return Field('Maybe(' + Type + ')', value => {
    const result = value == null ? null : Type[$read](value)
    if (result instanceof TypeError) {
      return TypeError('Value must be nully or of a ' + Type + ' type')
    }
    return result
  })
}
Record.Maybe = Maybe


export const Union = (...Types) => {
  const count = Types.length;
  let index = 0;
  while (index < count) {
    const Type = Types[index]
    if (!(Type && Type[$isTyped])) {
      throw TypeError('Union must be created witha valid Typed.Field')
      index = index + 1
    }
  }

  return Field('Union(' + Types.join(', ') + ')', (value, Type) => {
    let index = 0
    while (index < count) {
      const result = Types[index][$read](value)
      if (!(result instanceof TypeError)) {
        return result
      }
      index = index + 1
    }
    return TypeError(`"${value}" is not type of ${Type}`)
  })
}
Record.Union = Union


export const Range = (from, to=+Infinity, defaultValue) =>
  Field(`Typed.Number.Range(${from}..${to})`, value => {
    if (typeof(value) !== 'number') {
      return TypeError(`${value} is not a number`)
    }
    if (!(value >= from && value <= to)) {
      return TypeError(`${value} isn't in the range of ${from}..${to}`)
    }

    return value
  }, defaultValue)
Number.Range = Range

// Examples

const Point = Record({
  x: Number(0),
  y: Number(0)
}, 'Point')

const Line = Record({
  start: Point,
  end: Point
}, 'Line')


const Color = Record({
  red: Number.Range(0, 255, 0),
  green: Number.Range(0, 255, 0),
  blue: Number.Range(0, 255, 0),
  alpha: Maybe(Number.Range(0, 100))
}, 'Color')


const Status = Record({
  readyState: Union(Number, String)
})


const _toString = Symbol("toString")
const _set = Symbol("set")
const _clear = Symbol("clear")
const _push = Symbol("push")
const _pop = Symbol("pop")
const _unshift = Symbol("unshift")
const _shift = Symbol("shift")
const _setSize = Symbol("setSize")
const _slice = Symbol("slice")
const _splice = Symbol("splice")
const ___ensureOwner = Symbol("__ensureOwner")

const TypedList = Immutable.List
TypedListPrototype = TypedList.prototype

TypedListPrototype[_toString] = TypedListPrototype.toString
TypedListPrototype.toString = function() {
  const type = this.constructor[$type]
  if (type) {
    const typeName = this.constructor[$name] || `Typed.List(${type})`
    return this.__toString(typeName + '([', '])')
  }
  return this[_toString]()
}
TypedListPrototype[_set] = TypedListPrototype.set
TypedListPrototype.set = function(key, value) {
  const type = this.constructor[$type]

  if (type) {
    const data = type[$read](value)

    if (data instanceof TypeError) {
      throw data
    }

    const result = this[_set](key, data)
    result.constructor = this.constructor
    return result
  }

  return this[_set](key, value)
}
TypedListPrototype[_clear] = TypedListPrototype.clear
TypedListPrototype.clear = function() {
  const result = this[_clear]()
  if (this[$type]) {
    const list = Object.create(TypedList.prototype)
    list.constructor = this.constructor
    list.size = result.size
    list._origin = result._origin
    list._capacity = result._capacity
    list._level = result._level
    list._root = result._root
    list._tail = result._tail
    list.__ownerID = result.__ownerID
    list.__hash = result.__hash
    list.__altered = result.__altered
    return list
  }
  return result
}
TypedListPrototype[_push] = TypedListPrototype.push
TypedListPrototype.push = function() {
  const result = this[_push].apply(this, arguments)
  result.constructor = this.constructor
  return result
}
TypedListPrototype[_pop] = TypedListPrototype.pop
TypedListPrototype.pop = function() {
  const result = this[_pop]()
  result.constructor = this.constructor
  return result
}
TypedListPrototype[_unshift] = TypedListPrototype.unshift
TypedListPrototype.unshift = function() {
  const result = this[_unshift].apply(this, arguments)
  result.constructor = this.constructor
  return result
}
TypedListPrototype[_shift] = TypedListPrototype.shift
TypedListPrototype.shift = function() {
  const result = this[_shift]()
  result.constructor = this.constructor
  return result
}
TypedListPrototype[_slice] = TypedListPrototype.slice
TypedListPrototype.slice = function(begin, end) {
  const result = this[_slice](begin, end)
  result.constructor = this.constructor
  return result
}

/*
TypedListPrototype[_splice] = TypedListPrototype.splice
TypedListPrototype.splice = function() {
  const result = this[_splice].apply(this, arguments)
  result.constructor = this.constructor
  return result
}
*/

TypedListPrototype[___ensureOwner] = TypedListPrototype.__ensureOwner
TypedListPrototype.__ensureOwner = function(ownerID) {
  const result = this[___ensureOwner](ownerID)
  result.constructor = this.constructor
  return result
}





class List extends TypedList {
  constructor(Type, name) {
    if (Type && Type[$isTyped]) {

      const ListType = function(input) {
        const result = ListType[$parse](input)

        if (result instanceof TypeError) {
          throw result
        }

        result.constructor = ListType

        return result
      }
      ListType.prototype = TypedListPrototype
      ListType.of = TypedList.of
      ListType.toString = List.toString
      ListType[$type] = Type
      ListType[$name] = name
      ListType[$write] = List[$write]
      ListType[$parse] = List[$parse]
      ListType[$read] = List[$read]
      ListType[$isTyped] = true

      return ListType
    } else {
      throw TypeError(`Typed.List must be passed a valid type`)
    }
  }
  static toString() {
    const Type = this[$type]
    return `Typed.List(${Type})`
  }
  static [$read](input) {
    const value = this[$parse](input, this)
    return value instanceof TypeError ? value :
           this[$write](value)
  }
  static [$write](value) {
    value.constructor = this
    return value
  }
  static [$parse](input) {
    const seq = Seq(input)
    const type = this[$type]
    const count = seq.count()
    let index = 0
    const list = TypedList().asMutable()
    while (index < count) {
      const value = type[$read](seq.get(index))

      if (value instanceof TypeError) {
        return TypeError(`Invalid item type for a list:\n ${value.message}`)
      }

      list.set(index, value)
      index = index + 1
    }

    return list.asImmutable()
  }
}

const ListPrototype = List.prototype

const Indexed = Immutable.Iterable.Indexed

export class Tuple extends Immutable.Iterable.Indexed {
  static toString() {
    const prototype = this.prototype
    const fields = prototype[$fields]
    const source = 'Typed.Tuple(' + fields.join(', ') + ')'

    Object.defineProperty(this, 'toString', {value: () => source})


    return source
  }
  static [$read](structure) {
    const result = this[$parse](structure, this)
    return result instanceof TypeError ? result :
           this[$write](result)
  }
  static [$write](store) {
    return Object.create(this.prototype, {
      [$store]: {value: store}
    })
  }
  static [$parse](structure) {
    const seq = Immutable.Seq(structure)
    const fields = this[$fields]
    const count = fields.length
    let index = 0
    let store
    while (index < count) {
      const value = fields[index][$read](seq.get(index))

      if (value instanceof TypeError) {
        return TypeError(`Invalid value for "${index}" item:\n ${value.message}`)
      }

      store = store || Immutable.List().asMutable()
      store.set(index, value)
      index = index + 1
    }
    return store.asImmutable()
  }
  constructor(...types) {
    const fields = []
    const size = types.length

    if (size > 0) {
      const properties = {
        size: {value: size},
        length: {value: size},
        [$fields]: {value: fields},
        [$name]: {value: null}
      }

      let index = 0
      while (index < size) {
        const field = types[index]

        if (field && field[$isTyped]) {
          fields[index] = field
          properties[index] = {
            get: function() {
              var value = this.get(index)
              Object.defineProperty(this, index, {value: value})
              return value
            }
          }
        } else {
          throw TypeError(`Invalid descriptor for the "${index}" field`)
        }

        index = index + 1
      }

      const TupleType = function(...structures) {
        const result = TupleType[$parse](structures)

        if (result instanceof TypeError) {
          throw result
        }

        if (this instanceof TupleType) {
          this[$store] = result
        } else {
          return TupleType[$write](result)
        }
      }
      TupleType.toString = Tuple.toString
      TupleType[$fields] = fields
      TupleType[$write] = Tuple[$write]
      TupleType[$parse] = Tuple[$parse]
      TupleType[$read] = Tuple[$read]
      TupleType[$isTyped] = true

      properties.constructor = {value: TupleType}
      TupleType.prototype = Object.create(TuplePrototype, properties)

      return TupleType
    } else {
      throw TypeError(`Typed.Tuple must be passed at least on field descriptor`)
    }
  }
  toString() {
    const typeName = this[$name] || this.constructor.toString()
    return this.__toString(typeName + '(', ')')
  }

  __iterator(type, reverse) {
    return Indexed(this[$fields]).map((_, key) => this.get(key)).__iterator(type, reverse);
  }

  __iterate(fn, reverse) {
    return Indexed(this[$fields]).map((_, key) => this.get(key)).__iterate(fn, reverse);
  }
}
const TuplePrototype = Tuple.prototype
TuplePrototype.has = RecordPrototype.has
TuplePrototype.get = RecordPrototype.get
TuplePrototype.set = RecordPrototype.set
TuplePrototype.clear = RecordPrototype.clear
TuplePrototype.remove = RecordPrototype.remove
TuplePrototype.wasAltered = RecordPrototype.wasAltered
TuplePrototype.__ensureOwner = RecordPrototype.__ensureOwner


TuplePrototype[DELETE] = RecordPrototype.remove;
TuplePrototype.deleteIn =
TuplePrototype.removeIn = RecordPrototype.removeIn;
TuplePrototype.merge = RecordPrototype.merge;
TuplePrototype.mergeWith = RecordPrototype.mergeWith;
TuplePrototype.mergeIn = RecordPrototype.mergeIn;
TuplePrototype.mergeDeep = RecordPrototype.mergeDeep;
TuplePrototype.mergeDeepWith = RecordPrototype.mergeDeepWith;
TuplePrototype.mergeDeepIn = RecordPrototype.mergeDeepIn;
TuplePrototype.setIn = RecordPrototype.setIn;
TuplePrototype.update = RecordPrototype.update;
TuplePrototype.updateIn = RecordPrototype.updateIn;
TuplePrototype.withMutations = RecordPrototype.withMutations;
TuplePrototype.asMutable = RecordPrototype.asMutable;
TuplePrototype.asImmutable = RecordPrototype.asImmutable;


