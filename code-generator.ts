import { writeFile } from 'fs';
import { MemoryBuffer } from './syntax/models';

export class CodeBuffer {
    private static code: string = ""
    private static data: string = ""

    public static mov(op1: MemoryBuffer, op2: MemoryBuffer) {
        CodeBuffer.emit(`mov ${op1.getOperandName()}, ${op2.getOperandName()}\n`)
    }

    public static add(op1: MemoryBuffer, op2: MemoryBuffer) {
        CodeBuffer.emit(`add ${op1.getOperandName()}, ${op2.getOperandName()}\n`)
    }

    public static sub(op1: MemoryBuffer, op2: MemoryBuffer) {
        CodeBuffer.emit(`sub ${op1.getOperandName()}, ${op2.getOperandName()}\n`)
    }

    public static imul(op1: MemoryBuffer, op2: MemoryBuffer) {
        CodeBuffer.emit(`imul ${op1.getOperandName()}, ${op2.getOperandName()}\n`)
    }

    public static idiv(op: MemoryBuffer) {
        CodeBuffer.emit(`idiv ${op.getOperandName()}\n`)
    }

    public static div(op: MemoryBuffer) {
        CodeBuffer.emit(`div ${op.getOperandName()}\n`)
    }

    public static and(op1: MemoryBuffer, op2: MemoryBuffer) {
        CodeBuffer.emit(`and ${op1.getOperandName()} ${op2.getOperandName()}\n`)
    }

    public static or(op1: MemoryBuffer, op2: MemoryBuffer) {
        CodeBuffer.emit(`or ${op1.getOperandName()} ${op2.getOperandName()}\n`)
    }

    public static push(op: MemoryBuffer) {
        CodeBuffer.emit(`push ${op.getOperandName()}\n`)
    }

    public static pop(op: MemoryBuffer) {
        CodeBuffer.emit(`pop ${op.getOperandName()}\n`)
    }

    public static cmp(op1: MemoryBuffer, op2) {
        CodeBuffer.emit(`cmp ${op1.getOperandName()}, ${op2.getOperandName()}\n`)
    }

    public static comment(s: string) {
        CodeBuffer.emit(`; ${s}\n`)
    }

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
formatfloat db "%f", 13, 10, 0
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