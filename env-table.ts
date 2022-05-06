import { CodeBuffer } from "./code-generator"

export class Env {
    public name: string
    public parent: Env | null
    public variables: any
    public children: Env[]

    private freeRegisters = ['edx', 'ebx', 'ecx']
    private lastTempStringId = 0

    private lastLabelId = 0
    private labels: { [key: string]: string } = {}


    constructor (name: string = '', parent: Env = null) {
        this.name = name
        this.parent = parent
        this.variables = {}
        this.children = []
    }

    public newLabel(type = 'lb'): string {
        this.lastLabelId += 1
        this.labels[type] = this.getNamePrefix() + type + this.lastLabelId
        return this.labels[type]
    }

    public getLabel(type = 'lb'): string {
        return this.labels[type]
    }

    public getFreeRegister(): string {
        return this.freeRegisters.pop()
    }

    public freeRegister(name: string) {
        this.freeRegisters.push(name)
    }

    public saveTempString(value: string) {
        this.lastTempStringId += 1
        let tempName = this.getNamePrefix() + `ts__${this.lastTempStringId}`
        CodeBuffer.emitData(`${tempName} db ${value}, 0\n`)
        return tempName;
    }

    public add(variable: any): string {
        variable.name = this.getNamePrefix() + variable.name
        this.variables[variable.name] = variable
        switch (variable.type) {
            case "string": {
                CodeBuffer.emitData(variable.name + " db " + variable.value + ", 0\n")
                break;
            }
            case "float": {
                CodeBuffer.emitData(variable.name + " dd " + variable.value + "\n")
                break;
            }
            default: {
                CodeBuffer.emitData(variable.name + " dd " + variable.value + "\n")
                break;
            }
        }
        return variable.name
    }

    public get(name: string) {
        name = this.getNamePrefix() + name

        if (name in this.variables) {
            return this.variables[name]
        }
        // let env = this.parent
        // while (env !== null) {
        //     if (name in env.variables) {
        //         return env.variables[name]
        //     }
        //     env = env.parent
        // }
        return null
    }

    public getDirectly(variableName: string) {
        variableName = this.getNamePrefix() + variableName
        return this.variables[variableName]
    }

    public addChild(env: Env) {
        this.children.push(env)
    }

    public getNamePrefix() {
        if (!this.parent) {
            return '';
        }
        return this.parent.getNamePrefix() + this.name + "__";
    }
}