import * as Immutable from 'immutable'

if (typeof(Symbol) === 'undefined') {
  Symbol = hint => `@@${hint}`
  Symbol.for = Symbol
}

const $read = Symbol.for("typed/read")
const $readers = Symbol.for("typed/readers")
const $store = Symbol.for("typed/store")
const $construct = Symbol("typed/construct")
const $label = Symbol.for("typed/label")
const $init = Symbol.for("transducer/init")
const $result = Symbol.for("transducer/result")
const $step = Symbol.for("transducer/step")
const $empty = Symbol.for("typed/empty")

export class Typed {
  [$read]() {
    throw TypeError("Typed must implement [Typed.read] method")
  }
  [$construct]() {
    return Object.create(this.constructor.prototype)
  }
  [$init]() {
    return this[$construct]().asMutable()
  }
  [$result](result) {
    return result.asImmutable()
  }
  [$step](result, input) {
    throw TypeError("Typed data structure must implement [Typed.step] method")
  }
}
Typed.read = $read
Typed.readers = $readers
Typed.store = $store
Typed.construct = $construct
Typed.init = $init
Typed.result = $result
Typed.step = $step
Typed.label = $label
Typed.DELETE = "delete"
Typed.empty = $empty

const TypedPrototype = Typed.prototype

Typed.Iterable = class TypedIterable extends Immutable.Iterable {
  __ensureOwner(ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }

    const store = this[$store] && this[$store].__ensureOwner(ownerID)
    const result = !ownerID ? this : this[$construct]()

    result.__ownerID = ownerID
    result[$store] = store
    return result
  }
  wasAltered() {
    return this[$store].wasAltered()
  }
}

const IterablePrototype = Typed.Iterable.prototype


Typed.Iterable.Keyed = class TypedKeyedIterable extends Immutable.Iterable.Keyed {
  get [Typed.DELETE]() {
    Object.define(this, Typed.DELETE, {
      value: this.remove
    })
    return this.remove
  }
}

const KeyedPrototype = Typed.Iterable.Keyed.prototype
KeyedPrototype[Typed.init] = TypedPrototype[Typed.init]
KeyedPrototype[Typed.step] = TypedPrototype[Typed.step]
KeyedPrototype[Typed.result] = TypedPrototype[Typed.result]
KeyedPrototype[Typed.read] = TypedPrototype[Typed.read]
KeyedPrototype[Typed.construct] = TypedPrototype[Typed.construct]
KeyedPrototype.__ensureOwner = IterablePrototype.__ensureOwner
KeyedPrototype.wasAltered = IterablePrototype.wasAltered
KeyedPrototype.deleteIn =
KeyedPrototype.removeIn = Immutable.Map.prototype.removeIn
KeyedPrototype.merge = Immutable.Map.prototype.merge
KeyedPrototype.mergeWith = Immutable.Map.prototype.mergeWith
KeyedPrototype.mergeIn = Immutable.Map.prototype.mergeIn
KeyedPrototype.mergeDeep = Immutable.Map.prototype.mergeDeep
KeyedPrototype.mergeDeepWith = Immutable.Map.prototype.mergeDeepWith
KeyedPrototype.mergeDeepIn = Immutable.Map.prototype.mergeDeepIn
KeyedPrototype.setIn = Immutable.Map.prototype.setIn
KeyedPrototype.update = Immutable.Map.prototype.update
KeyedPrototype.updateIn = Immutable.Map.prototype.updateIn
KeyedPrototype.withMutations = Immutable.Map.prototype.withMutations
KeyedPrototype.asMutable = Immutable.Map.prototype.asMutable
KeyedPrototype.asImmutable = Immutable.Map.prototype.asImmutable



Typed.Iterable.Indexed = class TypedIndexedIterable extends Immutable.Iterable.Indexed {
  get [Typed.DELETE]() {
    Object.define(this, Typed.DELETE, {
      value: this.remove
    })
    return this.remove
  }
}


const IndexedPrototype = Typed.Iterable.Indexed.prototype
IndexedPrototype[Typed.init] = TypedPrototype[Typed.init]
IndexedPrototype[Typed.step] = TypedPrototype[Typed.step]
IndexedPrototype[Typed.result] = TypedPrototype[Typed.result]
IndexedPrototype[Typed.read] = TypedPrototype[Typed.read]
IndexedPrototype[Typed.construct] = TypedPrototype[Typed.construct]
IndexedPrototype.__ensureOwner = IterablePrototype.__ensureOwner
IndexedPrototype.wasAltered = IterablePrototype.wasAltered
IndexedPrototype.deleteIn =
IndexedPrototype.removeIn = Immutable.Map.prototype.removeIn
IndexedPrototype.merge = Immutable.Map.prototype.merge
IndexedPrototype.mergeWith = Immutable.Map.prototype.mergeWith
IndexedPrototype.mergeIn = Immutable.Map.prototype.mergeIn
IndexedPrototype.mergeDeep = Immutable.Map.prototype.mergeDeep
IndexedPrototype.mergeDeepWith = Immutable.Map.prototype.mergeDeepWith
IndexedPrototype.mergeDeepIn = Immutable.Map.prototype.mergeDeepIn
IndexedPrototype.setIn = Immutable.Map.prototype.setIn
IndexedPrototype.update = Immutable.Map.prototype.update
IndexedPrototype.updateIn = Immutable.Map.prototype.updateIn
IndexedPrototype.withMutations = Immutable.Map.prototype.withMutations
IndexedPrototype.asMutable = Immutable.Map.prototype.asMutable
IndexedPrototype.asImmutable = Immutable.Map.prototype.asImmutable
