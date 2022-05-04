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
    public isConstant = false

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

    constructor (args: Array<Statement | Token> = []) {
        super(args)
    }

    public eval() {
        if (this.args[0] instanceof Expression) {
            return this.args[0].eval()
        }

        const register = env.getFreeRegister()
        const factor = this.args[0].eval()

        if (this.isNumeric(factor)) {
            CodeBuffer.emit(`mov ${register}, ${factor}\n`)
        } else {
            CodeBuffer.emit(`mov ${register}, [${factor}]\n`)
        }
        return register
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
        if (this.sign == "*") {
            CodeBuffer.emit(`imul ${leftName}, ${rightName}\n`)
            env.freeRegister(rightName)
            return leftName
        } else {
            CodeBuffer.emit(`mov eax, ${leftName}\n`)
            CodeBuffer.emit(`idiv ${rightName}\n`)
            env.freeRegister(leftName)
            env.freeRegister(rightName)
            return 'eax'
        }
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
        CodeBuffer.emit(`${this.getCommand()} ${leftName}, ${rightName}\n`)
        env.freeRegister(rightName)

        return leftName
    }

    private getCommand(): string {
        if (this.sign == "-") {
            return "sub"
        }
        return "add"
    }
}

export class Comparing extends Statement {
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
        const leftRegister = this.left.eval()
        const rightRegister = this.right.eval()
        CodeBuffer.emit(`cmp ${leftRegister}, ${rightRegister}\n`)
        env.freeRegister(leftRegister)
        env.freeRegister(rightRegister)
        const resultRegister = env.getFreeRegister()
        CodeBuffer.emit(`mov eax, 0\n`)
        CodeBuffer.emit(`lahf\n`)
        switch (this.sign) {
            case "==": {
                CodeBuffer.emit(`and ah, 64\n`)
                break;
            }
            case "<": {
                CodeBuffer.emit(`and ah, 1\n`)
                break;
            }
            case ">": {
                CodeBuffer.emit(`and ah, 65\n`)
                CodeBuffer.emit(`cmp eax, 0\n`)
                const tempLabel = env.newLabel()
                CodeBuffer.emit(`jne ${tempLabel}\n`)
                CodeBuffer.emit(`mov eax, 1\n`)
                CodeBuffer.emit(`jmp end${tempLabel}\n`)
                CodeBuffer.emit(`${tempLabel}:\n`)
                CodeBuffer.emit(`mov eax, 0\n`)
                CodeBuffer.emit(`end${tempLabel}:\n`)
                break;
            }
            case "<=": {
                CodeBuffer.emit(`and ah, 65\n`)
                break;
            }
            case ">=": {
                CodeBuffer.emit(`and ah, 1\n`)
                CodeBuffer.emit(`cmp eax, 0\n`)
                const tempLabel = env.newLabel()
                CodeBuffer.emit(`jne ${tempLabel}\n`)
                CodeBuffer.emit(`mov eax, 1\n`)
                CodeBuffer.emit(`jmp end${tempLabel}\n`)
                CodeBuffer.emit(`${tempLabel}:\n`)
                CodeBuffer.emit(`mov eax, 0\n`)
                CodeBuffer.emit(`end${tempLabel}:\n`)
                break;
            }
        }
        CodeBuffer.emit(`mov ${resultRegister}, eax\n`)
        return resultRegister
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
        const resultRegister = this.expression.eval()
        env.add({ type: this.variable.type, name: this.variable.name, value: "?" })

        CodeBuffer.emit("; ---ASSIGN---\n")
        CodeBuffer.emit(`mov [${this.variable.name}], ${resultRegister}\n`)
        env.freeRegister(resultRegister);

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
        const resultRegister = this.expression.eval()
        CodeBuffer.emit("; ---REASSIGN---\n")
        CodeBuffer.emit(`mov [${variable.name}], ${resultRegister}\n`)
        env.freeRegister(resultRegister)
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
    readonly expression: Expression
    readonly block: Block

    constructor (expression: Expression, block: Block) {
        super()
        this.expression = expression
        this.block = block
    }

    public eval() {
        const label = env.newLabel()
        CodeBuffer.emit(`; --- IF ---\n`)
        CodeBuffer.emit(`${label}:\n`)
        const comparingRegister = this.expression.eval()
        CodeBuffer.emit(`cmp ${comparingRegister}, 0\n`)
        env.freeRegister(comparingRegister)

        CodeBuffer.emit(`je end${label}\n`)
        this.block.eval()
        CodeBuffer.emit(`end${label}:\n`)
        return ""
    }
}

export class PreIfElse extends Statement {
    readonly ifStatement: If

    constructor (ifStatement: If) {
        super()
        this.ifStatement = ifStatement
    }
}

export class IfElse extends Statement {
    private expression: Expression
    private block: Block
    private elseBlock: Block

