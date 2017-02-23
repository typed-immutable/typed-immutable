### Release 0.1.1

This patch release is dominated by TypeErrors, but it is no error.

  * Allow TypeError to be stored as value in record with "Any" field type.
    [@jharris4, #42]
  * Allow Lists, Maps, and Records to coexist in a Union
    [@brightcove, #43]


### Release 0.1.0

The `typed-immutable` maintainers are pleased to release a feature release
for `typed-immutable`. It includes the following changes:

  * Added support for the use of Immutable objects or classes in records.
    [@lukesneeringer, #40]


### Release 0.0.9

The `typed-immutable` maintainers are pleased to release a minor upgrade
and bugfix release for `typed-immutable`. It includes the following changes:

  * Added support for `Map.merge` [@davecoates, #36]

### Release 0.0.8

The `typed-immutable` maintainers are pleased to release a minor upgrade
and bugfix release for `typed-immutable`. It includes the following changes:

  * Added support for `Map.flatten`. [@davecoates, #15]
  * Added a new `Map` type, with an invocation like `Map(String, MyRecord)`,
    to allow for records with a map of arbitrary keys but typed records.
    [@davecoates, #19]
  * Fixed a bug when using `Date`. [@lukesneeringer, #22]
  * Passing a subclass of the expected type to a Record now preserves
    the subclass instance (rather than typecasting to the superclass).
    [@lukesneeringer, #26]
  * Immutable.js is upgraded to 3.7.6 (from 3.7.0), with the option of using
    any later version. [@lukesneeringer, #29]
  * `List.insert`, added in Immutable.js 3.7.6, is now supported in
    typed-immutable lists. [@lukesneeringer, #29]

The new team of maintainers is also in the process of instituting processes
for more regular releases.
