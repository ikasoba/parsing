import {Parser} from "../src/index.js"
const parser = new Parser()
const whitespace = parser.space(parser.token(/\s+/))
const helloWorld = parser.and(parser.token("Hello,"), whitespace, parser.token("world!"))

console.log(helloWorld(0, "Hello, world!")?.[1], helloWorld(0, "hello, world!")?.[1]) // [ 'hello,', 'world' ] undefined