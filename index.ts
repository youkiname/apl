import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";

const code = `
a = 10

if (a == 5) {
    a = b - 2 + c / 34
}

while (a > 0) {
    if (a) {
        continue
    }
    if (b > 0 or a < 10) {
        break
    }
    b = 'Hello'
}
greeting = 'HI'
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
for (let token of tokens) {
    console.log(token.type.name + ": " + token.value.replace(/\n/, "\\n"));
}

const grammar = new Grammar(tokens)
const ast = grammar.getAST()
