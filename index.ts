import { Lexer } from "./lexer";
import { Grammar } from "./syntax-grammar";

const code = `
a = 12 + 1 * 2
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
for (let token of tokens) {
    console.log(token.type.name + ": " + token.value.replace(/\n/, "\\n"));
}

const grammar = new Grammar(tokens)
grammar.getAST()
