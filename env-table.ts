import { CodeBuffer } from "./code-generator"

export class Env {
    public parent: Env
    public variables: any
    public children: Env[]

    constructor (parent: Env = null) {
        this.parent = parent
        this.variables = {}
        this.children = []
    }

    public add(variable: any) {
        this.variables[variable.name] = variable
        if (variable.type == "string") {
            CodeBuffer.emitData(variable.name + " db " + variable.value + ", 0\n")
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

    public addChild(env: Env) {
        this.children.push(env)
    }
}