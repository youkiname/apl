export type Evalable = {
    eval(): string
};

export class FunctionParameter {
    constructor (
        readonly name: string,
        readonly type: string,
    ) { }
}

export class Variable {
    constructor (
        public name: string,
        readonly type: string,
        readonly value: string
    ) { }
} 