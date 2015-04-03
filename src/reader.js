import {Typed} from "./core"

const $read = Typed.read
const $label = Typed.label

const ObjectPrototype = Object.prototype

// Returns `true` if given `x` is a JS array.
const isArray = Array.isArray ||
  x => ObjectPrototype.toString.call(x) === '[object Array]'

// Returns `true` if given `x` is a regular expression.
const isRegExp = x =>
  ObjectPrototype.toString.call(x) === '[object RegExp]'

export const Reader = function(label, parse, defaultValue) {
  class ReaderType extends Reader.Type {
    constructor(defaultValue) {
      this.defaultValue = defaultValue
    }
  }
  ReaderType.prototype.defaultValue = defaultValue
  ReaderType.prototype.parse = parse
  ReaderType.prototype[$label] = label

  const TypeReader = function(defaultValue) {
    return defaultValue === void(0) ? ReaderType.prototype :
           new ReaderType(defaultValue)
  }
  TypeReader.prototype = ReaderType.prototype

  return TypeReader
}
Reader.Type = class extends Typed {
  constructor() {}
  [Typed.read](value=this.defaultValue) {
    return this.parse(value)
  }
  toTypeName() {
    const label = this[$label]
    const {defaultValue} = this
    return defaultValue === void(0) ? label : `${label}(${JSON.stringify(defaultValue)})`
  }
}

Reader.for = (x, type=typeof(x)) =>
  x === void(0) ? x :
  x === null ? x :
  x[$read] ? x :
  (x.prototype && x.prototype[$read]) ? x.prototype :
  type === "number" ? new Reader.Number(x) :
  type === "string" ? new Reader.String(x) :
  type === "boolean" ? new Reader.Boolean(x) :
  type === "symbol" ? new Reader.Symbol(x) :
  isArray(x) ? Reader.Array(x) :
  isRegExp(x) ? new Reader.RegExp(x) :
  x === String ? Reader.String.prototype :
  x === Number ? Reader.Number.prototype :
  x === Boolean ? Reader.Boolean.prototype :
  x === RegExp ? Reader.RegExp.prototype :
  x === Array ? Reader.Array.prototype :
  x === Symbol ? Reader.Symbol.prototype :
  x === Date ? Reader.Date.prototype :
  Any;

export const Any = Reader("Any", value => value).prototype
Reader.Any = Any

Reader.Number = Reader("Number", value =>
  typeof(value) === "number" ? value :
  TypeError(`"${value}" is not a number`))

Reader.String = Reader("String", value =>
  typeof(value) === "string" ? value :
  TypeError(`"${value}" is not a string`))

Reader.Symbol = Reader("Symbol", value =>
  typeof(value) === "symbol" ? value :
  TypeError(`"${value}" is not a symbol`))

Reader.Array = Reader("Array", value =>
  isArray(value) ? value :
  TypeError(`"${value}" is not an array`))

Reader.RegExp = Reader("RegExp", value =>
  value instanceof RegExp ? value :
  TypeError(`"${value}" is not a regexp`))

Reader.Boolean = Reader("Boolean", value =>
  value === true ? true :
  value === false ? false :
  TypeError(`"${value}" is not a boolean`))

export const Maybe = Type => {
  const reader = Reader.for(Type)
  if (reader === Any) {
    throw TypeError(`${Type} is not a valid type reader`)
  }

  return Reader(`Maybe(${reader.toTypeName()})`, value => {
    const result = value == null ? null : reader[$read](value)

    return !(result instanceof TypeError) ? result :
           TypeError(`"${value}" is not nully nor it is of ${reader.toTypeName()} type`)
  }).prototype
}


const UnionType = class extends Reader.Type {
  constructor(readers) {
    this.readers = readers
  }
  toTypeName() {
    const typeNames = this.readers.map(x => x.toTypeName())
    return `Union(${typeNames.join(', ')})`
  }
  [Typed.read](value) {
    const readers = this.readers
    const count = readers.length
    let index = 0
    while (index < count) {
      const result = readers[index][$read](value)
      if (!(result instanceof TypeError)) {
        return result
      }
      index = index + 1
    }
    return TypeError(`"${value}" does not qualify ${this.toTypeName()} type`)
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

  let readers = null
  let type = null
  let index = 0;
  while (index < count) {
    const reader = Reader.for(Types[index])
    // If there is `Any` present than union is also `Any`.
    if (reader === Any) {
      return Any
    }
    // If this is the first type we met than we assume it's the
    // one that satisfies all types.
    if (!readers) {
      type = reader
      readers = type instanceof UnionType ? reader.readers : [reader]

    } else if (readers.indexOf(reader) < 0) {
      // If current reader is of union type
      if (reader instanceof UnionType) {
        const unity = union(readers, reader.readers)

        // If `reader.readers` matches union of readers, then
        // current reader is a superset so we use it as a type
        // that satisfies all types.
        if (unity === reader.readers) {
          type = reader
          readers = unity
        }
        // If current readers is not the union than it does not
        // satisfy currenty reader. There for we update readers
        // and unset a type.
        else if (unity !== readers) {
          type = null
          readers = unity
        }
      } else {
        type = null
        readers.push(reader)
      }
    }

    index = index + 1
  }

  return type ? type : new UnionType(readers)
}
Union.Type = UnionType


export const Range = (from, to=+Infinity, defaultValue) =>
  Reader(`Number.Range(${from}..${to})`, value => {
    if (typeof(value) !== 'number') {
      return TypeError(`"${value}" is not a number`)
    }

    if (!(value >= from && value <= to)) {
      return TypeError(`"${value}" isn't in the range of ${from}..${to}`)
    }

    return value
  }, defaultValue)
