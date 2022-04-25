import { CodeBuffer } from "./code-generator"
import { Token } from "./lexer"
import { Env } from "./env-table"


function isArrayEquals(a: string[], b: string[]): boolean {
    if (a.length != b.length) {
        return false
    }
    return a.map((s, i) => s == b[i]).every(status => status === true)
}

let env = new Env()

export class Statement {
    public args: Array<Statement | Token>
    constructor (args: Array<Statement | Token> = []) {
        this.args = args
    }

    public toString(): string {
        return this.constructor['name']
    }

    public eval() {
        for (let arg of this.args) {
            arg.eval();
        }
        return ''
    }
}

export class VariableType extends Statement {
    public name: string

    constructor (name: string) {
        super()
        this.name = name
    }
}

export class VariableInit extends Statement {
    public type: string
    public name: string
    constructor (type: VariableType, name: Token) {
        super()
        this.type = type.name
        this.name = name.value
    }
}

export class Factor extends Statement {
    private brackets = false

    constructor (args: Array<Statement | Token> = [], brackets = false) {
        super(args)
        this.brackets = brackets
    }

    public eval() {
        let tempVariable = env.getTemp()
        let factor = this.args[0].eval()
        if (this.isNumeric(factor)) {
            CodeBuffer.emit(`mov [${tempVariable}], ${factor}\n`)
        } else {
            CodeBuffer.emit(`mov eax, [${factor}]\n`)
            CodeBuffer.emit(`mov [${tempVariable}], eax\n`)
        }
        return tempVariable
    }

    private isNumeric(s: string): boolean {
        return !isNaN(+s)
    }
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

