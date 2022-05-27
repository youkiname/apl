import { CodeBuffer } from "../translator/translator"
import { Env } from "../env";
import { Token } from "../lexer/lexer"
import { Evalable, FunctionParameter, Variable } from "./models";
import { MemoryBuffer, Register, IntConstant, EAX, EBX, ECX, EDX, ZERO } from "./models"

let env = new Env()

function parseFunctionParams(rawValue: string): FunctionParameter[] {
    const result = []
    const rawParams = rawValue.replace(/\s/g, '').slice(0, -1).split(',');
    for (let rawParam of rawParams) {
        const nameAndType = rawParam.split(':')
        result.push(new FunctionParameter(nameAndType[0], nameAndType[1]))
    }
    return result
}

function convertToFloat(factor: MemoryBuffer) {
    if (factor.type == 'float') {
        return factor
    }
    CodeBuffer.comment('CONVERT TO FLOAT')
    CodeBuffer.imul(factor, new IntConstant(1000))
    factor.type = 'float'
    return factor
}

function __convertToBool(factor: MemoryBuffer, booleans: any) {
    const label = env.newLabel()
    CodeBuffer.cmp(factor, ZERO)
    CodeBuffer.mov(factor, booleans['false'])
    CodeBuffer.emit(`je ${label}\n`)
    CodeBuffer.mov(factor, booleans['true'])
    CodeBuffer.emit(`${label}:\n`)
    return factor
}

function convertToBool(factor: MemoryBuffer) {
    return __convertToBool(factor, {
        "true": new IntConstant(1),
        "false": ZERO
    })
}

function convertToBoolReverse(factor: MemoryBuffer) {
    return __convertToBool(factor, {
        "false": new IntConstant(1),
        "true": ZERO
    })
}

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

    public getTree(): object {
        return {
            "stmt": this.args.map(arg => arg.getTree())
        }
    }

    public printEnv() {
        return env.getTree()
    }
}

export class VariableType extends Statement {
    public name: string

    constructor (name: string) {
        super()
        this.name = name
    }

    public getTree(): object {
        return { "type": this.name }
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

    public getTree(): object {
        return {
            "type": this.type,
            "name": this.name
        }
    }
}

export class IntNumber extends Statement {
    private factor: MemoryBuffer

    constructor (factor: MemoryBuffer) {
        super()
        this.factor = factor
    }

    public eval() {
        const register = env.getFreeRegister('int')
        CodeBuffer.mov(register, this.factor)
        return register
    }

    public getTree(): object {
        return {
            "int": this.factor.name
        }
    }
}

export class FloatNumber extends Statement {
    private factor: MemoryBuffer

    constructor (factor: MemoryBuffer) {
        super()
        this.factor = factor
    }

    public eval() {
        const register = env.getFreeRegister('float')
        const exponent = this.factor.name.split('.')[0]
        let mantissa = this.factor.name.split('.')[1]
        if (mantissa.length < 3) {
            mantissa = mantissa + '0'.repeat(3 - mantissa.length)
        }
        if (mantissa.length > 3) {
            mantissa = mantissa.substring(0, 3);
        }

        CodeBuffer.mov(register, new IntConstant(parseInt(exponent + mantissa)))

        return register
    }

    public getTree() {
        return {
            "float": this.factor.name
        }
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
        const factor = this.args[0].eval()

        if (this.isNumeric(factor.name)) {
            return this.processNumber(factor)
        }

        const variable = env.getVariable(factor.name)
        const register = env.getFreeRegister(variable.type)
        CodeBuffer.mov(register, variable)
        return register
    }

    public getTree() {
        return {
            "factor": this.args[0].getTree()
        }
    }

    private isNumeric(s: string): boolean {
        return !isNaN(+s)
    }

    private processNumber(factor: MemoryBuffer) {
        if (this.getNumberType(factor.name) == 'float') {
            return new FloatNumber(factor).eval()
        } else {
            return new IntNumber(factor).eval()
        }
    }

