import {ignore, every, token, regex} from "../src/index.js"
const whitespace = ignore(regex(/\s+/))
const helloWorld = every(token("Hello,"), whitespace, token("world!"))

console.log(helloWorld("Hello, world!", 0)?.[0], helloWorld("hello, world!", 0)?.[0]) // [ 'hello,', 'world' ] undefined