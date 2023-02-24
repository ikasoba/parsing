export type ExtractWrap<T> = (
  T extends never
    ? never
  : T extends {x: {x: {x: infer R}}}
    ? ExtractWrap<R>
  : T extends {x: {x: infer R}}
    ? ExtractWrap<R>
  : T extends {x: infer R}
    ? ExtractWrap<R>
  : T
)

export type _Flat<T, R extends any[] = []> = (
  T extends [infer X extends any[], ...infer Y]
    ? {x: _Flat<Y, [...R, ...ExtractWrap<_Flat<X>>]>}
  : T extends [infer X, ...infer Y]
    ? {x: _Flat<Y, [...R, X]>}
  : R
)

export type Flat<T> = ExtractWrap<_Flat<T>>