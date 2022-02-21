import { Lexer } from "./lexer";

const code = `
h = 1 + 2
h = ,
fuck = 33
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
console.log(tokens);
