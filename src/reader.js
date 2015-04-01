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
  null;

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

Reader.Function = Reader("Function", value =>
  typeof(value) === "function" ? value :
  TypeError(`"${value}" is not a function`))

export const Maybe = Type => {
  const reader = Reader.for(Type)
  if (!reader) {
    throw TypeError(`${Type} is not a valid type reader`)
  }

  return Reader(`Maybe(${reader.toTypeName()})`, value => {
    const result = value == null ? null : reader[$read](value)

    return !(result instanceof TypeError) ? result :
           TypeError(`"${value}" is not nully nor it is of ${reader.toTypeName()} type`)
  }).prototype
}


export const Union = (...Types) => {
  const count = Types.length
  const readers = Array(count)
  let index = 0;
  while (index < count) {
    const reader = Reader.for(Types[index])
    if (!reader) {
      throw TypeError(`Invalid type reader passed to "Union" : ${Types[index]}`)
    }
    readers[index] = reader
    index = index + 1
  }

  const typeName = `Union(${readers.map(x => x.toTypeName()).join(', ')})`

  return Reader(typeName, (value, Type) => {
    let index = 0
    while (index < count) {
      const result = readers[index][$read](value)
      if (!(result instanceof TypeError)) {
        return result
      }
      index = index + 1
    }
    return TypeError(`"${value}" does not qualify ${typeName} type`)
  })
}


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