    public eval() {
        if (!this.sign) {
            return this.left.eval()
        }

        const leftName = this.left.eval()
        const rightName = this.right.eval()

        CodeBuffer.emit("; ---MULTIPLY---\n")
        CodeBuffer.emit(`mov eax, [${leftName}]\n`)
        CodeBuffer.emit(`imul eax, [${rightName}]\n`)
        CodeBuffer.emit(`mov [${leftName}], eax\n`)
        env.freeTemp(rightName)

        return leftName
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

    public eval() {
        if (!this.sign) {
            return this.left.eval()
        }

        const leftName = this.left.eval()
        const rightName = this.right.eval()
        CodeBuffer.emit("; ---ADD---\n")
        CodeBuffer.emit(`mov eax, [${leftName}]\n`)
        CodeBuffer.emit(`add eax, [${rightName}]\n`)
        CodeBuffer.emit(`mov [${leftName}], eax\n`)
        env.freeTemp(rightName)

        return leftName
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

    public eval() {
        CodeBuffer.emit(this.left.eval() + this.sign + this.right.eval())
        return ''
    }
}

export class Expression extends Statement {
    public eval() {
        return this.args[0].eval()
    }
}

export class PreAssign extends Statement {
    public variable: VariableInit

    constructor (variable: VariableInit) {
        super()
        this.variable = variable
    }
}

export class PreReAssign extends Statement {
    public variableName: string

    constructor (variableName: string) {
        super()
        this.variableName = variableName
    }
}

export class Assign extends Statement {
    private variable: VariableInit
    private expression: Expression

    constructor (preAssign: PreAssign, expression: Expression) {
        super()
        this.variable = preAssign.variable
        this.expression = expression
    }

    public eval() {
        if (env.getDirectly(this.variable.name)) {
            throw new Error(`Variable '${this.variable.name}' already defined`);
        }
        const expressionResultName = this.expression.eval()
        env.add({ type: this.variable.type, name: this.variable.name, value: "?" })

        CodeBuffer.emit("; ---ASSIGN---\n")
        CodeBuffer.emit(`mov eax, [${expressionResultName}]\n`)
        CodeBuffer.emit(`mov [${this.variable.name}], eax\n`)
        env.freeTemp(expressionResultName);

        return '';
    }
}

export class ReAssign extends Statement {
    private variableName: string
    private expression: Expression

    constructor (preAssign: PreReAssign, expression: Expression) {
        super()
        this.expression = expression
        this.variableName = preAssign.variableName
    }

    public eval() {
        let variable = env.get(this.variableName)
        if (!variable) {
            throw new Error(`Undefined variable '${this.variableName}'`);
        }
        const expressionValue = this.expression.eval()
        if (variable.type == "int") {
            CodeBuffer.emit(`mov [${variable.name}], ${expressionValue}\n`)
        }
        return '';
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

    public eval() {
        this.statement.eval()
        return '';
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

    public eval() {
        CodeBuffer.emit("if ")
        this.expression.eval()
        CodeBuffer.emit("\n")
        this.block.eval()
        CodeBuffer.emit("end if\n")
        return ""
    }
}

export class IfElse extends Statement {
    private expression: Expression
    private block: Block
    private elseBlock: Block

    constructor (expression: Expression, block: Block, elseBlock: Block) {
        super()
        this.expression = expression
        this.block = block
        this.elseBlock = elseBlock
    }

    public eval() {
        CodeBuffer.emit("if ")
        this.expression.eval()
        CodeBuffer.emit("\n")
        this.block.eval()
        CodeBuffer.emit("else\n")
        this.elseBlock.eval()
        CodeBuffer.emit("end if\n")
        return ""
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

    public eval() {
        CodeBuffer.emit("while ")
        this.expression.eval()
        CodeBuffer.emit("\n")
        this.block.eval()
        CodeBuffer.emit("end while\n")
        return ""
    }
}

export class Function extends Statement {
    private name: string
    private params: string[]
    private block: Block

    constructor (funName: Token, params: Token, block: Block) {
        super()
        this.name = funName.value.slice(0, -1)
        //  remove spaces, remove end bracket ')' and split params to array
        this.params = params.value.replace(/\s/g, '').slice(0, -1).split(',');
        this.block = block
    }

    public eval() {
        CodeBuffer.emit("macro " + this.name + " " + this.params.join(',') + "\n")
        CodeBuffer.emit("{\n")
        this.block.eval()
        CodeBuffer.emit("}\n")
        return ""
    }
}

export class CallFunction extends Statement {
    private name: string

    constructor (funName: Token) {
        super()
        this.name = funName.value
    }
}

export class Print extends Statement {
    private params: string[]

    constructor (params: Token) {
        super()
        this.params = params.value.replace(/\s/g, '').slice(0, -1).split(',');
    }

    public eval() {
        for (let variableName of this.params) {
            let variable = env.get(variableName);
            if (!variable) {
                throw new Error(`Undefined variable '${variableName}'`);
            }
            switch (variable.type) {
                case "string": {
                    CodeBuffer.emit(`cinvoke printf, formatstr, ${variable.name}\n`)
                    break;
                }
                case "float": {
                    CodeBuffer.emit(`cinvoke printf, formatfloat, dword [${variable.name}], dword [${variable.name}+4]\n`)
                    break;
                }
                default: {
                    CodeBuffer.emit(`cinvoke printf, formatint, [${variable.name}]\n`)
                    break;
                }
            }
        }
        return '';
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
    new Rule(["FUN", "FUN_NAME", "FUN_PARAMS", "Block"], args => new Function(args[1] as Token, args[2] as Token, args[3] as Block)),


    new Rule(["WHILE", "Expression", "Block"], args => new While(args[1] as Expression, args[2] as Block)),
    new Rule(["IF", "Expression", "Block"], args => new If(args[1] as Expression, args[2] as Block)),

    new Rule(["{", "Statement", "}"], args => new Block(args[1] as Statement)),

    new Rule(["STRING"], args => new VariableType('string')),
    new Rule(["INT"], args => new VariableType('int')),
    new Rule(["FLOAT"], args => new VariableType('float')),
    new Rule(["VariableType", "VARIABLE"], args => new VariableInit(args[0] as VariableType, args[1] as Token)),


    new Rule(["VariableInit", "ASSIGN"], args => new PreAssign(args[0] as VariableInit)),
    new Rule(["VARIABLE", "ASSIGN"], args => new PreReAssign(args[0].eval())),
    new Rule(["PreAssign", "Expression", "NEWLINE"], args => new Assign(args[0] as PreAssign, args[1] as Expression)),
    new Rule(["PreReAssign", "Expression", "NEWLINE"], args => new ReAssign(args[0] as PreReAssign, args[1] as Expression)),
    new Rule(["PRINT", "(", "FUN_PARAMS", "NEWLINE"], args => new Print(args[2] as Token)),

    new Rule(["(", "Expression", ")"], args => new Factor([args[1]], true)),
    new Rule(["NUMBER"], args => new Factor(args)),
    new Rule(["FLOAT_NUMBER"], args => new Factor(args)),
    new Rule(["VARIABLE"], args => new Factor(args)),
    new Rule(["STRING_CONST"], args => new Factor(args)),

    new Rule(["Expression", "STAR", "Expression"], args => new Term(args[0] as Expression, "*", args[2] as Statement)),
    new Rule(["Expression", "SLASH", "Expression"], args => new Term(args[0] as Expression, "/", args[2] as Statement)),
    new Rule(["Factor"], args => new Term(args[0] as Statement, null, null)),

    new Rule(["Expression", "PLUS", "Add"], args => new Add(args[0] as Expression, "+", args[2] as Statement)),
    new Rule(["Expression", "MINUS", "Add"], args => new Add(args[0] as Expression, "-", args[2] as Statement)),
    new Rule(["Term"], args => new Add(args[0] as Term, null, null)),

    new Rule(["Expression", "LT", "Expression"], args => new Relation(args[0] as Expression, "<", args[2] as Expression)),
    new Rule(["Expression", "GT", "Expression"], args => new Relation(args[0] as Expression, ">", args[2] as Expression)),

    new Rule(["Relation"], args => new Expression(args)),
    new Rule(["Add"], args => new Expression(args)),

    new Rule(["Function"], args => new Statement(args)),
    new Rule(["Assign"], args => new Statement(args)),
    new Rule(["ReAssign"], args => new Statement(args)),
    new Rule(["While"], args => new Statement(args)),
    new Rule(["If"], args => new Statement(args)),
    new Rule(["Print"], args => new Statement(args)),
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

