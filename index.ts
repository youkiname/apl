import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";
import { Generator } from "./code-generator";

const code = `
int a = 3
if (a <= 5) {
    if (a < 5) {
        print('a < 5')
    } else {
        print('a == 5')
    }
}
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
