import { Token } from "./lexer"

export class Production {
    private productions: Array<Array<string>>

    constructor (productions: Array<Array<string>>) {
        this.productions = productions
    }

    public has(statements: string[]): boolean {
        for (let production of this.productions) {
            if (production.length == statements.length) {
                if (this.isArrayEquals(production, statements)) {
                    return true
                }
            }
        }
        return false
    }

    private isArrayEquals(a: string[], b: string[]): boolean {
        if (a.length != b.length) {
            return false
        }
        return a.map((s, i) => s == b[i]).every(status => status === true)
    }
}

export class Statement {
    private args: Array<Statement | Token>
    static production = new Production([
        ["Assign"],
        ["NEWLINE"],
    ])

    constructor (args: Array<Statement | Token>) {
        this.args = args
    }

    public toString(): string {
        return this.constructor['name']
    }
}

export class Seq extends Statement {
    static production = new Production([
        ["Seq", "Seq"],
        ["Statement"],
    ])

}

export class Factor extends Statement {
    static production = new Production([
        ["NUMBER"],
        ["OPEN_EXPR", "Expression", "CLOSE_EXPR"]
    ])

}

export class Term extends Statement {
    static production = new Production([
        ["Term", "STAR", "Factor"],
        ["Term", "SLASH", "Factor"],
        ["Factor"]
    ])
}

export class Expression extends Statement {
    static production = new Production([
        ["Expression", "PLUS", "Term"],
        ["Expression", "MINUS", "Term"],
        ["Term"]
    ])

}

export class Assign extends Statement {
    static production = new Production([
        ["VARIABLE", "ASSIGN", "Expression", "NEWLINE"]
    ])

}

const STATEMENT_TYPES = [
    Factor,
    Term,
    Expression,
    Seq,
    Assign,
    Statement,
]



export class Grammar {
    private statements: Array<Statement | Token>

    private startIndex: number
    private endIndex: number

    constructor (tokens: Token[]) {
        this.statements = tokens
        this.startIndex = 0
        this.endIndex = 1
    }

    public getAST() {
        while (true) {
            const stringStatements = this.getStringStatements(this.startIndex, this.endIndex)
            if (stringStatements.length == 0) {
                break
            }

            if (this.nextStep(stringStatements)) {
                this.startIndex = 0
                this.endIndex = 1
                continue
            }


            this.endIndex += 1
            if (this.endIndex == this.statements.length + 1) {
                this.startIndex += 1
                this.endIndex = this.startIndex + 1
            }
        }
        console.log(this.statements);
    }

    private nextStep(stringStatements: string[]): boolean {
        for (let statementType of STATEMENT_TYPES) {
            if (statementType.production.has(stringStatements)) {
                const newItem = new statementType(this.statements.slice(this.startIndex, this.endIndex))
                this.joinElements(
                    this.startIndex,
                    this.endIndex,
                    newItem
                )
                console.log("-----------------------");
                console.log(this.statements);
                console.log(stringStatements, "->", newItem.toString());
                return true
            }
        }
        return false
    }

    private joinElements(start: number, end: number, newElement: Statement) {
        this.statements.splice(start, end - start, newElement)
    }

    private getStringStatements(start: number, end: number): string[] {
        const stringStatements: string[] = this.statements.map(s => s.toString())
        return stringStatements.slice(start, end)
    }
}