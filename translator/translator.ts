import { writeFile } from 'fs';
import { MemoryBuffer } from '../syntax/models';
import { readFileSync } from 'fs';


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
        CodeBuffer.emit(`and ${op1.getOperandName()}, ${op2.getOperandName()}\n`)
    }

    public static or(op1: MemoryBuffer, op2: MemoryBuffer) {
        CodeBuffer.emit(`or ${op1.getOperandName()}, ${op2.getOperandName()}\n`)
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

export class Translator {
    public static compile() {
        const template = readFileSync('./translator/template.asm', 'utf-8');
        const code = template.replace(";;code;;", CodeBuffer.get()).replace(";;data;;", CodeBuffer.getDataSection())
        writeFile('main.asm', code, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }
}