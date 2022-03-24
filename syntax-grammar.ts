import { Token } from "./lexer"


function isArrayEquals(a: string[], b: string[]): boolean {
    if (a.length != b.length) {
        return false
    }
    return a.map((s, i) => s == b[i]).every(status => status === true)
}


export class Statement {
    private args: Array<Statement | Token>
    constructor (args: Array<Statement | Token>) {
        this.args = args
    }
    public toString(): string {
        return this.constructor['name']
    }
}

export class Seq extends Statement {
}

export class Factor extends Statement {
}

export class Term extends Statement {
}

export class Add extends Statement {
}

export class Relation extends Statement {
}

export class Expression extends Statement {
}

export class PreAssign extends Statement {
}

export class Assign extends Statement {
}

export class Block extends Statement {
}

export class If extends Statement {
}

export class While extends Statement {
}


type StatementConstructor = (args: Array<Statement | Token>) => Statement;


export class Rule {
    private production: string[]
    private resultConstructor: StatementConstructor

    constructor (production: string[], resultConstructor: StatementConstructor) {
        this.production = production
        this.resultConstructor = resultConstructor
    }

    public getStatement(args: Array<Statement | Token>): Statement {
        return this.resultConstructor(args)
    }

    public has(statements: string[]): boolean {
        return isArrayEquals(statements, this.production)
    }

    public length(): number {
        return this.production.length
    }
}

const RULES = [
    new Rule(["{", "Seq", "}"], args => new Block(args)),

    new Rule(["IF", "Expression", "Block"], args => new If(args)),
    new Rule(["WHILE", "Expression", "Block"], args => new While(args)),

    new Rule(["VARIABLE", "ASSIGN"], args => new PreAssign(args)),
    new Rule(["PreAssign", "Expression", "NEWLINE"], args => new Assign(args)),

    new Rule(["(", "Expression", ")"], args => new Factor(args)),
    new Rule(["NUMBER"], args => new Factor(args)),
    new Rule(["VARIABLE"], args => new Factor(args)),

    new Rule(["Expression", "STAR", "Term"], args => new Term(args)),
    new Rule(["Expression", "SLASH", "Term"], args => new Term(args)),
    new Rule(["Factor"], args => new Term(args)),

    new Rule(["Expression", "PLUS", "Add"], args => new Add(args)),
    new Rule(["Expression", "MINUS", "Add"], args => new Add(args)),
    new Rule(["Term"], args => new Add(args)),

    new Rule(["Expression", "LT", "Expression"], args => new Relation(args)),
    new Rule(["Expression", "GT", "Expression"], args => new Relation(args)),
    new Rule(["Expression", "OR", "Expression"], args => new Relation(args)),
    new Rule(["Expression", "AND", "Expression"], args => new Relation(args)),
    new Rule(["Expression", "EQUAL", "Expression"], args => new Relation(args)),
    new Rule(["Expression", "NOT_EQUAL", "Expression"], args => new Relation(args)),


    new Rule(["Add"], args => new Expression(args)),
    new Rule(["Relation"], args => new Expression(args)),
    new Rule(["STRING"], args => new Expression(args)),



    new Rule(["Assign"], args => new Statement(args)),
    new Rule(["If"], args => new Statement(args)),
    new Rule(["While"], args => new Statement(args)),
    new Rule(["CONTINUE"], args => new Statement(args)),
    new Rule(["BREAK"], args => new Statement(args)),

    new Rule(["Statement"], args => new Seq(args)),
    new Rule(["Seq", "Seq"], args => new Seq(args)),
    new Rule(["NEWLINE"], args => new Statement(args)),
]



export class Grammar {
    private statements: Array<Statement | Token>

    private startIndex: number

    constructor (tokens: Token[]) {
        this.statements = tokens
        this.startIndex = 0
    }

    public getAST(): Statement {
        while (true) {
            if (this.nextStep()) {
                this.startIndex = 0
                continue
            }

            this.startIndex += 1
            if (this.startIndex == this.statements.length) {
                break
            }
        }

        if (this.statements.length == 1) {
            return this.statements[0] as Statement
        }
        throw new Error("Syntax error. Can't build AST.");
    }

    private nextStep(): boolean {
        for (let rule of RULES) {
            const endIndex = this.startIndex + rule.length()
            const stringStatements = this.getStringStatements(this.startIndex, endIndex)
            if (rule.has(stringStatements)) {
                const newItem = rule.getStatement(this.statements.slice(this.startIndex, endIndex))
                console.log(this.statements.map(s => s.toString()));
                this.joinElements(
                    this.startIndex,
                    endIndex,
                    newItem
                )
                console.log("------------");

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