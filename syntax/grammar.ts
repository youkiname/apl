import { Token } from "../lexer/lexer"
import { Evalable } from "./models"
import { RULES } from "./rules"
import { Rule } from "./rules"
import { Statement } from "./statements"

export class Grammar {
    private statements: Array<Evalable>

    private startIndex: number
    private endIndex: number

    constructor (tokens: Token[]) {
        this.statements = tokens
        this.startIndex = 0
        this.endIndex = 0
    }

    public getAST(): Statement {
        let ruleIndex = 0
        while (ruleIndex < RULES.length) {
            const rule = RULES[ruleIndex]
            if (this.iterateStatementsWith(rule)) {
                ruleIndex = 0
            } else {
                ruleIndex += 1
            }
            this.startIndex = 0
            if (this.statements.length == 1 && this.statements[0].toString() == 'Statement') {
                break
            }
        }

        if (this.statements.length != 1) {
            console.log(this.statements.map(s => s.toString()));
            throw new Error("Syntax error. Can't build AST.");
        }
        return this.statements[0] as Statement
    }

    private iterateStatementsWith(rule: Rule): boolean {
        let successful = false
        while (true) {
            this.endIndex = this.startIndex + rule.length()
            const stringStatements = this.getStringStatements(this.startIndex, this.endIndex)
            if (rule.has(stringStatements)) {
                this.applyRule(rule)
                this.startIndex = 0
                successful = true
                continue
            }
            this.startIndex += 1
            if (this.startIndex >= this.statements.length) {
                break
            }
        }
        return successful
    }

    private applyRule(rule: Rule) {
        const newItem = rule.getStatement(this.statements.slice(this.startIndex, this.endIndex))
        // console.log(this.statements.map(s => s.toString()));
        this.joinElements(
            this.startIndex,
            this.endIndex,
            newItem
        )
    }

    private joinElements(start: number, end: number, newElement: Statement) {
        this.statements.splice(start, end - start, newElement)
    }

    private getStringStatements(start: number, end: number): string[] {
        const stringStatements: string[] = this.statements.map(s => s.toString())
        return stringStatements.slice(start, end)
    }
}