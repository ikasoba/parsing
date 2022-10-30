export type ParserFunc<R,T extends "space" | null = null> = (i: number, s: string) => ([
  number,
  R,
  ...(T extends "space" ? ["space"] : [])
] | null)

export type ArrayOrT<T> = T | T[]

export type ParserFuncReturnType<F extends ParserFunc<any,any>> = Exclude<ReturnType<F>,null>[1]
export type AndResponseType<A extends ParserFunc<any,any>[]> = Exclude<ParserFuncReturnType<Exclude<A[number], ParserFunc<any, "space">>>, any[]>[]
export type ParserReturnValueType<ASTType extends {} = never> = ArrayOrT<string | ASTType | null | Error>

export class Parser<ASTType extends {} = never> {
  token(pattern: string | RegExp): ParserFunc<string> {
    return ((i, s) => {
      if (typeof pattern == "string"){
        return s.startsWith(pattern, i) ? [i + pattern.length, pattern] : null
      }else if (pattern instanceof RegExp){
        const m = s.slice(i).match(new RegExp(`^(?:${pattern.source})`, pattern.flags))
        return m ? [i + (m[1] ?? m[0]).length, (m[1] ?? m[0])] : null
      }
      return null
    })
  }

  ref<T extends ParserFunc<ParserReturnValueType, "space" | null>>(f: () => T): T {
    return ((i,s) => {
      return f()(i,s)
    }) as T
  }

  option<T extends ParserReturnValueType<ASTType>>(pattern: ParserFunc<T>): ParserFunc<T | null> {
    return ((i,s) => {
      const r = pattern(i,s)
      if (r)i = r[0]
      return [i, r?.[1] ?? null]
    })
  }

  space<T extends string>(pattern: ParserFunc<T>): ParserFunc<null, "space"> {
    return (i,s) => {
      const r = pattern(i,s)
      return r ? [r[0], null, "space"] : null
    }
  }

  or<T extends ParserReturnValueType<ASTType>>(...funcs: (ParserFunc<T>)[]): ParserFunc<T> {
    return ((i,s) => {
      for (const f of funcs){
        const r = f(i, s)
        if (r)return r;
      }
      return null;
    })
  }

  and<F extends ParserFunc<ParserReturnValueType<ASTType>, "space" | null>[]>(...funcs: F): ParserFunc<AndResponseType<F>> {
    return (i,s) => {
      const res: AndResponseType<F> = []
      for (const f of funcs){
        const r = f(i, s)
        if (r == null)return null;
        i = r[0]
        if (r[2] != "space")res.push(...(r[1] instanceof Array ? r[1] : [r[1]]) as AndResponseType<F>)
      }
      return [i, res];
    }
  }

  tree<T extends ParserReturnValueType<ASTType>, T2 extends ParserFunc<ParserReturnValueType<ASTType>, "space" | null>>(pattern: T2, parser: (a:(Exclude<ReturnType<T2>,null>[1])) => T): ParserFunc<T> {
    return (i, s) => {
      const res = pattern(i, s);
      if (!res)return null;
      i = res[0]
      const astRes = parser(res[1] instanceof Array ? res[1] : [res[1]])
      if (!astRes)return null;
      return [i, astRes]
    }
  }

}

export default Parser