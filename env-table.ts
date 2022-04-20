import { CodeBuffer } from "./code-generator"

export class Env {
    public static variables: any = {}

    public static add(variable: any) {
        this.variables[variable.name] = variable
        if (variable.type == "string") {
            CodeBuffer.emitData(variable.name + " db " + variable.value + ", 0\n")
        }
    }

    public static get(name: string) {
        return this.variables[name]
    }
}