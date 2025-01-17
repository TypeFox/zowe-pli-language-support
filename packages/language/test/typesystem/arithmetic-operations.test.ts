import { beforeAll, describe, expect, test } from "vitest";
import { ArithmeticOperator, ComputeOperationReturnType, createArithmeticOperationTable } from "../../src/typesystem/arithmetic-operations";
import { Base, Scale, ScaleMode, TypesDescriptions } from "../../src/typesystem/descriptions";

function arithmetic(scaleMode: ScaleMode, base: Base, p: number, q: number = 0) {
    const scale: Scale = scaleMode === 'fixed' ? {
        mode: 'fixed',
        totalDigitsCount: p,
        fractionalDigitsCount: q
    } : {
        mode: 'float',
        totalDigitsCount: p,
    };
    return TypesDescriptions.Arithmetic({
        base,
        scale
    });
}

describe('Arithmetic operations', () => {
    const floatDecimal10 = arithmetic('float', 'decimal', 10);
    const floatDecimal20 = arithmetic('float', 'decimal', 20);

    const floatBinary10 = arithmetic('float', 'binary', 10);
    const floatBinary20 = arithmetic('float', 'binary', 20);

    const fixedDecimal20_0 = arithmetic('fixed', 'decimal', 20, 0);
    const fixedDecimal10_6 = arithmetic('fixed', 'decimal', 10, 6);
    const fixedDecimal20_10 = arithmetic('fixed', 'decimal', 20, 10);

    const fixedBinary20_0 = arithmetic('fixed', 'binary', 20, 0);
    const fixedBinary10_6 = arithmetic('fixed', 'binary', 10, 6);
    const fixedBinary20_10 = arithmetic('fixed', 'binary', 20, 10);

    describe('Compiler-flag-unrelated - Table 1', () => {
        let inferArithmeticOp: ComputeOperationReturnType;

        function expectArithmeticWhen(lhs: TypesDescriptions.Arithmetic, op: ArithmeticOperator, rhs: TypesDescriptions.Arithmetic, expectedScaleMode: ScaleMode, expectedBase: Base, expectedP: number, expectedQ?: number) {
            const returnType = inferArithmeticOp({ lhs, rhs, op }) as TypesDescriptions.Arithmetic;
            expect(returnType.scale.mode).toBe(expectedScaleMode);
            expect(returnType.base).toBe(expectedBase);
            expect(returnType.scale.totalDigitsCount).toBe(expectedP);
            if (returnType.scale.mode === "fixed") {
                expect(returnType.scale.fractionalDigitsCount).toBe(expectedQ);
            }
        }

        beforeAll(() => { inferArithmeticOp = createArithmeticOperationTable('ans'); }); //should be same as 'ibm'

        test('float decimal OP float decimal', () => {
            expectArithmeticWhen(floatDecimal10, '+', floatDecimal20, 'float', 'decimal', 20);
            expectArithmeticWhen(floatDecimal20, '-', floatDecimal20, 'float', 'decimal', 20);
            expectArithmeticWhen(floatDecimal10, '*', floatDecimal10, 'float', 'decimal', 10);
            expectArithmeticWhen(floatDecimal10, '/', floatDecimal10, 'float', 'decimal', 10);
            expectArithmeticWhen(floatDecimal10, '**', floatDecimal20, 'float', 'decimal', 20);
        });

        test('float decimal OP fixed decimal', () => {
            expectArithmeticWhen(floatDecimal10, '+', fixedDecimal10_6, 'float', 'decimal', 10);
            expectArithmeticWhen(floatDecimal20, '-', fixedDecimal10_6, 'float', 'decimal', 20);
            expectArithmeticWhen(floatDecimal10, '*', fixedDecimal10_6, 'float', 'decimal', 10);
            expectArithmeticWhen(floatDecimal10, '/', fixedDecimal10_6, 'float', 'decimal', 10);
            expectArithmeticWhen(floatDecimal10, '**', fixedDecimal20_0, 'float', 'decimal', 20);
        });

        test('fixed decimal OP float decimal', () => {
            expectArithmeticWhen(fixedDecimal10_6, '+', floatDecimal10, 'float', 'decimal', 10);
            expectArithmeticWhen(fixedDecimal10_6, '-', floatDecimal20, 'float', 'decimal', 20);
            expectArithmeticWhen(fixedDecimal10_6, '*', floatDecimal10, 'float', 'decimal', 10);
            expectArithmeticWhen(fixedDecimal10_6, '/', floatDecimal10, 'float', 'decimal', 10);
            expectArithmeticWhen(fixedDecimal20_0, '**', floatDecimal10, 'float', 'decimal', 20);
        });

        test('float binary OP float binary', () => {
            expectArithmeticWhen(floatBinary10, '+', floatBinary20, 'float', 'binary', 20);
            expectArithmeticWhen(floatBinary20, '-', floatBinary20, 'float', 'binary', 20);
            expectArithmeticWhen(floatBinary10, '*', floatBinary10, 'float', 'binary', 10);
            expectArithmeticWhen(floatBinary10, '/', floatBinary10, 'float', 'binary', 10);
            expectArithmeticWhen(floatBinary10, '**', floatBinary20, 'float', 'binary', 20);
        });

        test('float binary OP fixed binary', () => {
            expectArithmeticWhen(floatBinary10, '+', fixedBinary20_0, 'float', 'binary', 20);
            expectArithmeticWhen(floatBinary20, '-', fixedBinary20_10, 'float', 'binary', 20);
            expectArithmeticWhen(floatBinary10, '*', fixedBinary20_0, 'float', 'binary', 20);
            expectArithmeticWhen(floatBinary10, '/', fixedBinary10_6, 'float', 'binary', 10);
            expectArithmeticWhen(floatBinary10, '**', fixedBinary20_10, 'float', 'binary', 20);
        });

        test('fixed binary OP float binary', () => {
            expectArithmeticWhen(fixedBinary20_0, '+', floatBinary10, 'float', 'binary', 20);
            expectArithmeticWhen(fixedBinary20_10, '-', floatBinary20, 'float', 'binary', 20);
            expectArithmeticWhen(fixedBinary20_0, '*', floatBinary10, 'float', 'binary', 20);
            expectArithmeticWhen(fixedBinary10_6, '/', floatBinary10, 'float', 'binary', 10);
            expectArithmeticWhen(fixedBinary20_10, '**', floatBinary10, 'float', 'binary', 20);
        });

        test('fixed decimal OP float binary', () => {
            expectArithmeticWhen(fixedDecimal10_6, '+', floatBinary10, 'float', 'binary', 34);
            expectArithmeticWhen(fixedDecimal20_10, '-', floatBinary20, 'float', 'binary', 67);
            expectArithmeticWhen(fixedDecimal20_0, '*', floatBinary10, 'float', 'binary', 67);
            expectArithmeticWhen(fixedDecimal20_10, '/', floatBinary10, 'float', 'binary', 67);
            expectArithmeticWhen(fixedDecimal10_6, '**', floatBinary10, 'float', 'binary', 34);
        });

        test('float decimal OP fixed binary', () => {
            expectArithmeticWhen(floatDecimal10, '+', fixedBinary10_6, 'float', 'binary', 34);
            expectArithmeticWhen(floatDecimal20, '-', fixedBinary20_10, 'float', 'binary', 67);
            expectArithmeticWhen(floatDecimal20, '*', fixedBinary20_10, 'float', 'binary', 67);
            expectArithmeticWhen(floatDecimal20, '/', fixedBinary10_6, 'float', 'binary', 67);
            expectArithmeticWhen(floatDecimal10, '**', fixedBinary10_6, 'float', 'binary', 34);
        });

        test('float decimal OP float binary', () => {
            expectArithmeticWhen(floatDecimal10, '+', floatBinary10, 'float', 'binary', 34);
            expectArithmeticWhen(floatDecimal20, '-', floatBinary10, 'float', 'binary', 67);
            expectArithmeticWhen(floatDecimal20, '*', floatBinary20, 'float', 'binary', 67);
            expectArithmeticWhen(floatDecimal20, '/', floatBinary20, 'float', 'binary', 67);
            expectArithmeticWhen(floatDecimal10, '**', floatBinary10, 'float', 'binary', 34);
        });

        //---------------------
        test('fixed binary OP float decimal', () => {
            expectArithmeticWhen(fixedBinary10_6, '+', floatDecimal10, 'float', 'binary', 34);
            expectArithmeticWhen(fixedBinary20_10, '-', floatDecimal20, 'float', 'binary', 67);
            expectArithmeticWhen(fixedBinary20_0, '*', floatDecimal10, 'float', 'binary', 34);
            expectArithmeticWhen(fixedBinary20_10, '/', floatDecimal10, 'float', 'binary', 34);
            expectArithmeticWhen(fixedBinary10_6, '**', floatDecimal10, 'float', 'binary', 34);
        });

        test('float binary OP fixed decimal', () => {
            expectArithmeticWhen(floatBinary10, '+', fixedDecimal10_6, 'float', 'binary', 34);
            expectArithmeticWhen(floatBinary20, '-', fixedDecimal20_10, 'float', 'binary', 67);
            expectArithmeticWhen(floatBinary20, '*', fixedDecimal20_10, 'float', 'binary', 67);
            expectArithmeticWhen(floatBinary20, '/', fixedDecimal10_6, 'float', 'binary', 34);
            expectArithmeticWhen(floatBinary10, '**', fixedDecimal10_6, 'float', 'binary', 34);
        });

        test('float binary OP float decimal', () => {
            expectArithmeticWhen(floatBinary10, '+', floatDecimal10, 'float', 'binary', 34);
            expectArithmeticWhen(floatBinary20, '-', floatDecimal10, 'float', 'binary', 34);
            expectArithmeticWhen(floatBinary20, '*', floatDecimal20, 'float', 'binary', 67);
            expectArithmeticWhen(floatBinary20, '/', floatDecimal20, 'float', 'binary', 67);
            expectArithmeticWhen(floatBinary10, '**', floatDecimal10, 'float', 'binary', 34);
        });
    });

    describe.skip('Compiler-flag RULES(ANS)', () => {
        let inferArithmeticOp: ComputeOperationReturnType;
        beforeAll(() => { inferArithmeticOp = createArithmeticOperationTable('ans'); });

    });

    describe.skip('Compiler-flag RULES(IBM)', () => {
        let inferArithmeticOp: ComputeOperationReturnType;
        beforeAll(() => { inferArithmeticOp = createArithmeticOperationTable('ibm'); });

    });
});