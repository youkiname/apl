import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";
import { Generator } from "./code-generator";

const code = `
int a = 9
while (a!=10) {
    a = a + 1
    print(a)
}
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
