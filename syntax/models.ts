export type Evalable = {
    eval(): MemoryBuffer
};

export class FunctionParameter {
    constructor (
        readonly name: string,
        readonly type: string,
    ) { }

    public convert(): Variable {
        return new Variable(this.name, this.type, "?")
    }
}

export class MemoryBuffer {
    constructor (
        readonly name: string,
        readonly type: string,
        readonly pointable = false,
    ) { }

    public getOperandName(): string {
        if (this.pointable) {
            return "[" + this.name + "]"
        }
        return this.name
    }
}

export class Register extends MemoryBuffer {
    constructor (name: string) {
        super(name, 'register')
    }
}

export class IntConstant extends MemoryBuffer {
    constructor (value: number) {
        super(value.toString(), 'int')
    }
}

export const ZERO = new MemoryBuffer('0', 'int')

export const EAX = new Register('eax')
export const EDX = new Register('edx')
export const EBX = new Register('ebx')
export const ECX = new Register('ecx')

export class Variable extends MemoryBuffer {
    readonly value: string

    constructor (name: string, type: string, value: string) {
        super(name, type, true)
        this.value = value
    }
} 