    private getNumberType(number: string) {
        if (number.includes('.')) {
            return 'float'
        }
        return 'int'
    }
}

export class Term extends Statement {
    private left: Evalable
    private right: Evalable | null
    private sign: string | null

    constructor (left: Evalable, sign: string | null, right: Evalable | null) {
        super()
        this.left = left
        this.sign = sign
        this.right = right
    }

    public eval() {
        if (!this.sign) {
            return this.left.eval()
        }

        let leftName = this.left.eval()
        let rightName = this.right.eval()

        CodeBuffer.comment("---MULTIPLY---")
        if (this.sign == "*") {
        }
        switch (this.sign) {
            case "*": {
                return this.processMultiply(leftName, rightName)
            }
            case "/": {
                return this.processDivision(leftName, rightName)
            }
            case "%": {
                return this.processModulo(leftName, rightName)
            }
            case "div": {
                return this.processIntDivision(leftName, rightName)
            }
        }
    }

    public getTree() {
        if (!this.sign) {
            return {
                'term': this.left.getTree()
            }
        }
        return {
            'term': [this.left.getTree(), this.sign, this.right.getTree()]
        }
    }

    private processMultiply(leftName: MemoryBuffer, rightName: MemoryBuffer) {
        CodeBuffer.imul(leftName, rightName)
        if (leftName.type == "float" && rightName.type == "float") {
            CodeBuffer.mov(EAX('float'), leftName)
            CodeBuffer.mov(EDX('int'), ZERO)
            CodeBuffer.mov(rightName, new IntConstant(1000))
            CodeBuffer.div(rightName)
            CodeBuffer.mov(leftName, EAX('float'))
        }
        if (leftName.type == 'float' || rightName.type == 'float') {
            leftName.type == 'float'
        }

        env.freeRegister(rightName)
        return leftName
    }

    private processDivision(leftName: MemoryBuffer, rightName: MemoryBuffer) {
        if (leftName.type == 'int') {
            convertToFloat(leftName)
        }
        if (rightName.type == 'float') {
            CodeBuffer.imul(leftName, new IntConstant(1000))
        }
        this.processIntDivision(leftName, rightName)
        // if (rightName.type == 'float') {
        //     CodeBuffer.imul(EAX('float'), new IntConstant(1000))
        // }
        return EAX('float')
    }

    private processIntDivision(leftName: MemoryBuffer, rightName: MemoryBuffer) {
        CodeBuffer.mov(EAX('int'), leftName)
        CodeBuffer.mov(EDX('int'), ZERO)
        CodeBuffer.div(rightName)
        env.freeRegister(leftName)
        env.freeRegister(rightName)
        return EAX('int')
    }

    private processModulo(leftName: MemoryBuffer, rightName: MemoryBuffer) {
        CodeBuffer.mov(EAX('int'), leftName)
        CodeBuffer.mov(EDX('int'), ZERO)
        CodeBuffer.div(rightName)
        CodeBuffer.mov(leftName, EDX('int'))
        env.freeRegister(rightName)
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

        let leftName = this.left.eval()
        let rightName = this.right.eval()
        if (leftName.type == 'float' || rightName.type == 'float') {
            convertToFloat(leftName)
            convertToFloat(rightName)
        }

        CodeBuffer.comment("---ADD---")
        if (this.sign == "-") {
            CodeBuffer.sub(leftName, rightName)
        } else {
            CodeBuffer.add(leftName, rightName)
        }
        env.freeRegister(rightName)

        return leftName
    }

