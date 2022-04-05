import { Token } from "./lexer"


function isArrayEquals(a: string[], b: string[]): boolean {
    if (a.length != b.length) {
        return false
    }
    return a.map((s, i) => s == b[i]).every(status => status === true)
}


export class Statement {
    public args: Array<Statement | Token>
    constructor (args: Array<Statement | Token> = []) {
        this.args = args
    }

    public toString(): string {
        return this.constructor['name']
    }
}

export class Factor extends Statement {
}

export class Term extends Statement {
    private left: Statement
    private right: Statement | null
    private sign: string | null

    constructor (left: Statement, sign: string | null, right: Statement | null) {
        super()
        this.left = left
        this.sign = sign
        this.right = right
    }
}

export class Add extends Statement {
    private left: Statement
    private right: Statement | null
    private sign: string | null

    constructor (left: Statement, sign: string | null, right: Statement | null) {
        super()
        this.left = left
        this.sign = sign
        this.right = right
    }
}

export class Relation extends Statement {
    private left: Expression
    private sign: string
    private right: Expression

    constructor (left: Expression, sign: string, right: Expression) {
        super()
        this.left = left
        this.sign = sign
        this.right = right
    }
}

export class Expression extends Statement {
}

export class PreAssign extends Statement {
    public variable

    constructor (variable: Token) {
        super()
        this.variable = variable.value
    }
}

export class Assign extends Statement {
    private variable: string
    private expression: Expression

    constructor (preAssign: PreAssign, expression: Expression) {
        super()
        this.variable = preAssign.variable
        this.expression = expression
    }
}

export class Return extends Statement {
    private expression: Expression

    constructor (expression: Expression) {
        super()
        this.expression = expression
    }
}

export class Block extends Statement {
    private statement: Statement

    constructor (statement: Statement) {
        super()
        this.statement = statement
    }
}

export class If extends Statement {
    private expression: Expression
    private block: Block

    constructor (expression: Expression, block: Block) {
        super()
        this.expression = expression
        this.block = block
    }
}

export class While extends Statement {
    private expression: Expression
    private block: Block

    constructor (expression: Expression, block: Block) {
        super()
        this.expression = expression
        this.block = block
    }
}

export class Function extends Statement {
    private name: string
    private params: Expression
    private block: Block

    constructor (funName: Token, params: Expression, block: Block) {
        super()
        this.name = funName.value
        this.params = params
        this.block = block
    }
}

export class CallFunction extends Statement {
    private name: string

    constructor (funName: Token) {
        super()
        this.name = funName.value
    }
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
    new Rule(["{", "Statement", "}"], args => new Block(args[1] as Statement)),

    new Rule(["IF", "Expression", "Block"], args => new If(args[1] as Expression, args[2] as Block)),
    new Rule(["WHILE", "Expression", "Block"], args => new While(args[1] as Expression, args[2] as Block)),
    new Rule(["FUN", "FUN_NAME", "Expression", ")", "Block"], args => new Function(args[1] as Token, args[2] as Expression, args[4] as Block)),
    new Rule(["FUN_NAME", ")"], args => new CallFunction(args[0] as Token)),

    new Rule(["RETURN", "Expression"], args => new Return(args[1] as Expression)),
    new Rule(["VARIABLE", "ASSIGN"], args => new PreAssign(args[0] as Token)),
    new Rule(["PreAssign", "Expression", "NEWLINE"], args => new Assign(args[0] as PreAssign, args[1] as Expression)),

    new Rule(["(", "Expression", ")"], args => new Factor([args[1]])),
    new Rule(["CallFunction"], args => new Factor(args)),
    new Rule(["NUMBER"], args => new Factor(args)),
    new Rule(["VARIABLE"], args => new Factor(args)),
    new Rule(["STRING"], args => new Factor(args)),

    new Rule(["Expression", "STAR", "Term"], args => new Term(args[0] as Expression, "*", args[2] as Statement)),
    new Rule(["Expression", "SLASH", "Term"], args => new Term(args[0] as Expression, "/", args[2] as Statement)),
    new Rule(["Factor"], args => new Term(args[0] as Statement, null, null)),

    new Rule(["Expression", "PLUS", "Add"], args => new Add(args[0] as Expression, "+", args[2] as Statement)),
    new Rule(["Expression", "MINUS", "Add"], args => new Add(args[0] as Expression, "-", args[2] as Statement)),
    new Rule(["Term"], args => new Add(args[0] as Term, null, null)),

    new Rule(["Expression", "LT", "Expression"], args => new Relation(args[0] as Expression, "<", args[2] as Expression)),
    new Rule(["Expression", "GT", "Expression"], args => new Relation(args[0] as Expression, "<", args[2] as Expression)),
    new Rule(["Expression", "OR", "Expression"], args => new Relation(args[0] as Expression, "or", args[2] as Expression)),
    new Rule(["Expression", "AND", "Expression"], args => new Relation(args[0] as Expression, "and", args[2] as Expression)),
    new Rule(["Expression", "EQUAL", "Expression"], args => new Relation(args[0] as Expression, "==", args[2] as Expression)),
    new Rule(["Expression", "NOT_EQUAL", "Expression"], args => new Relation(args[0] as Expression, "!=", args[2] as Expression)),

    new Rule(["Add"], args => new Expression(args)),
    new Rule(["Relation"], args => new Expression(args)),

    new Rule(["Function"], args => new Statement(args)),
    new Rule(["Assign"], args => new Statement(args)),
    new Rule(["If"], args => new Statement(args)),
    new Rule(["While"], args => new Statement(args)),
    new Rule(["Return"], args => new Statement(args)),
    new Rule(["CONTINUE"], args => new Statement(args)),
    new Rule(["BREAK"], args => new Statement(args)),
    new Rule(["Statement", "Statement"], args => new Statement(args)),
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
        console.log(this.statements.map(s => s.toString()));
        throw new Error("Syntax error. Can't build AST.");
    }

    private nextStep(): boolean {
        for (let rule of RULES) {
            const endIndex = this.startIndex + rule.length()
            const stringStatements = this.getStringStatements(this.startIndex, endIndex)
            if (rule.has(stringStatements)) {
                const newItem = rule.getStatement(this.statements.slice(this.startIndex, endIndex))
                // console.log(this.statements.map(s => s.toString()));
                this.joinElements(
                    this.startIndex,
                    endIndex,
                    newItem
                )
                // console.log("------------");

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

