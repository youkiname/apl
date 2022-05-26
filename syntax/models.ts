export type Evalable = {
    eval(): MemoryBuffer
    getTree(): object
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
        public type: string,
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
    constructor (name: string, type: string = 'int') {
        super(name, type)
    }
}

export class IntConstant extends MemoryBuffer {
    constructor (value: number) {
        super(value.toString(), 'int')
    }
}

export const ZERO = new MemoryBuffer('0', 'int')

export function EAX(type: string) {
    return new Register('eax', type)
}
export function EDX(type: string) {
    return new Register('edx', type)
}
export function EBX(type: string) {
    return new Register('ebx', type)
}
export function ECX(type: string) {
    return new Register('ecx', type)
}

export class Variable extends MemoryBuffer {
    readonly value: string

    constructor (name: string, type: string, value: string) {
        super(name, type, true)
        this.value = value
    }
} 