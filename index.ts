import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";
import { Generator } from "./code-generator";

const code = `
int a = 10
fun say_hello(name) {
    string msg = 'hello '
    print(msg)
}
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
