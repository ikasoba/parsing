export function getLine(src: string, index: number){
  return (src.slice(0, index).match(/\r\n|\r|\n/g)?.length || 1) - 1
}

export class ParsingError {
  public name = this.constructor.name
  public index: number
  public line: number
  constructor(
    public rawIndex:   number,
    public source:     string,
    public sourceName: string = "<anonymous>",
/**/       index?:     number,
/**/       line?:      number
  ){
    if (line == null || index == null){
      this.line  = getLine(source, rawIndex)
      this.index = 1 + (
        [
          source.slice(0,rawIndex).lastIndexOf("\r\n"),
          source.slice(0,rawIndex).lastIndexOf("\r"),
          source.slice(0,rawIndex).lastIndexOf("\n")
        ]
        .filter(x => x >= 0)
        .sort()[0] ?? 0
      )
    }else{
      this.index = index
      this.line  = line
    }
  }

  toString(){
    return `${this.name}\n`
          +`    at ${this.sourceName}:${this.line}:${this.index}`
  }
}