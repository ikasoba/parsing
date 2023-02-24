import { ParsingError } from "./error.js"
import { ExtractWrap, Flat } from "./util.js"

export { ParsingError } from "./error.js"

export type ExtractParserResponse<T extends ParserFunc<any, any>> = T extends NormalParserFunc<infer R, any> ? R : never
export type _EveryResponse<T extends ParserFunc<any, any>[], R extends any[] = [], E extends any[] = []> = (
    T extends [NormalParserFunc<infer X extends any[]>, ...infer Y extends any[]]
      ? _EveryResponse<Y, [...R, ...X], E>
  : T extends [NormalParserFunc<infer X>, ...infer Y extends any[]]
      ? _EveryResponse<Y, [...R, X], E>
  : T extends [NormalParserFunc<infer X extends any[], infer Y>, ...infer Z extends any[]]
      ? _EveryResponse<Z, [...R, ...X], [...E, Y]>
  : T extends [NormalParserFunc<infer X, infer Y>, ...infer Z extends any[]]
      ? _EveryResponse<Z, [...R, X], [...E, Y]>
  : T extends []
    ? NormalParserFunc<R, E[number]>
  : T extends [IgnoreParserFunc<infer X>, ...infer Y extends any[]]
    ? _EveryResponse<Y, [...R], [...E, X]>
    : NormalParserFunc<R, E[number]>
);

export type EveryResponse<T extends ParserFunc<any, any>[]> = (
  ExtractWrap<_EveryResponse<T>>
)

export type NormalParserFunc<R, E = never> = (src: string, rawIndex: number) => Exclude<ParserResult<R, E>, {type: "ignore"}>
export type IgnoreParserFunc<E = never> = (src: string, rawIndex: number) => Exclude<ParserResult<never, E>, {type: "normal"}>
export type _ParserFunc<R extends [any] = [never], E extends [any] = [never]> = R extends [never] ? IgnoreParserFunc<E[0]> : NormalParserFunc<R[0], E[0]>
export type ParserFunc<R = never, E = never> = _ParserFunc<R extends any ? [any] | [never] : [R], [E]>

export type ParserResult<T, E = never> = _ParserResult<[T], [E]>
export type _ParserResult<T extends [any], E extends [any] = [never]> =
    {
      type: "ignore"
      index: number
      length: number
    }
  | {
      type: "normal"
      res: T[0]
      index: number
      length: number
    }
  | (
      E extends [never]
      ? never
      : {
          type: "error"
          error: E[0]
        }
    )
  | {
      type: "fail"
    }


export const isSafeResponse = <T, E>(x: ParserResult<T, E>): x is Exclude<ParserResult<T, never>, {type: "fail" | "error"}> => (
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
            index: i + p.length,
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
        index: i + m[0].length,
        length: m[0].length
      }
    else
      return {type: "fail"}
  }
}

export function some<T extends ParserFunc<any, any>[]>(...p: T): T[number] | (ParserResult<never> & {type: "fail"}) {
  return (x, i) => {
    for (const f of p){
      const m = f(x, i)
      if (!isSafeResponse(m))return m
    }
    return {type: "fail"}
  }
}

export function every<T extends ParserFunc<any, any>[]>(...p: T): EveryResponse<T> {
  return ((x: string, i: number) => {
    let length = 0
    const res: ParserResult<any, any>[] = []
    for (const f of p){
      const m = f(x, i)
      if (!isSafeResponse(m))return m as any;
      i = m.index
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

export const ref = <T, E>(p: () => ParserFunc<T, E>) => ((x: string, i: number) => p()(x, i)) as ParserFunc<T, E>

export const option = <T, E>(p: NormalParserFunc<T, E>): NormalParserFunc<T | null, E> => (x: string, i: number) => {
  const res = p(x, i)
  if (isSafeResponse(res)){
    return res
  }
  return {type: "normal", res: null, index: i, length: 0}
}

export const ignore = <E, T extends ParserFunc<any, E>>(p: T): IgnoreParserFunc<E> => (x: string, i: number) => {
  const res = p(x, i)
  if (!isSafeResponse(res)){
    return res as any
  }
  return {type: "ignore", index: res.index, length: res.length}
}

export const map = <T extends ParserFunc<any, any>, R extends any>(parser: T, then: (matched: ExtractParserResponse<T>, start: number, length: number) => R): NormalParserFunc<R, any> => {
  return (x, i) => {
    const m = parser(x, i)
    if (isSafeResponse(m)){
      return {
        type: "normal",
        res: then(m.type == "normal" ? m.res : undefined, i, m.length),
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

const a = every(every(token("1")), token("a"), ignore(token("b")), token("c"))(" ",1)