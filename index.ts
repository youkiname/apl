import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";
import { Generator } from "./code-generator";

const code = `
int a = 10
string msg = 'You are cool'

while (a > 0) {
    print(a)
    a = a - 1
    if (a < 3) {
        print(msg)
    }
}

`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
