
export class TokenType {
    readonly name: string
    readonly regex: RegExp
    readonly skip: boolean


    constructor (name: string, regex: string, skip: boolean = false) {
        this.name = name
        this.regex = new RegExp("^" + regex)
        this.skip = skip
    }
}


export const tokenTypesList = {
    "NEWLINE": new TokenType("NEWLINE", "\\n"),
    "SPACE": new TokenType("SPACE", "\\s", true),
    "NUMBER": new TokenType("NUMBER", "\\d+"),
    "COMMA": new TokenType("COMMA", ","),
    "DOT": new TokenType("DOT", "\\."),
    "GTE": new TokenType("GTE", ">="),
    "LTE": new TokenType("LTE", "<="),
    "GT": new TokenType("GT", ">"),
    "LT": new TokenType("LT", "<"),
    "OR": new TokenType("OR", "or"),
    "AND": new TokenType("OR", "and"),
    "EQUAL": new TokenType("EQUAL", "=="),
    "NOT_EQUAL": new TokenType("NOT_EQUAL", "!="),
    "ASSIGN": new TokenType("ASSIGN", "="),
    "PLUS": new TokenType("PLUS", "\\+"),
    "MINUS": new TokenType("MINUS", "-"),
    "STAR": new TokenType("STAR", "\\*"),
    "SLASH": new TokenType("SLASH", "\/"),
    "RETURN": new TokenType("RETURN", "return"),
    "BREAK": new TokenType("BREAK", "break"),
    "CONTINUE": new TokenType("CONTINUE", "continue"),
    "WHILE_LOOP": new TokenType("WHILE_LOOP", "while"),
    "IF_STATEMENT": new TokenType("IF_STATEMENT", "if"),
    "ELSE_STATEMENT": new TokenType("ELSE_STATEMENT", "else"),
    "INIT_FUNCTION": new TokenType("INIT_FUNCTION", "fun"),
    "OPEN_BRACKETS": new TokenType("OPEN_BRACKETS", "\\("),
    "CLOSE_BRACKETS": new TokenType("CLOSE_BRACKETS", "\\)"),
    "OPEN_STATEMENT": new TokenType("OPEN_STATEMENT", "{"),
    "CLOSE_STATEMENT": new TokenType("CLOSE_STATEMENT", "}"),
    "MULTI_COMMENT": new TokenType("MULTI_COMMENT", "#![\\s\\S]*!#", true),
    "COMMENT": new TokenType("COMMENT", "#.*\\n", true),
    "STRING": new TokenType("STRING", "\\'.*\\'"),
    "VARIABLE": new TokenType("VARIABLE", "[a-z_]+"),
}


export class Token {
    readonly type: TokenType
    readonly value: string

    constructor (type: TokenType, value: string) {
        this.type = type
        this.value = value

        if (type.name == "STRING") {
            this.value = this.validateStringValue(value)
        }
    }

    public validateStringValue(tokenValue: string): string {
        if (tokenValue.length == 2) {
            return tokenValue
        }
        return tokenValue.slice(1, tokenValue.length - 1)
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

    constructor (code: string) {
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

            if (!match.type.skip) {
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
