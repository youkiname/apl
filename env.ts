import { CodeBuffer } from "./code-generator"
import { Variable } from "./syntax/models"
import { MemoryBuffer, Register, EDX, EBX, ECX } from "./syntax/models"

export class Env {
    public name: string
    public parent: Env | null
    public variables: { [key: string]: Variable }
    public functions: { [key: string]: any }
    public children: { [key: string]: Env }
    private labels: { [key: string]: string }

    private freeRegisters: MemoryBuffer[] = [
        EDX,
        EBX,
        ECX
    ]
    private lastLabelId = 0
    private lastTempStringId = 0

    constructor (name: string = '', parent: Env = null) {
        this.name = name
        this.parent = parent
        this.variables = {}
        this.functions = {}
        this.labels = {}
        this.children = {}
    }

    public newLabel(type = 'lb'): string {
        this.lastLabelId += 1
        this.labels[type] = this.getNamePrefix() + type + this.lastLabelId
        return this.labels[type]
    }

    public getLabel(type = 'lb'): string {
        return this.labels[type]
    }

    public getFreeRegister(): Register {
        return this.freeRegisters.pop() as Register
    }

    public freeRegister(register: MemoryBuffer) {
        this.freeRegisters.push(register)
    }

    public saveString(value: string): string {
        this.lastTempStringId += 1
        let tempName = this.getNamePrefix() + `ts__${this.lastTempStringId}`
        CodeBuffer.emitData(`${tempName} db ${value}, 0\n`)
        return tempName;
    }

    public addVariable(variable: Variable): Variable {
        const savedVariable = new Variable(
            this.getNamePrefix() + variable.name,
            variable.type,
            variable.value
        )
        if (this.variables[savedVariable.name]) {
            return this.variables[savedVariable.name]
        }
        this.variables[savedVariable.name] = savedVariable
        switch (variable.type) {
            case "string": {
                CodeBuffer.emitData(savedVariable.name + " db " + variable.value + ", 0\n")
                break;
            }
            case "float": {
                CodeBuffer.emitData(savedVariable.name + " dd " + variable.value + "\n")
                break;
            }
            default: {
                CodeBuffer.emitData(savedVariable.name + " dd " + variable.value + "\n")
                break;
            }
        }
        return savedVariable
    }

    public getVariable(name: string): Variable {
        name = this.getNamePrefix() + name
        if (name in this.variables) {
            return this.variables[name]
        }
        let env = this.parent
        while (env !== null) {
            if (name in env.variables) {
                return env.variables[name]
            }
            env = env.parent
        }
        return null
    }

    public addFunction(f: any): string {
        f.name = this.getNamePrefix() + f.name
        this.functions[f.name] = f
        return f.name
    }

    public getFunction(name: string): any {
        name = this.getNamePrefix() + name

        if (name in this.functions) {
            return this.functions[name]
        }
        let env = this.parent
        while (env !== null) {
            if (name in env.functions) {
                return env.functions[name]
            }
            env = env.parent
        }
        return null
    }

    public getDirectly(variableName: string): Variable {
        variableName = this.getNamePrefix() + variableName
        return this.variables[variableName]
    }

    public getOrCreate(envName: string): Env {
        if (this.children[envName]) {
            return this.children[envName]
        }
        const env = new Env(envName, this)
        this.children[env.name] = env
        return env
    }

    public getNamePrefix(): string {
        if (!this.parent) {
            return '';
        }
        return this.parent.getNamePrefix() + this.name + "__";
    }
}