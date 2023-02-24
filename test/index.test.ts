import { every, ignore, many, map, NormalParserFunc, ParserResult, regex, token } from "../src/index"
import {describe, expect, test} from '@jest/globals';
import { Flat } from "../src/util";

test("parse ISO8601 extended format", () => {
  const digits4 = regex(/[0-9]{4}/)
  const digits2 = regex(/[0-9]{2}/)
  const digits  = regex(/[0-9]+/)
  const yymmdd  = every(digits4, ignore(token("-")), digits2, ignore(token("-")), digits2)
  const format = map(
    every(
      yymmdd, ignore(token("T")), digits2, ignore(token(":")), digits2, ignore(token(":")), digits2, ignore(token(".")), digits
    ),
    ([year, month, day, hour, minute, sec, ms]) => ({
      year, month, day, hour, minute, sec, ms
    })
  )
  console.time()
  const m = format("2022-12-20T01:02:03.04", 0)
  console.timeEnd()
  expect(
    m
  ).toEqual({
    type: "normal",
    index: 0,
    length: 22,
    res: {day: "20", hour: "01", minute: "02", month: "12", ms: "04", sec: "03", year: "2022"}
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
    res: [["1"], ["2"], ["3"], ["4"], ["5"]]
  } as ParserResult<any, any>)
})