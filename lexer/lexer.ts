import { MemoryBuffer } from "../syntax/models"

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
    "MULTI_COMMENT": new TokenType("MULTI_COMMENT", "\/\/![\\s\\S]*!\/\/", true),
    "COMMENT": new TokenType("COMMENT", "\/\/.*", true),
    "FLOAT_NUMBER": new TokenType("FLOAT_NUMBER", "-*([0-9]*[.])?[0-9]+"),
    "NUMBER": new TokenType("NUMBER", "\\d+"),
    "COMMA": new TokenType("COMMA", ","),
    "DOT": new TokenType("DOT", "\\."),
    "GTE": new TokenType("GTE", ">="),
    "LTE": new TokenType("LTE", "<="),
    "GT": new TokenType("GT", ">"),
    "LT": new TokenType("LT", "<"),
    "OR": new TokenType("OR", "or"),
    "AND": new TokenType("AND", "and"),
    "EQUAL": new TokenType("EQUAL", "=="),
    "NOT_EQUAL": new TokenType("NOT_EQUAL", "!="),
    "STRING": new TokenType("STRING", "string"),
    "INT": new TokenType("INT", "int"),
    "FLOAT": new TokenType("FLOAT", "float"),
    "ASSIGN": new TokenType("ASSIGN", "="),
    "PLUS": new TokenType("PLUS", "\\+"),
    "MINUS": new TokenType("MINUS", "-"),
    "STAR": new TokenType("STAR", "\\*"),
    "DIV": new TokenType("DIV", "div"),
    "SLASH": new TokenType("SLASH", "\/"),
    "%": new TokenType("%", "\\%"),
    "RETURN": new TokenType("RETURN", "return"),
    "BREAK": new TokenType("BREAK", "break"),
    "CONTINUE": new TokenType("CONTINUE", "continue"),
    "WHILE": new TokenType("WHILE", "while"),
    "IF": new TokenType("IF", "if"),
    "ELSE": new TokenType("ELSE", "else"),
    "FUN_INIT": new TokenType("FUN_INIT", "fun [a-z_]+\\("),
    "PRINT": new TokenType("PRINT", "print\\(([a-z_]+[1-9]*|(,| ))+\\)"),
    "PRINT_STRING": new TokenType("PRINT_STRING", "print\\(\\'.*\\'\\)"),
    "FUN_CALL": new TokenType("FUN_CALL", "[a-z_]+\\(([a-z_]+[1-9]*|(,| ))+\\)"),
    "FUN_CALL2": new TokenType("FUN_CALL", "[a-z_]+\\(\\)"),
    "INIT_FUN_PARAMS": new TokenType("INIT_FUN_PARAMS", "([a-z_]+[1-9]*\\s*:\\s*[a-z]+|(,| ))+\\)"),
    "OPEN_EXPR": new TokenType("(", "\\("),
    "CLOSE_EXPR": new TokenType(")", "\\)"),
    "OPEN_BLOCK": new TokenType("{", "{"),
    "CLOSE_BLOCK": new TokenType("}", "}"),
    "STRING_CONST": new TokenType("STRING_CONST", "\\'.*\\'"),
    "VARIABLE": new TokenType("VARIABLE", "[a-z_]+[1-9]*"),
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

    public eval(): MemoryBuffer {
        return new MemoryBuffer(this.value, "token");
    }

    private validateStringValue(tokenValue: string): string {
        if (tokenValue.length == 2) {
            return tokenValue
        }
        return tokenValue.slice(1, tokenValue.length - 1)
    }

    public toString(): string {
        return this.type.name
    }

    public getTree(): object {
        return {
            'token': {
                'type': this.type.name,
                'value': this.value
            }
        }
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
