import { CodeBuffer } from "./code-generator"

export class Env {
    public parent: Env
    public variables: any
    public children: Env[]

    private freeRegisters = ['edx', 'ebx', 'ecx']
    private lastTempStringId = 0

    constructor (parent: Env = null) {
        this.parent = parent
        this.variables = {}
        this.children = []
    }

    public getFreeRegister(): string {
        return this.freeRegisters.pop()
    }

    public freeRegister(name: string) {
        this.freeRegisters.push(name)
    }

    public saveTempString(value: string) {
        this.lastTempStringId += 1
        let tempName = `ts__${this.lastTempStringId}`
        CodeBuffer.emitData(`${tempName} dd '${value}, 0'`)
        return tempName;
    }

    public add(variable: any) {
        this.variables[variable.name] = variable
        switch (variable.type) {
            case "string": {
                CodeBuffer.emitData(variable.name + " db " + variable.value + ", 0\n")
                break;
            }
            case "float": {
                CodeBuffer.emitData(variable.name + " dq " + variable.value + "\n")
                break;
            }
            default: {
                CodeBuffer.emitData(variable.name + " dd " + variable.value + "\n")
                break;
            }
        }
    }

    public get(name: string) {
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

    public getDirectly(variableName: string) {
        return this.variables[variableName]
    }

    public addChild(env: Env) {
        this.children.push(env)
    }
}