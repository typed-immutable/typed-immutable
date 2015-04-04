import * as Immutable from 'immutable'

if (typeof(Symbol) === 'undefined') {
  var Symbol = hint => `@@${hint}`
  Symbol.for = Symbol
}

function Construct() {}
export const construct = value => {
  Construct.prototype = value.constructor.prototype
  return new Construct()
}

const $type = Symbol.for("typed/type")
const $store = Symbol.for("typed/store")
const $empty = Symbol.for("typed/empty")

const $maybe = Symbol.for("typed/type/maybe")
const $default = Symbol.for("typed/type/default")
const $label = Symbol.for("typed/type/label")

const $init = Symbol.for("transducer/init")
const $result = Symbol.for("transducer/result")
const $step = Symbol.for("transducer/step")
const $read = Symbol.for("typed/type/read")
const $parse = Symbol.for("typed/type/parse")
const $typeName = Symbol("typed/type/name")
const $typeSignature = Symbol("typed/type/signature")

export const Typed = function(label, parse, defaultValue) {
  class ValueType extends Type {
    constructor(defaultValue) {
      this[$default] = defaultValue
    }
  }

  const prototype = ValueType.prototype
  prototype[$default] = defaultValue
  prototype[$parse] = parse
  prototype[$label] = label

  const TypedValue = function(defaultValue) {
    return defaultValue === void(0) ? prototype :
    new ValueType(defaultValue)
  }
  TypedValue.prototype = prototype

  return TypedValue
}

Typed.label = $label
Typed.defaultValue = $default
Typed.read = $read
Typed.typeName = $typeName
Typed.typeSignature = $typeSignature

Typed.type = $type
Typed.store = $store
Typed.init = $init
Typed.result = $result
Typed.step = $step
Typed.DELETE = "delete"
Typed.empty = $empty

const typeName = type => type[$typeName]()
const typeSignature = type => type[$typeSignature]()

export class Type {
  constructor() {}
  [Typed.read](value=this[$default]) {
    return this[$parse](value)
  }
  [Typed.parse](value) {
    throw TypeError(`Type implementation must implement "[read.symbol]" method`)
  }
  [Typed.typeName]() {
    const label = this[$label]
    const defaultValue = this[$default]
    return defaultValue === void(0) ? label : `${label}(${JSON.stringify(defaultValue)})`
  }
}

const ObjectPrototype = Object.prototype

// Returns `true` if given `x` is a JS array.
const isArray = Array.isArray ||
  x => ObjectPrototype.toString.call(x) === '[object Array]'

// Returns `true` if given `x` is a regular expression.
const isRegExp = x =>
  ObjectPrototype.toString.call(x) === '[object RegExp]'


export const typeOf = (x, type=typeof(x)) =>
  x === void(0) ? x :
  x === null ? x :
  x[$read] ? x :
  (x.prototype && x.prototype[$read]) ? x.prototype :
  type === "number" ? new Typed.Number(x) :
  type === "string" ? new Typed.String(x) :
  type === "boolean" ? new Typed.Boolean(x) :
  type === "symbol" ? new Typed.Symbol(x) :
  isArray(x) ? Typed.Array(x) :
  isRegExp(x) ? new Typed.RegExp(x) :
  x === String ? Typed.String.prototype :
  x === Number ? Typed.Number.prototype :
  x === Boolean ? Typed.Boolean.prototype :
  x === RegExp ? Typed.RegExp.prototype :
  x === Array ? Typed.Array.prototype :
  x === Symbol ? Typed.Symbol.prototype :
  x === Date ? Typed.Date.prototype :
  Any;

export const Any = Typed("Any", value => value)()
Typed.Any = Any

Typed.Number = Typed("Number", value =>
  typeof(value) === "number" ? value :
  TypeError(`"${value}" is not a number`))

Typed.String = Typed("String", value =>
  typeof(value) === "string" ? value :
  TypeError(`"${value}" is not a string`))

Typed.Symbol = Typed("Symbol", value =>
  typeof(value) === "symbol" ? value :
  TypeError(`"${value}" is not a symbol`))

Typed.Array = Typed("Array", value =>
  isArray(value) ? value :
  TypeError(`"${value}" is not an array`))

Typed.RegExp = Typed("RegExp", value =>
  value instanceof RegExp ? value :
  TypeError(`"${value}" is not a regexp`))

