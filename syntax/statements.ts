import { CodeBuffer } from "../code-generator"
import { Env } from "../env";
import { Token } from "../lexer/lexer"
import { Evalable, FunctionParameter, Variable } from "./models";
import { MemoryBuffer, Register, EAX, EBX, ECX, EDX, ZERO } from "./models"


function parseFunctionParams(rawValue: string): FunctionParameter[] {
    const result = []
    const rawParams = rawValue.replace(/\s/g, '').slice(0, -1).split(',');
    for (let rawParam of rawParams) {
        const nameAndType = rawParam.split(':')
        result.push(new FunctionParameter(nameAndType[0], nameAndType[1]))
    }
    return result
}

let env = new Env()

export class Statement {
    public args: Array<Evalable>

    constructor (args: Array<Evalable> = []) {
        this.args = args
    }

    public toString(): string {
        return this.constructor['name']
    }

    public eval(): MemoryBuffer {
        for (let arg of this.args) {
            arg.eval();
        }
        return null
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

    public convert(): Variable {
        return new Variable(this.name, this.type, '?')
    }
}

export class Factor extends Statement {

    constructor (args: Array<Evalable> = []) {
        super(args)
    }

    public eval() {
        if (this.args[0] instanceof Expression) {
            return this.args[0].eval()
        }

        const register = env.getFreeRegister()
        const factor = this.args[0].eval()

        if (this.isNumeric(factor.name)) {
            CodeBuffer.mov(register, factor)
        } else {
            const variable = env.getVariable(factor.name)
            CodeBuffer.mov(register, variable)
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

        CodeBuffer.comment("---MULTIPLY---")
        if (this.sign == "*") {
            CodeBuffer.imul(leftName, rightName)
            env.freeRegister(rightName)
            return leftName
        } else {
            CodeBuffer.mov(EAX, leftName)
            CodeBuffer.idiv(rightName)
            env.freeRegister(leftName)
            env.freeRegister(rightName)
            return EAX
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

        CodeBuffer.comment("---ADD---")
        if (this.sign == "-") {
            CodeBuffer.sub(leftName, rightName)
        } else {
            CodeBuffer.add(leftName, rightName)
        }
        env.freeRegister(rightName)

        return leftName
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
        CodeBuffer.comment(`--- COMPARING ${this.sign} ---`)
        CodeBuffer.cmp(leftRegister, rightRegister)
        env.freeRegister(leftRegister)
        env.freeRegister(rightRegister)
        CodeBuffer.mov(EAX, ZERO)
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
                CodeBuffer.cmp(EAX, ZERO)
                const tempLabel = env.newLabel()
                CodeBuffer.emit(`jne ${tempLabel}\n`)
                CodeBuffer.mov(EAX, new MemoryBuffer('1', 'int'))
                CodeBuffer.emit(`jmp end${tempLabel}\n`)
                CodeBuffer.emit(`${tempLabel}:\n`)
                CodeBuffer.mov(EAX, ZERO)
                CodeBuffer.emit(`end${tempLabel}:\n`)
                break;
            }
            case "<=": {
                CodeBuffer.emit(`and ah, 65\n`)
                break;
            }
            case ">=": {
                CodeBuffer.emit(`and ah, 1\n`)
                CodeBuffer.cmp(EAX, ZERO)
                const tempLabel = env.newLabel()
                CodeBuffer.emit(`jne ${tempLabel}\n`)
                CodeBuffer.mov(EAX, new MemoryBuffer('1', 'int'))
                CodeBuffer.emit(`jmp end${tempLabel}\n`)
                CodeBuffer.emit(`${tempLabel}:\n`)
                CodeBuffer.mov(EAX, ZERO)
                CodeBuffer.emit(`end${tempLabel}:\n`)
                break;
            }
        }
        const resultRegister = env.getFreeRegister()
        CodeBuffer.mov(resultRegister, EAX)
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
        const savedVariable = env.addVariable(this.variable.convert())

        CodeBuffer.comment("---ASSIGN---")
        CodeBuffer.mov(savedVariable, resultRegister)
        env.freeRegister(resultRegister);

        return null;
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
        const variable = env.getVariable(this.variableName)
        if (!variable) {
            throw new Error(`Undefined variable '${this.variableName}'`);
        }
        const resultRegister = this.expression.eval()
        CodeBuffer.comment("---REASSIGN---")
        CodeBuffer.mov(variable, resultRegister)
        env.freeRegister(resultRegister)
        return null;
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
        return null;
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
        CodeBuffer.comment(`--- IF ---`)
        CodeBuffer.emit(`${label}:\n`)
        const comparingRegister = this.expression.eval()
        CodeBuffer.cmp(comparingRegister, ZERO)
        env.freeRegister(comparingRegister)

        CodeBuffer.emit(`je end${label}\n`)
        this.block.eval()
        CodeBuffer.emit(`end${label}:\n`)
        return null
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
        CodeBuffer.comment(`--- IFELSE ---`)
        CodeBuffer.emit(`${label}:\n`)
        const comparingRegister = this.expression.eval()
        CodeBuffer.cmp(comparingRegister, ZERO)
        env.freeRegister(comparingRegister)

        CodeBuffer.emit(`je else${label}\n`)
        this.block.eval()
        CodeBuffer.emit(`jmp end${label}\n`)
        CodeBuffer.emit(`else${label}:\n`)
        this.elseBlock.eval()
        CodeBuffer.emit(`end${label}:\n`)
        return null
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
        const label = env.newLabel('whilelb')
        CodeBuffer.comment("---WHILE---")
        CodeBuffer.emit(`${label}:\n`)
        const comparingRegister = this.expression.eval()
        CodeBuffer.cmp(comparingRegister, ZERO)
        env.freeRegister(comparingRegister)
        CodeBuffer.emit(`je end${label}\n`)
        this.block.eval()
        CodeBuffer.emit(`jmp ${label}\n`)
        CodeBuffer.emit(`end${label}:\n`)
        return null
    }
}

export class Break extends Statement {
    public eval() {
        const label = env.getLabel('whilelb')
        CodeBuffer.comment(`--- BREAK ---`)
        CodeBuffer.emit(`jmp end${label}\n`)
        return null
    }
}

export class Continue extends Statement {
    public eval() {
        const label = env.getLabel('whilelb')
        CodeBuffer.comment(`--- Continue ---`)
        CodeBuffer.emit(`jmp ${label}\n`)
        return null
    }
}

export class Return extends Statement {
    private expression: Expression

