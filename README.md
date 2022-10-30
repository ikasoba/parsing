# parsing
parsing is tiny parser combinator.

## example
```ts
import {Parser} from "@ikasoba000/parsing"
const parser = new Parser()
const whitespace = parser.space(parser.token(/\s+/))
const helloWorld = parser.and(parser.token("Hello,"), whitespace, parser.token("world!"))

console.log(helloWorld(0, "Hello, world!")?.[1], helloWorld(0, "hello, world!")?.[1]) // [ 'hello,', 'world' ] undefined
```

## usage

> **Note**
> The above information may be simplified from the actual type.

### ParserFunc\<...>
```ts
function parserFunc<T>(index: number, source: string): [ number, T ] | null
```

### Parser#token(pattern: string | Regexp): ParserFunc\<string>
```ts
import {Parser} from "@ikasoba000/parsing"
const parser = new Parser()
const decimal = parser.token(/[+-]?(?:[1-9][0-9]+|[0-9])(?:\.[0-9]+)?/)

console.log(decimal(0, "123")) // [ 3, '123' ]
console.log(decimal(0, "abc")) // null
```

### Parser#or\<T>(...parsers: ParserFunc\<T>[]): ParserFunc\<T>
```ts
import {Parser} from "@ikasoba000/parsing"
const parser = new Parser()
const decimal = parser.token(/[+-]?(?:[1-9][0-9]+|[0-9])(?:\.[0-9]+)?/)
const alphabet = parser.token(/[a-zA-Z]+/)
const decimalOrAlphabet = parser.or(decimal, alphabet)

console.log(decimalOrAlphabet(0, "123"))    // [ 4, '123' ]
console.log(decimalOrAlphabet(0, "abc"))    // [ 4, 'abc' ]
console.log(decimalOrAlphabet(0, "123abc")) // null
```

### Parser#and\<T>(...parsers: ParserFunc\<T>[]): ParserFunc\<T>
Don't worry, nesting this method does not deepen the nesting of the return value.
```ts
import {Parser} from "@ikasoba000/parsing"
const parser = new Parser()
const decimal = parser.token(/[+-]?(?:[1-9][0-9]+|[0-9])(?:\.[0-9]+)?/)
const alphabet = parser.token(/[a-zA-Z]+/)
const decimalAndAlphabet = parser.and(decimal, alphabet)

console.log(decimalAndAlphabet(0, "123"))    // null
console.log(decimalAndAlphabet(0, "abc"))    // null
console.log(decimalAndAlphabet(0, "123abc")) // [ 6, [ '123', 'abc' ] ]
```

### Parser#space\<T>(func: ParserFunc\<T>): ParserFunc\<null, "space">
It is useful for expressing whitespace.
```ts
import {Parser} from "@ikasoba000/parsing"
const parser = new Parser()
const whitespace = parser.space(parser.token(/\s+/))
const decimal = parser.token(/[+-]?(?:[1-9][0-9]+|[0-9])(?:\.[0-9]+)?/)
const decimalWithWhitespace = parser.and(whitespace, decimal, whitespace)

console.log(decimalWithWhitespace(0, "  123  ")) // [ 7, ['123'] ]
```

### Parser#ref\<T extends ParserFunc>(func: ParserFunc\<T>): ParserFunc\<null, "space">
It is useful to use it to express recursive constructions.
```ts
import {Parser} from "@ikasoba000/parsing"
const parser = new Parser()
const whitespace = parser.space(parser.token(/\s*/))
const decimal = parser.token(/[+-]?(?:[1-9][0-9]+|[0-9])(?:\.[0-9]+)?/)
const expr = parser.or(
  parser.and(whitespace, decimal, whitespace, parser.token(/\+|-|\*|\//), whitespace, parser.ref(() => expr), whitespace),
  parser.and(decimal)
)

console.log(expr(0, "100 + 23 * 2")) // [ 12, [ '100', '23', '*', '2' ] ]
```

### Parser#option\<T>(func: ParserFunc\<T>): ParserFunc\<T | null>
This method is useful for representing optional tokens.
```ts
import {Parser} from "@ikasoba000/parsing"
const parser = new Parser()
const whitespace = parser.space(parser.token(/\s*/))
const year = parser.token(/[0-9]{1,4}/)
const month = parser.token(/[0-1]?[0-9]|1[0-2]/)
const day = parser.token(/[0-2]?[0-9]|3[0-1]/)
const time = parser.token(/[0-5]?[0-9]/)
const datetime = parser.and(
  // <year>/<month>/<day>
  whitespace, year, whitespace, parser.token("/"), whitespace, month, whitespace, parser.token("/"), whitespace, day, whitespace,
  // [<time>:<time>[:<time>]]
  parser.option(parser.and(
    // <time>:<time>[:<time>]
    time, whitespace, parser.token(":"), whitespace, time, whitespace,
    // :<time>
    parser.option(parser.and(parser.token(":"), whitespace, time, whitespace))
  ))
)

console.log(datetime(0, "2022/10/29")) // [ 10, [ '2022', '/', '10', '/', '29', null ] ]
console.log(datetime(0, "2022/10/29 13:52")) // [ 16, [ '2022', '/', '10', '/', '29', '13', ':', '52', null ] ]
console.log(datetime(0, "2022/10/29 13:52:00")) // [ 19, [ '2022', '/', '10', '/', '29', '13', ':', '52', '00' ] ]
```

### Parser#tree\<T>(func: ParserFunc\<T>): ParserFunc\<T | null>
This method is useful for representing optional tokens.
```ts
import {Parser} from "@ikasoba000/parsing"
const parser = new Parser()
const whitespace = parser.space(parser.token(/\s*/))
const year = parser.token(/[0-9]{1,4}/)
const month = parser.token(/[0-1]?[0-9]|1[0-2]/)
const day = parser.token(/[0-2]?[0-9]|3[0-1]/)
const time = parser.token(/[0-5]?[0-9]/)
const datetime = parser.and(
  whitespace, year, whitespace, parser.token("/"), whitespace, month, whitespace, parser.token("/"), whitespace, day, whitespace,
  parser.option(parser.and(
    time, whitespace, parser.token(":"), whitespace, time, whitespace,
    parser.option(parser.and(parser.token(":"), whitespace, time, whitespace))
  ))
)

console.log(datetime(0, "2022/10/29")) // [ 10, [ '2022', '/', '10', '/', '29', null ] ]
console.log(datetime(0, "2022/10/29 13:52")) // [ 16, [ '2022', '/', '10', '/', '29', '13', ':', '52', null ] ]
console.log(datetime(0, "2022/10/29 13:52:00")) // [ 19, [ '2022', '/', '10', '/', '29', '13', ':', '52', '00' ] ]
```