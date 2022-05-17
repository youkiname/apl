import { Lexer } from "./lexer/lexer";
import { Grammar } from "./syntax/grammar";
import { Generator } from "./code-generator";

const code = `
fun say_hi(a:int) {
    a = 2
    return a
}
int a = 5
int b = say_hi(a)
print(a)
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
ast.eval();
Generator.compile();