    constructor (expression: Expression) {
        super()
        this.expression = expression
    }

    public eval() {
        const label = env.getLabel('fun')
        const resultRegister = this.expression.eval()
        CodeBuffer.mov(EAX, resultRegister)
        env.freeRegister(resultRegister)
        CodeBuffer.emit(`jmp end${label}\n`)
        return null
    }
}

export class Function extends Statement {
    private name: string
    private params: FunctionParameter[] = []
    private block: Block

    constructor (funName: Token, block: Block, params: Token = null) {
        super()
        this.name = funName.value.split(' ')[1].slice(0, -1)
        if (params) {
            this.params = parseFunctionParams(params.value)
        }
        this.block = block
    }

    public eval() {
        if (!env.getFunction(this.name)) {
            env.addFunction(this)
            return null
        }
        env = env.getOrCreate(this.name);

        for (let param of this.params) {
            let variable = env.addVariable(param.convert())
            const register = env.getFreeRegister()
            CodeBuffer.pop(register)
            CodeBuffer.mov(variable, register)
            env.freeRegister(register)
        }
        const label = env.newLabel('fun')
        CodeBuffer.emit(`${label}:\n`)
        this.block.eval()
        CodeBuffer.mov(EAX, ZERO)
        CodeBuffer.emit(`end${label}:\n`)
        env = env.parent
        return null
    }
}

export class CallFunction extends Statement {
    private name: string
    private params: string[] = []

    constructor (funName: Token, params: Token = null) {
        super()
        this.name = funName.value.slice(0, -1)
        if (params) {
            //  remove spaces, remove end bracket ')' and split params to array
            this.params = params.value.replace(/\s/g, '').slice(0, -1).split(',');
        }
    }

    public eval() {
        CodeBuffer.comment(`--- CAll FUNCTION ${this.name} ---`)
        for (let paramName of this.params.reverse()) {
            let variable = env.getVariable(paramName)
            if (!variable) {
                throw new Error(`Undefined variable '${paramName}'`);
            }
            CodeBuffer.push(variable)
        }
        const f = env.getFunction(this.name)
        if (!f) {
            throw new Error(`Call undefined function '${this.name}'`);
        }
        f.eval()
        return EAX
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
            let variable = env.getVariable(variableName);
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
        return null;
    }
}

export class PrintString extends Statement {
    private stringConstant: string

    constructor (stringConstant: Token) {
        super()
        this.stringConstant = stringConstant.value
    }

    public eval() {
        let tempName = env.saveString(this.stringConstant)
        CodeBuffer.emit(`cinvoke printf, formatstr, ${tempName}\n`)
        return null;
    }
}
