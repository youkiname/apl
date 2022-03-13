import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";

const code = `
a = 10
if (10) {
    a = a + 3
}
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
for (let token of tokens) {
    console.log(token.type.name + ": " + token.value.replace(/\n/, "\\n"));
}

const grammar = new Grammar(tokens)
const ast = grammar.getAST()