    public getTree() {
        if (!this.sign) {
            return {
                'term': this.left.getTree()
            }
        }
        return {
            'add': [this.left.getTree(), this.sign, this.right.getTree()]
        }
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
        CodeBuffer.mov(EAX('int'), ZERO)
        CodeBuffer.emit(`lahf\n`)
        switch (this.sign) {
            case "==": {
                CodeBuffer.and(new Register('ah'), new IntConstant(64))
                break;
            }
            case "!=": {
                CodeBuffer.and(new Register('ah'), new IntConstant(64))
                convertToBoolReverse(EAX('int'))
                break;
            }
            case "<": {
                CodeBuffer.and(new Register('ah'), new IntConstant(1))
                break;
            }
            case ">": {
                CodeBuffer.and(new Register('ah'), new IntConstant(65))
                CodeBuffer.cmp(EAX('int'), ZERO)
                const tempLabel = env.newLabel()
                CodeBuffer.emit(`jne ${tempLabel}\n`)
                CodeBuffer.mov(EAX('int'), new IntConstant(1))
                CodeBuffer.emit(`jmp end${tempLabel}\n`)
                CodeBuffer.emit(`${tempLabel}:\n`)
                CodeBuffer.mov(EAX('int'), ZERO)
                CodeBuffer.emit(`end${tempLabel}:\n`)
                break;
            }
            case "<=": {
                CodeBuffer.and(new Register('ah'), new IntConstant(65))
                break;
            }
            case ">=": {
                CodeBuffer.and(new Register('ah'), new IntConstant(1))
                CodeBuffer.cmp(EAX('int'), ZERO)
                const tempLabel = env.newLabel()
                CodeBuffer.emit(`jne ${tempLabel}\n`)
                CodeBuffer.mov(EAX('int'), new IntConstant(1))
                CodeBuffer.emit(`jmp end${tempLabel}\n`)
                CodeBuffer.emit(`${tempLabel}:\n`)
                CodeBuffer.mov(EAX('int'), ZERO)
                CodeBuffer.emit(`end${tempLabel}:\n`)
                break;
            }
        }
        const resultRegister = env.getFreeRegister('int')
        CodeBuffer.mov(resultRegister, EAX('int'))
        return resultRegister
    }

    public getTree(): object {
        return {
            'compare': [this.left.getTree(), this.sign, this.right.getTree()]
        }
    }
}

export class LogicalOperator extends Statement {
    private left: Expression
    private right: Expression
    private op: string

    constructor (left: Expression, op: string, right: Expression) {
        super()
        this.left = left
        this.right = right
        this.op = op
    }

    public eval() {
        const leftRegister = this.left.eval()
        const rightRegister = this.right.eval()
        CodeBuffer.comment(`--- ${this.op} ---`)
        if (this.op == 'or') {
            CodeBuffer.or(leftRegister, rightRegister)
        } else {
            convertToBool(leftRegister)
            convertToBool(rightRegister)
            CodeBuffer.and(leftRegister, rightRegister)
        }
        env.freeRegister(rightRegister)
        return leftRegister
    }

    public getTree(): object {
        let result = {}
        result[this.op] = [this.left.getTree(), this.right.getTree()]
        return result
    }
}

export class Or extends LogicalOperator {
    constructor (left: Expression, right: Expression) {
        super(left, 'or', right)
    }
}

export class And extends LogicalOperator {
    constructor (left: Expression, right: Expression) {
        super(left, 'and', right)
    }
}

export class Expression extends Statement {
    public eval() {
        return this.args[0].eval()
    }

    public getTree(): object {
        return {
            'expression': this.args[0].getTree()
        }
    }
}

export class PreAssign extends Statement {
    public variable: VariableInit

    constructor (variable: VariableInit) {
        super()
        this.variable = variable
    }

    public getTree(): object {
        return {
            'preAssign': this.variable.getTree()
        }
    }
}

export class PreReAssign extends Statement {
    public variableName: string

    constructor (variableName: string) {
        super()
        this.variableName = variableName
    }

