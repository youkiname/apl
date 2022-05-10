import { Lexer } from "./lexer/lexer";
import { Grammar } from "./syntax/grammar";
import { Generator } from "./code-generator";

const code = `
fun say_hello(a: int) {
    while (a > 0) {
        a = a - 1
        print(a)
    }
}
int a = 10
say_hello(a)
say_hello(a)
say_hello(a)
print(a)
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
