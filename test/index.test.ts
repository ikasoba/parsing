import { every, ExtractParserResponseFromTuple, ignore, map, NormalParserFunc, regex, token } from "../src/index"
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
    ([year,month,day,hour,minute,sec,ms]) => ({
      year, month, day, hour, minute, sec, ms
    })
  )
  console.time()
  const m = format("2022-12-20T01:02:03.04", 0)
  console.timeEnd()
  expect(
    m
  ).toEqual([{
    year: "2022",
    month: "12",
    day: "20",
    hour: "01",
    minute: "02",
    sec: "03",
    ms: "04"
  }, 22])
})