    public getTree(): object {
        return {
            'preReAssign': this.variableName
        }
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

    public getTree(): object {
        return {
            'assign': [this.variable.getTree(), this.expression.getTree()]
        }
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

    public getTree(): object {
        return {
            'reAssign': [{ 'variable': this.variableName }, this.expression.getTree()]
        }
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

    public getTree(): object {
        return {
            'block': this.statement.getTree()
        }
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

    public getTree(): object {
        return {
            'if': [this.expression.getTree(), this.block.getTree()]
        }
    }
}

export class PreIfElse extends Statement {
    readonly ifStatement: If

    constructor (ifStatement: If) {
        super()
        this.ifStatement = ifStatement
    }

    public getTree(): object {
        return {
            'preIfElse': this.ifStatement.getTree()
        }
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

    public getTree(): object {
        return {
            'ifElse': [
                this.expression.getTree(), this.block.getTree(),
                { 'else': this.elseBlock.getTree() }
            ]
        }
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

    public getTree(): object {
        return {
            'while': [this.expression.getTree(), this.block.getTree()]
        }
    }
}

export class Break extends Statement {
    public eval() {
        const label = env.getLabel('whilelb')
        CodeBuffer.comment(`--- BREAK ---`)
        CodeBuffer.emit(`jmp end${label}\n`)
        return null
    }

    public getTree(): object {
        return {
            'break': ''
        }
    }
}

export class Continue extends Statement {
    public eval() {
        const label = env.getLabel('whilelb')
        CodeBuffer.comment(`--- Continue ---`)
        CodeBuffer.emit(`jmp ${label}\n`)
        return null
    }

    public getTree(): object {
        return {
            'continue': ''
        }
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
        CodeBuffer.mov(EAX(resultRegister.type), resultRegister)
        env.freeRegister(resultRegister)
        CodeBuffer.emit(`jmp end${label}\n`)
        return null
    }

    public getTree(): object {
        return {
            'return': this.expression.getTree()
        }
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

            const register = env.getFreeRegister(variable.type)
            CodeBuffer.pop(register)
            CodeBuffer.mov(variable, register)
            env.freeRegister(register)

        }
        const label = env.newLabel('fun')
        CodeBuffer.emit(`${label}:\n`)
        this.block.eval()
        CodeBuffer.mov(EAX('int'), ZERO)
        CodeBuffer.emit(`end${label}:\n`)
        env = env.parent
        return null
    }

    public getTree(): object {
        return {
            'function': [{ 'params': this.params }, this.block.getTree()]
        }
    }
}

export class CallFunction extends Statement {
    private name: string
    private params: string[] = []

    constructor (funName: Token) {
        super()
        this.name = funName.value.split('(', 1)[0]
        let params = funName.value.split('(', 2)[1].slice(0, -1)
        if (params) {
            //  remove spaces, remove end bracket ')' and split params to array
            this.params = params.replace(/\s/g, '').split(',');
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
        return EAX('int')
    }

    public getTree(): object {
        return {
            'callFunction': {
                'name': this.name,
                'args': this.params
            }
        }
    }
}

export class Print extends Statement {
    private params: string[]

    constructor (nameWithArgs: Token) {
        super()
        let params = nameWithArgs.value.split('(', 2)[1].slice(0, -1)
        if (params) {
            //  remove spaces, remove end bracket ')' and split params to array
            this.params = params.replace(/\s/g, '').split(',');
        }
    }

    public eval() {
        for (let variableName of this.params) {
            let variable = env.getVariable(variableName);
            if (!variable) {
                throw new Error(`Undefined variable '${variableName}'`);
            }
            switch (variable.type) {
                case "float": {

                    CodeBuffer.mov(EAX('float'), variable)
                    CodeBuffer.mov(EDX('int'), ZERO)
                    CodeBuffer.mov(EBX('int'), new IntConstant(1000))
                    CodeBuffer.div(EBX('int'))
                    CodeBuffer.emit(`cinvoke printf, formatfloat, eax, edx\n`)

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

    public getTree(): object {
        return {
            'print': { 'args': this.params }
        }
    }
}

export class PrintString extends Statement {
    private stringConstant: string

    constructor (nameWithArgs: Token) {
        super()
        this.stringConstant = nameWithArgs.value.split('(', 2)[1].slice(0, -1)
    }

    public eval() {
        let tempName = env.saveString(this.stringConstant)
        CodeBuffer.emit(`cinvoke printf, formatstr, ${tempName}\n`)
        return null;
    }

    public getTree(): object {
        return {
            'print': [this.stringConstant]
        }
    }
}
