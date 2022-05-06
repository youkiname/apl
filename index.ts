import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";
import { Generator } from "./code-generator";

const code = `\
int a = 1
fun say_hello() {
    int a = 5
    a = a + 1
    print(a)
}
say_hello()
print(a)
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