    constructor (preIfElse: PreIfElse, elseBlock: Block) {
        super()
        this.expression = preIfElse.ifStatement.expression
        this.block = preIfElse.ifStatement.block
        this.elseBlock = elseBlock
    }

    public eval() {
        const label = env.newLabel()
        CodeBuffer.emit(`; --- IFELSE ---\n`)
        CodeBuffer.emit(`${label}:\n`)
        const comparingRegister = this.expression.eval()
        CodeBuffer.emit(`cmp ${comparingRegister}, 0\n`)
        env.freeRegister(comparingRegister)

        CodeBuffer.emit(`je else${label}\n`)
        this.block.eval()
        CodeBuffer.emit(`jmp end${label}\n`)
        CodeBuffer.emit(`else${label}:\n`)
        this.elseBlock.eval()
        CodeBuffer.emit(`end${label}:\n`)
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
        const label = env.newLabel()
        CodeBuffer.emit("; ---WHILE---\n")
        CodeBuffer.emit(`${label}:\n`)
        const comparingRegister = this.expression.eval()
        CodeBuffer.emit(`cmp ${comparingRegister}, 0\n`)
        CodeBuffer.emit(`je end${label}\n`)
        this.block.eval()
        CodeBuffer.emit(`jmp ${label}\n`)
        CodeBuffer.emit(`end${label}:\n`)
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
                case "float": {
                    CodeBuffer.emit(`cinvoke printf, formatfloat, dword [${variable.name}], dword [${variable.name}+4]\n`)
                    break;
                }
                default: { // int
                    CodeBuffer.emit(`cinvoke printf, formatint, [${variable.name}]\n`)
                    break;
                }
            }
        }
        return '';
    }
}

export class PrintString extends Statement {
    private stringConstant: string

    constructor (stringConstant: Token) {
        super()
        this.stringConstant = stringConstant.value
    }

    public eval() {
        let tempName = env.saveTempString(this.stringConstant)
        CodeBuffer.emit(`cinvoke printf, formatstr, ${tempName}\n`)
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
    new Rule(["If", "ELSE"], args => new PreIfElse(args[0] as If)),
    new Rule(["PreIfElse", "Block"], args => new IfElse(args[0] as PreIfElse, args[1] as Block)),

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
    new Rule(["PRINT", "(", "STRING_CONST", ")", "NEWLINE"], args => new PrintString(args[2] as Token)),

    new Rule(["(", "Expression", ")"], args => new Factor([args[1]])),
    new Rule(["NUMBER"], args => new Factor(args)),
    new Rule(["FLOAT_NUMBER"], args => new Factor(args)),
    new Rule(["VARIABLE"], args => new Factor(args)),

    new Rule(["Expression", "STAR", "Factor"], args => new Term(args[0] as Expression, "*", args[2] as Statement)),
    new Rule(["Expression", "SLASH", "Factor"], args => new Term(args[0] as Expression, "/", args[2] as Statement)),
    new Rule(["Factor"], args => new Term(args[0] as Statement, null, null)),

    new Rule(["Expression", "PLUS", "Expression"], args => new Add(args[0] as Expression, "+", args[2] as Statement)),
    new Rule(["Expression", "MINUS", "Expression"], args => new Add(args[0] as Expression, "-", args[2] as Statement)),
    new Rule(["Term"], args => new Add(args[0] as Term, null, null)),

    new Rule(["Expression", "LT", "Expression"], args => new Comparing(args[0] as Expression, "<", args[2] as Expression)),
    new Rule(["Expression", "GT", "Expression"], args => new Comparing(args[0] as Expression, ">", args[2] as Expression)),
    new Rule(["Expression", "GTE", "Expression"], args => new Comparing(args[0] as Expression, ">=", args[2] as Expression)),
    new Rule(["Expression", "LTE", "Expression"], args => new Comparing(args[0] as Expression, "<=", args[2] as Expression)),
    new Rule(["Expression", "EQUAL", "Expression"], args => new Comparing(args[0] as Expression, "==", args[2] as Expression)),
    new Rule(["Expression", "NOT_EQUAL", "Expression"], args => new Comparing(args[0] as Expression, "!=", args[2] as Expression)),

    new Rule(["Comparing"], args => new Expression(args)),
    new Rule(["Add"], args => new Expression(args)),

    new Rule(["Function"], args => new Statement(args)),
    new Rule(["Assign"], args => new Statement(args)),
    new Rule(["ReAssign"], args => new Statement(args)),
    new Rule(["While"], args => new Statement(args)),
    new Rule(["IfElse"], args => new Statement(args)),
    new Rule(["If"], args => new Statement(args)),
    new Rule(["Print"], args => new Statement(args)),
    new Rule(["PrintString"], args => new Statement(args)),
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

