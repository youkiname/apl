import { Token } from "../lexer/lexer";
import { Evalable } from "./models"
import * as s from './statements';

function isArrayEquals(a: string[], b: string[]): boolean {
    if (a.length != b.length) {
        return false
    }
    return a.map((s, i) => s == b[i]).every(status => status === true)
}

type StatementConstructor = (args: Array<Evalable>) => s.Statement;

export class Rule {
    private production: string[]
    private resultConstructor: StatementConstructor

    constructor (production: string[], resultConstructor: StatementConstructor) {
        this.production = production
        this.resultConstructor = resultConstructor
    }

    public toString(): string {
        return this.production.join(' ')
    }

    public getStatement(args: Array<Evalable>): s.Statement {
        return this.resultConstructor(args)
    }

    public has(statements: string[]): boolean {
        return isArrayEquals(statements, this.production)
    }

    public length(): number {
        return this.production.length
    }
}

export const RULES = [
    new Rule(["FUN_INIT", "INIT_FUN_PARAMS", "Block"], args => new s.Function(args[0] as Token, args[2] as s.Block, args[1] as Token)),
    new Rule(["FUN_INIT", ")", "Block"], args => new s.Function(args[0] as Token, args[2] as s.Block)),

    new Rule(["FUN_CALL"], args => new s.CallFunction(args[0] as Token)),

    new Rule(["WHILE", "Expression", "Block"], args => new s.While(args[1] as s.Expression, args[2] as s.Block)),
    new Rule(["IF", "Expression", "Block"], args => new s.If(args[1] as s.Expression, args[2] as s.Block)),
    new Rule(["If", "ELSE"], args => new s.PreIfElse(args[0] as s.If)),
    new Rule(["PreIfElse", "Block"], args => new s.IfElse(args[0] as s.PreIfElse, args[1] as s.Block)),

    new Rule(["{", "Statement", "}"], args => new s.Block(args[1] as s.Statement)),

    new Rule(["STRING"], args => new s.VariableType('string')),
    new Rule(["INT"], args => new s.VariableType('int')),
    new Rule(["FLOAT"], args => new s.VariableType('float')),
    new Rule(["VariableType", "VARIABLE"], args => new s.VariableInit(args[0] as s.VariableType, args[1] as Token)),

    new Rule(["VariableInit", "ASSIGN"], args => new s.PreAssign(args[0] as s.VariableInit)),
    new Rule(["VARIABLE", "ASSIGN"], args => new s.PreReAssign(args[0].eval().name)),
    new Rule(["PreAssign", "Expression", "NEWLINE"], args => new s.Assign(args[0] as s.PreAssign, args[1] as s.Expression)),
    new Rule(["PreReAssign", "Expression", "NEWLINE"], args => new s.ReAssign(args[0] as s.PreReAssign, args[1] as s.Expression)),
    new Rule(["PRINT", "NEWLINE"], args => new s.Print(args[0] as Token)),
    new Rule(["PRINT_STRING", "NEWLINE"], args => new s.PrintString(args[0] as Token)),

    new Rule(["(", "Expression", ")"], args => new s.Factor([args[1]])),
    new Rule(["NUMBER"], args => new s.Factor(args)),
    new Rule(["FLOAT_NUMBER"], args => new s.Factor(args)),
    new Rule(["VARIABLE"], args => new s.Factor(args)),

    new Rule(["CallFunction"], args => new s.Term(args[0], null, null)),
    new Rule(["Term", "STAR", "Term"], args => new s.Term(args[0], "*", args[2])),
    new Rule(["Expression", "STAR", "Expression"], args => new s.Term(args[0], "*", args[2])),
    new Rule(["Term", "SLASH", "Term"], args => new s.Term(args[0], "/", args[2])),
    new Rule(["Term", "%", "Term"], args => new s.Term(args[0], "%", args[2])),
    new Rule(["Term", "DIV", "Term"], args => new s.Term(args[0], "div", args[2])),
    new Rule(["Factor"], args => new s.Term(args[0], null, null)),

    new Rule(["Expression", "PLUS", "Expression"], args => new s.Add(args[0] as s.Expression, "+", args[2] as s.Statement)),
    new Rule(["Expression", "MINUS", "Expression"], args => new s.Add(args[0] as s.Expression, "-", args[2] as s.Statement)),
    new Rule(["Term"], args => new s.Add(args[0] as s.Term, null, null)),

    new Rule(["Expression", "LT", "Expression"], args => new s.Comparing(args[0] as s.Expression, "<", args[2] as s.Expression)),
    new Rule(["Expression", "GT", "Expression"], args => new s.Comparing(args[0] as s.Expression, ">", args[2] as s.Expression)),
    new Rule(["Expression", "GTE", "Expression"], args => new s.Comparing(args[0] as s.Expression, ">=", args[2] as s.Expression)),
    new Rule(["Expression", "LTE", "Expression"], args => new s.Comparing(args[0] as s.Expression, "<=", args[2] as s.Expression)),
    new Rule(["Expression", "EQUAL", "Expression"], args => new s.Comparing(args[0] as s.Expression, "==", args[2] as s.Expression)),
    new Rule(["Expression", "NOT_EQUAL", "Expression"], args => new s.Comparing(args[0] as s.Expression, "!=", args[2] as s.Expression)),

    new Rule(["Expression", "AND", "Expression"], args => new s.And(args[0] as s.Expression, args[2] as s.Expression)),
    new Rule(["Expression", "OR", "Expression"], args => new s.Or(args[0] as s.Expression, args[2] as s.Expression)),

    new Rule(["Or"], args => new s.Expression(args)),
    new Rule(["And"], args => new s.Expression(args)),
    new Rule(["Comparing"], args => new s.Expression(args)),
    new Rule(["Add"], args => new s.Expression(args)),

    new Rule(["BREAK"], args => new s.Break()),
    new Rule(["CONTINUE"], args => new s.Continue()),
    new Rule(["Break"], args => new s.Statement(args)),
    new Rule(["Continue"], args => new s.Statement(args)),

    new Rule(["RETURN", "Expression", "NEWLINE"], args => new s.Return(args[1] as s.Expression)),
    new Rule(["Function"], args => new s.Statement(args)),
    new Rule(["Return"], args => new s.Statement(args)),
    new Rule(["Assign"], args => new s.Statement(args)),
    new Rule(["ReAssign"], args => new s.Statement(args)),
    new Rule(["While"], args => new s.Statement(args)),
    new Rule(["IfElse"], args => new s.Statement(args)),
    new Rule(["If"], args => new s.Statement(args)),
    new Rule(["Print"], args => new s.Statement(args)),
    new Rule(["PrintString"], args => new s.Statement(args)),
    new Rule(["Statement", "Statement"], args => new s.Statement(args)),
    // new Rule(["Expression", "NEWLINE"], args => new s.Statement(args)),
    new Rule(["NEWLINE"], args => new s.Statement(args)),
]