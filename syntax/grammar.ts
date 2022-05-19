import { Token } from "../lexer/lexer"
import { Evalable } from "./models"
import { RULES } from "./rules"
import { Statement } from "./statements"

export class Grammar {
    private statements: Array<Evalable>

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
                console.log(this.statements.map(s => s.toString()));
                this.joinElements(
                    this.startIndex,
                    endIndex,
                    newItem
                )
                console.log("------------");

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