Typed.Boolean = Typed("Boolean", value =>
  value === true ? true :
  value === false ? false :
  TypeError(`"${value}" is not a boolean`))

class MaybeType extends Type {
  constructor(type) {
    this[$type] = type
  }
  [Typed.typeName]() {
    return `Maybe(${this[$type][$typeName]()})`
  }
  [Typed.read](value) {
    const result = value == null ? null : this[$type][$read](value)

    return !(result instanceof TypeError) ? result :
           TypeError(`"${value}" is not nully nor it is of ${this[$type][$typeName]()} type`)
  }
}

export const Maybe = Type => {
  const type = typeOf(Type)
  if (type === Any) {
    throw TypeError(`${Type} is not a valid type`)
  }

  return type[$maybe] || (type[$maybe] = new MaybeType(type))
}
Maybe.Type = MaybeType


class UnionType extends Type {
  constructor(variants) {
    this[$type] = variants
  }
  [Typed.typeName]() {
    return `Union(${this[$type].map(typeName).join(', ')})`
  }
  [Typed.read](value) {
    const variants = this[$type]
    const count = variants.length
    let index = 0
    while (index < count) {
      const result = variants[index][$read](value)
      if (!(result instanceof TypeError)) {
        return result
      }
      index = index + 1
    }

    return TypeError(`"${value}" does not satisfy ${this[$typeName]()} type`)
  }
}

// Returns `xs` excluding any values that are included in `ys`.
const subtract = (xs, ys) =>
  xs.filter(x => ys.indexOf(x) < 0)

// Returns array including all values from `xs` and all values from
// `ys` that aren't already included in `xs`. It will also attempt
// to return either `xs` or `ys` if one of them is a superset of other.
// return `xs` or `ys` if
const union = (xs, ys) => {
  // xs can be superset only if it contains more items then
  // ys. If that's a case find items in ys that arent included
  // in xs. If such items do not exist return back `xs` otherwise
  // return concatination of xs with those items.
  // those items
  if (xs.length > ys.length) {
    const diff = subtract(ys, xs)
    return diff.length === 0 ? xs : xs.concat(diff)
  }
  // if number of items in xs is not greater than number of items in ys
  // then either xs is either subset or equal of `ys`. There for we find
  // ys that are not included in `xs` if such items aren't found ys is
  // either superset or equal so just return ys otherwise return concatination
  // of those items with `ys`.
  else {
    const diff = subtract(xs, ys)
    return diff.length === 0 ? ys : diff.concat(ys)
  }
}

export const Union = (...Types) => {
  const count = Types.length

  if (count === 0) {
    throw TypeError(`Union must be of at at least one type`)
  }

  let variants = null
  let type = null
  let index = 0;
  while (index < count) {
    const variant = typeOf(Types[index])
    // If there is `Any` present than union is also `Any`.
    if (variant === Any) {
      return Any
    }
    // If this is the first type we met than we assume it's the
    // one that satisfies all types.
    if (!variants) {
      type = variant
      variants = type instanceof UnionType ? type[$type] : [variant]
    } else if (variants.indexOf(variant) < 0) {
      // If current reader is of union type
      if (variant instanceof UnionType) {
        const variantUnion = union(variants, variant[$type])

        // If `reader.readers` matches union of readers, then
        // current reader is a superset so we use it as a type
        // that satisfies all types.
        if (variantUnion === variant[$type]) {
          type = variant
          variants = variantUnion
        }
        // If current readers is not the union than it does not
        // satisfy currenty reader. There for we update readers
        // and unset a type.
        else if (variantUnion !== variants) {
          type = null
          variants = variantUnion
        }
      } else {
        type = null
        variants.push(variant)
      }
    }

    index = index + 1
  }

  return type ? type : new UnionType(variants)
}
Union.Type = UnionType


Typed.Number.Range = (from, to=+Infinity, defaultValue) =>
  Typed(`Typed.Number.Range(${from}..${to})`, value => {
    if (typeof(value) !== 'number') {
      return TypeError(`"${value}" is not a number`)
    }

    if (!(value >= from && value <= to)) {
      return TypeError(`"${value}" isn't in the range of ${from}..${to}`)
    }

    return value
  }, defaultValue)
