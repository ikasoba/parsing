import { every, ignore, many, map, NormalParserFunc, option, ParserResult, regex, some, token } from "../src/index"
import {describe, expect, test} from '@jest/globals';
import { Flat } from "../src/util";

test("parse ISO8601 extended format", () => {
  const digits4 = regex(/[0-9]{4}/)
  const digits2 = regex(/[0-9]{2}/)
  const digits  = regex(/[0-9]+/)
  const yymmdd  = every(digits4, ignore("-"), digits2, ignore("-"), digits2)
  const parseDate = map(
    every(
      yymmdd, ignore("T"), digits2, ignore(":"), digits2, ignore(":"), digits2, ignore("."), digits
    ),
    ([year, month, day, hour, minute, sec, ms]) => ({
      year, month, day, hour, minute, sec, ms
    })
  )
  console.time()
  const m = parseDate("2022-12-20T01:02:03.04", 0)
  console.timeEnd()
  expect(
    m
  ).toEqual({
    type: "normal",
    index: 0,
    length: 22,
    res: { year: "2022", month: "12", day: "20", hour: "01", minute: "02", sec: "03", ms: "04" }
  })
})

test("test many", () => {
  console.time()
  const m = many(token(/[1-9]/))("12345", 0)
  console.timeEnd()
  expect(
      m
  ).toEqual({
    type: "normal",
    index: 0,
    length: 5,
    res: [["1"], ["2"], ["3"], ["4"], ["5"]],
  } as ParserResult<any, any>)
})

test("option union", () => {
  console.time()
  const values = some(
    map(
      token(/[0-9]+/),
      x => parseInt(x)
    ),
    map(
      every(ignore('"'), token(/[^"]*/), ignore('"')),
      x => x[0]
    )
  )
  const valueOrNull = option(values)
  const strValue = valueOrNull('"hoge hoge"', 0)
  const numValue = valueOrNull('1234', 0)
  console.time()
  expect(
    strValue
  ).toEqual({
    type: "normal",
    index: 0,
    length: 11,
    res: "hoge hoge"
  } as ParserResult<any, any>)
  console.timeEnd()
  console.time()
  expect(
    numValue
  ).toEqual({
    type: "normal",
    index: 0,
    length: 4,
    res: 1234,
  } as ParserResult<any, any>)
  console.timeEnd()
})