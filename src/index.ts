import { ParsingError } from "./error.js"
import { ExtractWrap, Flat } from "./util.js"

export { ParsingError } from "./error.js"

export type ExtractParserResponse<T extends ParserFunc<any, any>> = T extends NormalParserFunc<infer R, any | never> ? R : never
export type ExtractParserError<T extends ParserFunc<any, any>> = T extends NormalParserFunc<any, infer R> ? R : never
export type _ParserFilter<T extends ParserFunc<any, any>[], R extends any[] = [], E extends any[] = []> = (
    T extends [NormalParserFunc<infer X extends any[]>, ...infer Y extends any[]]
      ? _ParserFilter<Y, [...R, ...X], [...E, never]>
  : T extends [NormalParserFunc<infer X>, ...infer Y extends any[]]
      ? _ParserFilter<Y, [...R, X], [...E, never]>
  : T extends [NormalParserFunc<infer X extends any[], infer Y>, ...infer Z extends any[]]
      ? _ParserFilter<Z, [...R, ...X], [...E, Y]>
  : T extends [NormalParserFunc<infer X, infer Y>, ...infer Z extends any[]]
      ? _ParserFilter<Z, [...R, X], [...E, Y]>
  : T extends []
    ? [R extends [] ? any[] : R, E[number], E]
  : T extends [IgnoreParserFunc<infer X>, ...infer Y extends any[]]
    ? _ParserFilter<Y, [...R], [...E, X]>
    : [R extends [] ? any[] : R, E[number], E]
);

export type ParserFilter<T extends ParserFunc<any, any>[]> = (
  ExtractWrap<_ParserFilter<T>>
)

export type EveryResponse<T extends ParserFunc<any, any>[], A extends [any, any, any] = ParserFilter<T>> = (
    A extends null
      ? EveryResponse<T, ParserFilter<T>>
  : A extends [any, any, any]
      ? NormalParserFunc<A[0], A[1]>
      : never
)

export type NormalParserFunc<R, E = never> = (src: string, rawIndex: number) => Exclude<ParserResult<R, E>, {type: "ignore"}>
export type IgnoreParserFunc<E = never> = (src: string, rawIndex: number) => Exclude<ParserResult<never, E>, {type: "normal"}>
export type _ParserFunc<R extends [any] = [never], E extends [any] = [never]> = R extends [never] ? IgnoreParserFunc<E[0]> : NormalParserFunc<R[0], E[0]>
export type ParserFunc<R = never, E = never> = _ParserFunc<R extends any ? [any] | [never] : [R], [E]>

export type ParserResult<T extends any, E = never> =
    {
      type: "ignore"
      index: number
      length: number
    }
  | {
      type: "normal"
      res: T
      index: number
      length: number
    }
  | {
      type: "error"
      error: E
    }
  | {
      type: "fail"
    }


export const isSafeResponse = <T, E>(x: ParserResult<T, E>): x is Exclude<ParserResult<T, E>, {type: "fail" | "error"}> => (
  x.type != "error" && x.type != "fail"
)

export function token(p: string | RegExp): NormalParserFunc<string> {
  return p instanceof RegExp
    ? regex(p)
    : (x, i) => {
        if (x.startsWith(p, i))
          return {
            type: "normal",
            res: p,
            index: i,
            length: p.length
          }
        else
          return {type: "fail"}
      }
}

export function regex(p: RegExp): NormalParserFunc<string> {
  p = new RegExp(`^(?:${p.source})`, p.flags)
  return (x, i) => {
    const m = x.slice(i).match(p)
    if (m)
      return {
        type: "normal",
        res: m[1] ?? m[0],
        index: i,
        length: m[0].length
      }
    else
      return {type: "fail"}
  }
}

export function some<T extends ParserFunc<any, any>[]>(...p: T): T[number] {
  return (x, i) => {
    for (const f of p){
      const m = f(x, i)
      if (isSafeResponse(m) || !isSafeResponse(m) && m.type != "fail")return m as any
    }
    return {type: "fail"}
  }
}

export function every<T extends ParserFunc<any, any>[]>(...p: T): EveryResponse<T> {
  return ((x: string, i: number) => {
    let length = 0
    const res: ParserResult<any, any>[] = []
    for (const f of p){
      const m = f(x, i + length)
      if (!isSafeResponse(m))return m as any;
      length += m.length
      //@ts-ignore
      if (m.type == "ignore"){
        continue;
      }
      if (m.res instanceof Array){
        res.push(...m.res)
      }else{
        res.push(m.res)
      }
    }
    return {
      type: "normal",
      index: i,
      res: res as any,
      length: length
    }
  }) as any
}

export const ref = <T, E, P extends  NormalParserFunc<T, E> | IgnoreParserFunc<E>>(p: () => P) => ((x: string, i: number) => p()(x, i)) as P

export const option = <T extends ParserFunc<any, any>>(p: T): NormalParserFunc<ExtractParserResponse<T> | null, ExtractParserError<T>> => (x: string, i: number) => {
  const res = p(x, i)
  if (isSafeResponse(res) && res.type != "ignore"){
    return res
  }
  return {type: "normal", res: null, index: i, length: 0}
}

export const ignore = <T extends ParserFunc<any, any> | RegExp | string>(p: T): IgnoreParserFunc<ExtractParserError<T extends string | RegExp ? NormalParserFunc<string> : T>> => (x: string, i: number) => {
  if ((p instanceof RegExp) || typeof p == "string"){
    return ignore(token(p))(x, i)
  }
  const res = p(x, i)
  if (!isSafeResponse(res)){
    return res as any
  }
  return {type: "ignore", index: res.index, length: res.length}
}

export function map<P extends ParserFunc<any, any>, R>(
  parser: P, then: (matched: ExtractParserResponse<P>, start: number, length: number, source: string) => R
): NormalParserFunc<R, ExtractParserError<P>> {
  return (x, i) => {
    const m = parser(x, i)
    if (isSafeResponse(m)){
      return {
        type: "normal",
        res: then(m.type == "normal" ? m.res : undefined, i, m.length, x),
        index: m.index,
        length: m.length
      }
    }
    return m
  }
}

export const takeUntil = <T extends ParserFunc<any>>(parser: T): NormalParserFunc<string> => (x, i) => {
  let res = ""
  let length = 0
  while (1){
    const m = parser(x, i)
    if (isSafeResponse(m)){
      if (res == ""){
        return {type: "fail"}
      }else{
        return {
          type: "normal",
          res: res,
          index: i,
          length: length
        }
      }
    }
    length += 1
    res += x[i++]
  }
  return {
    type: "normal",
    res: res,
    index: i,
    length: res.length
  }
}

export const many = <P extends (NormalParserFunc<any, any> | IgnoreParserFunc<any>)[]>(..._p: P): NormalParserFunc<ExtractParserResponse<EveryResponse<P>>[], ExtractParserError<P[number]>> => (x, i) => {
  const res = []
  let length = 0
  const p = every(..._p)
  while (1){
    const m = p(x, i + length)
    if (!isSafeResponse(m)){
      return res.length ? {
        type: "normal",
        index: i,
        length: length,
        res: res
      } : m
    }
    length += m.length
    if (m.type == "normal")res.push(m.res)
  }
  return {
    type: "normal",
    index: i,
    length: length,
    res: res as any
  }
}

const a = many(token("a"), ignore(token("b")), )
