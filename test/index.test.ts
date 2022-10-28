import {Parser, ParserFunc} from "../src/index"
import {describe, expect, test} from '@jest/globals';

test("lex 1 + 3 - 2", () => {
  const parser = new Parser<never>()
  const decimal = parser.token(/(?:[1-9][0-9]+|[0-9])(?:\.[0-9]*)?/)
  const whitespace = parser.space(parser.token(/\s*/))
  const operator: ParserFunc<string[]> = parser.or<string[]>(
    parser.and(whitespace, decimal, whitespace, parser.token("+"), whitespace, parser.ref(() => operator), whitespace),
    parser.and(whitespace, decimal, whitespace, parser.token("-"), whitespace, parser.ref(() => operator), whitespace),
    parser.and(decimal)
  )
  expect(operator(0, "1 + 3 - 2")?.[1]).toEqual(["1", "+", "3", "-", "2"])
})

test("parse 1 + 3 * 2 + 1 / 2", () => {
  type Operator = {
    operator:string,
    x: number | Operator,
    y: number | Operator
  }
  const isOperator = (x: any): x is Operator => (
        (typeof x?.operator == "string")
    &&  (typeof x?.x == "number" || isOperator(x?.x))
    &&  (typeof x?.y == "number" || isOperator(x?.y))
  )
  const parser = new Parser<Operator>()
  const decimal = parser.token(/(?:[1-9][0-9]+|[0-9])(?:\.[0-9]*)?/)
  const whitespace = parser.space(parser.token(/\s*/))
  const operator: ParserFunc<(string | Operator)> = parser.or<(string | Operator)>(
    parser.tree(
      parser.and(whitespace, decimal, whitespace, parser.token(/\+|-/), whitespace, parser.ref(() => operator), whitespace),
      ([x,o,y]): Operator => ({operator: o as string, x: isOperator(x) ? x : parseFloat(x), y: isOperator(y) ? y : parseFloat(y)})
    ),
    parser.tree(
      parser.and(whitespace, decimal, whitespace, parser.token(/\*|\//), whitespace, parser.ref(() => operator), whitespace),
      ([x,o,y]): Operator => {
        if (isOperator(y) && (y.operator == "+" || y.operator == "-")){
          y.x = {
            operator: o as string,
            x: isOperator(x) ? x : parseFloat(x),
            y: y.x
          }
          return y
        }else return ({operator: o as string, x: isOperator(x) ? x : parseFloat(x), y: isOperator(y) ? y : parseFloat(y)})
      }
    ),
    decimal
  )
  expect(operator(0, "1 + 3 * 2 + 1 / 2")?.[1]).toEqual({
    operator: "+",
    x: 1,
    y: {
      operator: "+",
      x: {
        operator: "*",
        x: 3,
        y: 2
      },
      y: {
        operator: "/",
        x: 1,
        y: 2
      }
    }
  })
})