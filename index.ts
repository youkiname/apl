import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";
import { Generator } from "./code-generator";

const code = `
fun say_hello(a:int, b:int) {
    print(a)
    print('hi')
    print(b)
}
int a = 1
int b = 10
say_hello(a, b)
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
