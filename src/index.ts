import { ParsingError } from "./error"
import { ExtractWrap, Flat } from "./util"

export type NormalParserFunc<R> = (src: string, rawIndex: number) => [R, number] | null | ParsingError
export type IgnoreParserFunc = (src: string, rawIndex: number) => [number] | null | ParsingError
export type ParserFunc<R = never> = R extends never ? IgnoreParserFunc : NormalParserFunc<R>

export type ExtractParserResponse<T extends ParserFunc<any>> = T extends ParserFunc<infer R> ? R : never
export type _ExtractParserResponseFromTuple<T extends ParserFunc<any>[], R extends any[] = []> = (
  T extends [infer X extends NormalParserFunc<any[]>, ...infer Y extends any[]]
    ? {x: _ExtractParserResponseFromTuple<Y, [...R, ...ExtractParserResponse<X>]>}
  : T extends [infer X extends NormalParserFunc<any>, ...infer Y extends any[]]
    ? {x: _ExtractParserResponseFromTuple<Y, [...R, ExtractParserResponse<X>]>}
  : T extends [infer X extends IgnoreParserFunc, ...infer Y extends any[]]
    ? {x: _ExtractParserResponseFromTuple<Y, R>}
  : R
)

export type ExtractParserResponseFromTuple<T extends ParserFunc<any>[]> = (
  ExtractWrap<_ExtractParserResponseFromTuple<T>>
)

export function token(p: string | RegExp): NormalParserFunc<string> {
  return p instanceof RegExp
    ? regex(p)
    : (x, i) => x.startsWith(p, i) ? [p, i + p.length] : null
}

export function regex(p: RegExp): NormalParserFunc<string> {
  p = new RegExp(`^(?:${p.source})`, p.flags)
  return (x, i) => {
    const m = x.slice(i).match(p)
    return m ? [m[1] ?? m[0], i + m[0].length] : null
  }
}

export function some<T extends ParserFunc<any>[]>(...p: T): T[number] {
  return ((x, i) => {
    for (const f of p){
      const m = f(x, i)
      if (m)return m
    }
    return null
  }) as T[number]
}

export function every<T extends ParserFunc<any>[]>(...p: T): NormalParserFunc<ExtractParserResponseFromTuple<T>> {
  return ((x, i) => {
    const res: ExtractParserResponse<T[number]>[] = []
    for (const f of p){
      const m = f(x, i)
      if (m instanceof ParsingError || !m)return null
      if (m.length == 1){
        i = m[0]
        continue;
      }
      res.push(...m[0] instanceof Array ? m[0] : [m[0]])
      i = m[1]
    }
    return [res as any, i]
  })
}

export const ref = <T>(p: () => ParserFunc<T>) => (x: string, i: number) => p()(x, i)

export const option = <T>(p: NormalParserFunc<T>): NormalParserFunc<T | null> => (x: string, i: number) => {
  const res = p(x, i)
  return (res instanceof ParsingError) ? res : [!res ? null : res[0], i]
}

export const ignore = <T extends ParserFunc<any>>(p: T): IgnoreParserFunc => (x: string, i: number) => {
  const res = p(x, i)
  return (res instanceof ParsingError || res == null) ? res : [res.length == 2 ? res[1] : res[0]]
}

export const map = <T extends ParserFunc<any>, R>(parser: T, then: (matched: ExtractParserResponse<T>, i: number) => R): NormalParserFunc<R> => {
  return (x, i) => {
    const m = parser(x, i)
    if (m && !(m instanceof ParsingError)){
      return [then(m.length == 2 ? m[0] : null, i), m.length == 2 ? m[1] : m[0]];
    }else return null
  }
}