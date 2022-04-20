import { writeFile } from 'fs';

export class CodeBuffer {
    private static code: string = ""
    private static data: string = ""

    public static emit(s: string) {
        this.code += s
    }

    public static emitData(s: string) {
        this.data += s
    }

    public static get() {
        return this.code
    }

    public static getDataSection() {
        return this.data
    }
}

export class Generator {
    public static beginTemplate = `
format PE CONSOLE 4.0
entry BeginCode
include 'win32a.inc'

section '.code' executable readable writeable
BeginCode:
`

    public static dataTemplate = `
invoke ExitProcess

section '.data' data readable writeable
formatint db "%i", 13, 10, 0
formatstr db "%s", 13, 10, 0
`

    public static importTemplate = `
section '.idata' import data readable writable
library kernel,'KERNEL32.DLL', msvcrt,'msvcrt.dll'
import kernel, ExitProcess,'ExitProcess'
import msvcrt,printf,'printf', getch, '_getch'
`

    public static compile() {
        const data = (Generator.beginTemplate +
            CodeBuffer.get() +
            Generator.dataTemplate +
            CodeBuffer.getDataSection() +
            Generator.importTemplate);
        writeFile('main.asm', data, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }
}