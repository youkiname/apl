import { Lexer } from "./lexer/lexer";
import { Grammar } from "./syntax/grammar";
import { Translator } from "./translator/translator";
import { readFileSync } from 'fs';
import { writeFile } from 'fs';
import { Statement } from "./syntax/statements";
// исправить float / float - использовать остаток от деления
//

function saveTree(ast: Statement) {

    const jsonTree = JSON.stringify(ast.getTree());
    writeFile('tree.json', jsonTree, (err) => {
        if (err) throw err;
        console.log('Json Tree has been saved!');
    });
}

const code = readFileSync(process.argv[2], 'utf-8');

const lexer = new Lexer(code)

const tokens = lexer.getTokens()
const grammar = new Grammar(tokens)
const ast = grammar.getAST()
saveTree(ast)
ast.eval();
Translator.compile();
