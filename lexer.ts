
export class TokenType {
    readonly name: string
    readonly regex: RegExp


    constructor(name: string, regex: string) {
        this.name = name
        this.regex = new RegExp("^" + regex)
    }
}


export const tokenTypesList = {
    "NEWLINE": new TokenType("NEWLINE", "\\n"),
    "SPACE": new TokenType("SPACE", "\\s"),
    "NUMBER": new TokenType("NUMBER", "\\d+"),
    "ASSIGN": new TokenType("ASSIGN", "="),
    "PLUS": new TokenType("PLUS", "\\+"),
    "MINUS": new TokenType("MINUS", "-"),
    "VARIABLE": new TokenType("VARIABLE", "[a-z]+")
}


export class Token {
    readonly type: TokenType
    readonly value: string

    constructor(type: TokenType, value: string) {
        this.type = type
        this.value = value
    }
}


type LexerMatch = {
    word: string,
    type: TokenType
}


export class Lexer {
    private startCode: string
    private code: string
    private tokens: Token[]
    private position: number
    private lineNumber: number

    constructor(code: string) {
        this.startCode = code
        this.code = code
        this.tokens = []
        this.position = 0
        this.lineNumber = 0
    }

    public getTokens() {
        while (true) {
            if (!this.code) {
                return this.tokens
            }
            const match = this.getMatch()
            if (match === null) {
                throw new Error(`Lexer exception on ${this.lineNumber}:${this.position} '${this.getCheckingLine()}'`)
            }
            this.code = this.code.substring(match.word.length)
            this.updatePosition(match)

            if (match.type.name != "SPACE") {
                this.tokens.push(new Token(match.type, match.word))
            }
        }
    }

    private updatePosition(match: LexerMatch) {
        if (match.type.name == "NEWLINE") {
            this.position = 0
            this.lineNumber += 1
        } else {
            this.position += match.word.length
        }
    }

    private getMatch(): LexerMatch | null {
        for (let key in tokenTypesList) {
            const tokenType: TokenType = tokenTypesList[key]
            const match = this.code.match(tokenType.regex)
            if (match) {
                return {
                    word: match[0],
                    type: tokenType
                }
            }
        }
        return null
    }

    private getCheckingLine(): string {
        const lines = this.startCode.split("\n", this.lineNumber + 1)
        return lines[lines.length - 1]
    }
}
