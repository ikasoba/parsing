export function getLine(src: string, index: number){
  return (src.slice(0, index).match(/\n/g)?.length ?? 1) - 1
}

export function getLineIndex(src: string, index: number){
  const v = src.slice(0, index).lastIndexOf("\n")
  if (v >= 0){
    return index - v
  }
  else return 0
}

export class ParsingError<E> {
  public name = this.constructor.name
  public location: {
    start: {line: number, index: number}
    end: {line: number, index: number}
  }
  constructor(
    start: number,
    end: number,
    public source: string,
    public error: E
  ){
    this.location = {
      start: {
        line: getLine(source, start),
        index: getLineIndex(source, start)
      },
      end: {
        line: getLine(source, end),
        index: getLineIndex(source, end)
      }
    }
  }
}