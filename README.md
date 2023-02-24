# parsing
Parsing is a small parser combinator.

## example
```ts
import {ignore, every, token, regex} from "@ikasoba000/parsing"
const whitespace = ignore(regex(/\s+/))
const helloWorld = every(token("Hello,"), whitespace, token("world!"))

console.log(helloWorld("Hello, world!", 0)?.[0], helloWorld("hello, world!", 0)?.[0]) // [ 'hello,', 'world' ] undefined
```

# usage

```ts
type Parser<T = string, E = never> = (src: string, index: number) => ParsingError | null | ParserResult<T, E>
```

## token(pattern: string | RegExp): Parser
Generate a parser that matches a string or regexp.

## regex(pattern: RegExp): Parser
Generate a parser that matches the regular expression.

## option(parser: Parser): Parser
Generates an optional parser.

## ignore(parser: Parser): IgnoreParser
If parsing succeeds, only the next index is returned.

## some(...parsers: Parser[]): Parser
Generate a parser that matches any one of the parsers.

## every(...parsers: Parser[]): Parser
Combine multiple parsers to produce a single parser.
Even when nested, the array depth remains 1.
```ts
every(token("1"), token("2"), token("3"))("123", 0)        // [["1", "2", "3"], 3]
every(every(token("1"), token("2")), token("3"))("123", 0) // [["1", "2", "3"], 3]
// Both the top and bottom parsers have the same function.
```

## map&lt;T>(parser: Parser, converter: x => T): Parser&lt;T>
it is useful for generating values from strings that can be parsed.
```ts
map(token(/[0-9]+/), x => parseInt(x))("123", 0) // {type: "normal", res: 123, index: 0, length: 3 }
```