import { Lexer } from "./lexer";

const code = `
a = 20
fun get_hello(name, age) {
    return 'Hello, ' + name + age
}
while (a > 0) {
    a = a - 1
    if (a == 2 and a <= 5) {
        break
    } else {
        continue
    }
}
a = a * 5 / 3
# its my comment
# really useful comment
greetings = 'hi!'
`

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
for (let token of tokens) {
    console.log(token.type.name + ": " + token.value.replace(/\n/, "\\n"));
}
