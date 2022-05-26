import { Lexer } from "./lexer/lexer";
import { Grammar } from "./syntax/grammar";
import { Generator } from "./code-generator";
// исправить float / float - использовать остаток от деления
// 
const code = `
fun pow(a: int, b: int) {
    int result = a
    while (b > 0) {
        result = result * a
        b = b - 1
    }
    return result
}

int a = 5 % 2

`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
