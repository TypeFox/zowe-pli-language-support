import { assertUnreachable } from "langium";
import { isExpression, isNumberLiteral, isStringLiteral, Pl1AstType } from "../generated/ast";
import { Base, MaximumPrecisions, Scale, ScaleMode, TypesDescriptions } from "./descriptions";

export type PliAstNode = Pl1AstType[keyof Pl1AstType];

export interface PliTypeInferer {
    inferType(node: PliAstNode): TypesDescriptions.Any | undefined;
}

type OperandScaleAndBase = `${ScaleMode}_${Base}`;
type BinaryOperatorPredicate = ({ op, lhs, rhs }: { op: ArithmeticOperator, lhs: TypesDescriptions.Arithmetic, rhs: TypesDescriptions.Arithmetic }) => boolean;
type ResultCompute = ({ op, lhs, rhs }: { op: ArithmeticOperator, lhs: TypesDescriptions.Arithmetic, rhs: TypesDescriptions.Arithmetic }) => TypesDescriptions.Any;
type ArithmeticTypeRule = {
    when: BinaryOperatorPredicate;
    then: ResultCompute;
};
type ArithmeticOperator = '+' | '-' | '*' | '/' | '**';

/** Approximation of ln(10)/ln(2) */
export const DecimalToBinaryDigitsFactor = 3.32;


const Table = applyArithmeticTypeRules([
/**
 * Table 1: Results of arithmetic operations for one or more FLOAT operands
 * @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic#resarithoprt__fig16
 */
{
    //RULE: any basic arithmetic op with at least one float AND with same bases
    when({ op, lhs, rhs }) {
        return isBasicArithmeticOperator(op) && hasAnyFloatOperands(lhs, rhs) && haveSameOperandBases(lhs, rhs);
    },
    then({ lhs: { scale: { totalDigitsCount: p1 }, base }, rhs: { scale: { totalDigitsCount: p2 } } }) {
        return TypesDescriptions.Arithmetic({
            scale: {
                mode: "float",
                totalDigitsCount: Math.max(p1, p2)
            },
            base,
        });
    }
}, {
    //RULE: exponentation op with at least one float AND with same bases
    when({ op, lhs, rhs }) {
        return isExponentationOperator(op) && hasAnyFloatOperands(lhs, rhs) && haveSameOperandBases(lhs, rhs);
    },
    then({ lhs: { scale: { totalDigitsCount: p1 }, base }, rhs: { scale: { totalDigitsCount: p2, mode: rightMode } } }) {
        if(rightMode === 'fixed') { //"special case C"
            return TypesDescriptions.Arithmetic({
                scale: {
                    mode: "float",
                    totalDigitsCount: p1
                },
                base,
            })
        }
        return TypesDescriptions.Arithmetic({
            scale: {
                mode: "float",
                totalDigitsCount: Math.max(p1, p2)
            },
            base,
        });
    }
}, {
    //RULE: any basic arithmetic operator with at least one float, where left is decimal and right is binary
    when({ op, lhs, rhs }) {
        return isBasicArithmeticOperator(op) && hasAnyFloatOperands(lhs, rhs) && lhs.base === 'decimal' && rhs.base === 'binary';
    },
    then({ lhs: { scale: { totalDigitsCount: p1 } }, rhs: { scale: { totalDigitsCount: p2 } } }) {
        return TypesDescriptions.Arithmetic({
            scale: {
                mode: "float",
                totalDigitsCount: Math.max(Math.ceil(p1*DecimalToBinaryDigitsFactor), p2)
            },
            base: 'binary',
        });
    }
}, {
    //RULE: if exponentation operator with at least one float, where left is decimal and right is binary
    when({ op, lhs, rhs }) {
        return isExponentationOperator(op) && hasAnyFloatOperands(lhs, rhs) && lhs.base === 'decimal' && rhs.base === 'binary';
    },
    then({ lhs: { scale: { totalDigitsCount: p1 } }, rhs: { scale: { totalDigitsCount: p2, mode: rightMode } } }) {
        /** @todo special case A @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-using-exponentiation#usexpont__spex */
        //special case C
        if(rightMode === 'fixed') {
            return TypesDescriptions.Arithmetic({
                scale: {
                    mode: "float",
                    totalDigitsCount: p1*DecimalToBinaryDigitsFactor
                },
                base: 'binary'
            })
        }
        return TypesDescriptions.Arithmetic({
            scale: {
                mode: "float",
                totalDigitsCount: Math.max(Math.ceil(p1*DecimalToBinaryDigitsFactor), p2)
            },
            base: 'binary',
        });
    }
}, {
    //RULE: if basic arithmetic operator with at least one float, where left is binary and right is decimal
    when({ op, lhs, rhs }) {
        return isBasicArithmeticOperator(op) && hasAnyFloatOperands(lhs, rhs) && lhs.base === 'binary' && rhs.base === 'decimal';
    },
    then({ lhs: { scale: { totalDigitsCount: p1 } }, rhs: { scale: { totalDigitsCount: p2 } } }) {
        return TypesDescriptions.Arithmetic({
            scale: {
                mode: "float",
                totalDigitsCount: Math.max(p1, Math.ceil(p2*DecimalToBinaryDigitsFactor))
            },
            base: 'binary',
        });
    }
}, {
    //RULE: if exponentation operator with at least one float, where left is binary and right is decimal
    when({ op, lhs, rhs }) {
        return isExponentationOperator(op) && hasAnyFloatOperands(lhs, rhs) && lhs.base === 'binary' && rhs.base === 'decimal';
    },
    then({ lhs: { scale: { totalDigitsCount: p1 } }, rhs: { scale: { totalDigitsCount: p2, mode: rightMode } } }) {
        /** @todo special case B @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-using-exponentiation#usexpont__spex */
        //special case C
        if(rightMode === 'fixed') {
            return TypesDescriptions.Arithmetic({
                scale: {
                    mode: "float",
                    totalDigitsCount: p1
                },
                base: 'binary',
            });   
        }
        return TypesDescriptions.Arithmetic({
            scale: {
                mode: "float",
                totalDigitsCount: Math.max(p1, Math.ceil(p2*DecimalToBinaryDigitsFactor))
            },
            base: 'binary',
        });
    }
},
/**
 * Table 2. Results of arithmetic operations between two unscaled FIXED operands under RULES(ANS)
 * @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic#resarithoprt__fig17
 * @todo applies only if RULES(ANS) is given
 */
//## decimals only
whenUnscaledFixedCaseOnOperatorANS(['+', '-'], 'decimal', 'decimal', 'decimal', ({p1, p2}) => 1 + Math.max(p1, p2)),
whenUnscaledFixedCaseOnOperatorANS(['*'], 'decimal', 'decimal', 'decimal', ({p1, p2}) => 1 + p1 + p2),
whenUnscaledFixedCaseOnOperatorANS(['/'], 'decimal', 'decimal', 'decimal', ({N}) => N, ({N, p1}) => N - p1),
/** @todo special case A */
whenUnscaledFixedCaseOnOperatorANS(['**'], 'decimal', 'decimal', 'decimal', ({p1, p2}) => Math.max(p1, p2)),
//## binary only
whenUnscaledFixedCaseOnOperatorANS(['+', '-'], 'binary', 'binary', 'binary', ({p1, p2}) => 1+Math.max(p1, p2)),
whenUnscaledFixedCaseOnOperatorANS(['*'], 'binary', 'binary', 'binary', ({p1, p2}) => 1 + p1 + p2),
whenUnscaledFixedCaseOnOperatorANS(['*'], 'binary', 'binary', 'binary', ({p1, p2}) => 1 + p1 + p2),
/** @todo special case B */
whenUnscaledFixedCaseOnOperatorANS(['**'], 'binary', 'binary', 'binary', ({p1, p2}) => Math.max(p1, p2)),
//## decimal, then binary
whenUnscaledFixedCaseOnOperatorANS(['+', '-'], 'decimal', 'binary', 'binary', ({p2, r}) => 1 + Math.max(r, p2)),
whenUnscaledFixedCaseOnOperatorANS(['*'], 'decimal', 'binary', 'binary', ({p2, r}) => 1 + r + p2),
whenUnscaledFixedCaseOnOperatorANS(['/'], 'decimal', 'binary', 'binary', ({M}) => M),
/** @todo special case A */
whenUnscaledFixedCaseOnOperatorANS(['**'], 'decimal', 'binary', 'binary', ({p1, p2}) => Math.max(Math.ceil(p1*DecimalToBinaryDigitsFactor),p2)),
//## binary, then decimal
whenUnscaledFixedCaseOnOperatorANS(['+', '-'], 'binary', 'decimal', 'binary', ({p1, t}) => 1 + Math.max(p1, t)),
whenUnscaledFixedCaseOnOperatorANS(['*'], 'binary', 'decimal', 'binary', ({p1, t}) => 1 + p1 + t),
whenUnscaledFixedCaseOnOperatorANS(['/'], 'binary', 'decimal', 'binary', ({M}) => M),
/** @todo special case B */
//ATTENTION! Broken IBM documentation here!
whenUnscaledFixedCaseOnOperatorANS(['**'], 'binary', 'decimal', 'binary', ({p1, p2}) => Math.max(p1, Math.ceil(p2*DecimalToBinaryDigitsFactor))),

/**
 * Table 3. Results of arithmetic operations between two scaled FIXED operands under RULES(ANS)
 * @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic#resarithoprt__fig18
 * @todo applies only if RULES(ANS) is given
 */
//## binary only is forbidden! see appendix of Table 3
//## decimals only
whenScaledFixedCaseOnOperatorANS(['+', '-'], 'decimal', 'decimal', 'decimal', ({p1, p2, q1, q2, q}) => 1 + Math.max(p1-q1, p2-q2) + q, ({q1, q2}) => Math.max(q1, q2)),
whenScaledFixedCaseOnOperatorANS(['*'], 'decimal', 'decimal', 'decimal', ({p1, p2}) => 1 + p1 + p2, ({q1, q2}) => q1 + q2),
whenScaledFixedCaseOnOperatorANS(['/'], 'decimal', 'decimal', 'decimal', ({N}) => N, ({N, p1, q1, q2}) => N-p1 + q1-q2),
/**
 * @todo special case A
 * @todo what is q?
 */
whenScaledFixedCaseOnOperatorANS(['**'], 'decimal', 'decimal', 'decimal', ({p1, p2}) => Math.max(p1, p2)),
//## decimal, then binary
whenScaledFixedCaseOnOperatorANS(['+', '-'], 'decimal', 'binary', 'decimal', ({p1, v, q1, q}) => 1 + Math.max(p1-q1, v) + q, ({q1}) => q1),
//ATTENTION! Broken IBM documentation here!
whenScaledFixedCaseOnOperatorANS(['*'], 'decimal', 'binary', 'decimal', ({p1, v}) => 1 + p1 + v, ({q1}) => q1),
whenScaledFixedCaseOnOperatorANS(['/'], 'decimal', 'binary', 'decimal', ({N}) => N, ({N, p1, q1}) => N - p1 + q1),
/**
 * @todo special case A
 * @todo what is q?
 */
whenScaledFixedCaseOnOperatorANS(['**'], 'decimal', 'binary', 'decimal', ({p1, p2}) => Math.max(Math.ceil(p1*DecimalToBinaryDigitsFactor), p2)),
//## binary, then decimal
whenScaledFixedCaseOnOperatorANS(['+', '-'], 'binary', 'decimal', 'decimal', ({p2, w, q2, q}) => 1 + Math.max(w, p2-q2) + q, ({q2}) => q2),
//ATTENTION! Broken IBM documentation here for Q!
whenScaledFixedCaseOnOperatorANS(['*'], 'binary', 'decimal', 'decimal', ({p2, w}) => 1 + p2 + w, ({q2}) => q2),
//ATTENTION! Broken IBM documentation here for Q!
whenScaledFixedCaseOnOperatorANS(['/'], 'binary', 'decimal', 'decimal', ({N}) => N, ({N, w, q2}) => N - w + q2),
/**
 * @todo special case B
 * @todo what is q?
 */
whenScaledFixedCaseOnOperatorANS(['**'], 'binary', 'decimal', 'decimal', ({p1, p2}) => Math.max(Math.ceil(p1 * DecimalToBinaryDigitsFactor), p2)),

/**
 * Table 4. Results of arithmetic operations between two FIXED operands under RULES(IBM)
 * @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic#resarithoprt__fig19    
 * @todo applies only if RULES(IBM) is given
 */
//## decimals only
whenScaledFixedCaseOnOperatorIBM(['+', '-'], 'decimal', 'decimal', 'decimal', ({p1, q1, p2, q2, q}) => 1 + Math.max(p1-q1, p2-q2) + q, ({q1, q2}) => Math.max(q1, q2)),
whenScaledFixedCaseOnOperatorIBM(['*'], 'decimal', 'decimal', 'decimal', ({p1, p2}) => 1 + p1 + p2, ({q1, q2}) => q1 + q2),
whenScaledFixedCaseOnOperatorIBM(['/'], 'decimal', 'decimal', 'decimal', ({N}) => N, ({N, p1, q1, q2}) => N - p1 + q1 - q2),
/**
 * @todo special case A
 * @todo what is q?
 */
whenScaledFixedCaseOnOperatorIBM(['**'], 'decimal', 'decimal', 'decimal', ({p1, p2}) => Math.max(p1, p2)),
//## binaries only
whenScaledFixedCaseOnOperatorIBM(['+', '-'], 'binary', 'binary', 'binary', ({p1, p2, q1, q2, q}) => 1 + Math.max(p1-q1, p2-q2) + q, ({q1, q2}) => Math.max(q1, q2)),
whenScaledFixedCaseOnOperatorIBM(['*'], 'binary', 'binary', 'binary', ({p1, p2}) => 1 + p1 + p2, ({q1, q2}) => q1 + q2),
whenScaledFixedCaseOnOperatorIBM(['/'], 'binary', 'binary', 'binary', ({M}) => M, ({M, p1, q1, q2}) => M - p1+q1-q2),
/**
 * @todo special case B
 * @todo what is q?
 */
whenScaledFixedCaseOnOperatorIBM(['**'], 'binary', 'binary', 'binary', ({p1, p2}) => Math.max(p1, p2)),
//## decimal, then binary
whenScaledFixedCaseOnOperatorIBM(['+', '-'], 'decimal', 'binary', 'binary', ({p2, r, s, q, q2}) => 1 + Math.max(r-s, p2-q2)+q, ({s, q2}) => Math.max(s, q2)),
whenScaledFixedCaseOnOperatorIBM(['*'], 'decimal', 'binary', 'binary', ({p2, r}) => 1 + r + p2, ({s, q2}) => s + q2),
whenScaledFixedCaseOnOperatorIBM(['/'], 'decimal', 'binary', 'binary', ({M}) => M, ({M, r, s, q2}) => M-r + s - q2),
/**
 * @todo special case A
 * @todo what is q?
 */
whenScaledFixedCaseOnOperatorIBM(['**'], 'decimal', 'binary', 'binary', ({p1, p2}) => Math.max(Math.ceil(p1*DecimalToBinaryDigitsFactor), p2)),
//## binary, then decimal
whenScaledFixedCaseOnOperatorIBM(['+', '-'], 'binary', 'decimal', 'binary', ({p1, t, u, q, q1}) => 1 + Math.max(p1-q1, t-u)+q, ({s, q2}) => Math.max(s, q2)),
whenScaledFixedCaseOnOperatorIBM(['*'], 'binary', 'decimal', 'binary', ({p1, t}) => 1 + p1 + t, ({u, q1}) => q1 + u),
whenScaledFixedCaseOnOperatorIBM(['/'], 'binary', 'decimal', 'binary', ({M}) => M, ({M, p1, q1, u}) => M-p1+q1-u),
/**
 * @todo special case B
 * @todo what is q?
 */
whenScaledFixedCaseOnOperatorIBM(['**'], 'binary', 'decimal', 'binary', ({p1, p2}) => Math.max(p1, Math.ceil(p2*DecimalToBinaryDigitsFactor))),
]);

interface QComputationVariables {
    p1: number;
    p2: number;
    q1: number;
    q2: number;
    r: number;
    s: number;
    t: number;
    u: number;
    v: number;
    w: number;
    N: number;
    M: number;
}

interface PComputationVariables extends QComputationVariables {
    q: number;
}

export function assertTrue(condition: boolean): asserts condition {
    if(!condition) {
        throw new Error('Condition is supposed to be true!');
    }
}

/**
 * Helper method for Table 2
 * @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic#resarithoprt__fig17
 * @param whenOp
 * @param whenLeftBase 
 * @param whenRightBase 
 * @param resultBase 
 * @param thenP 
 * @param thenQ 
 * @returns 
 */
function whenUnscaledFixedCaseOnOperatorANS(whenOp: ArithmeticOperator[], whenLeftBase: Base, whenRightBase: Base, resultBase: Base, thenP: (variables: PComputationVariables) => number, thenQ?: (variables: QComputationVariables) => number): ArithmeticTypeRule {
    return {
        when({op, lhs, rhs}) {
            return whenOp.includes(op)
            //for fixed
            && lhs.scale.mode === 'fixed' && rhs.scale.mode === 'fixed'
            //for unscaled
            && lhs.scale.fractionalDigitsCount === 0 && rhs.scale.fractionalDigitsCount === 0
            //for given bases
            && lhs.base === whenLeftBase && rhs.base === whenRightBase;
        },
        then({lhs, rhs}) {
            const { scale: { totalDigitsCount: p1 } } = lhs;
            const { scale: { totalDigitsCount: p2 } } = rhs;
            const variablesForQ = createVariablesForQ(p1, p2, lhs.scale, rhs.scale);
            const variablesForP = createVariablesForP(variablesForQ, thenQ);
            return TypesDescriptions.Arithmetic({
                scale: {
                    mode: "fixed",
                    fractionalDigitsCount: thenQ?.call(undefined, variablesForQ) ?? 0,
                    totalDigitsCount: thenP(variablesForP),
                },
                base: resultBase
            });
        }
    };
}

/**
 * Helper method for Table 3
 * @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic#resarithoprt__fig18
 * @param whenOp
 * @param whenLeftBase 
 * @param whenRightBase 
 * @param resultBase 
 * @param thenP 
 * @param thenQ 
 * @returns 
 */
function whenScaledFixedCaseOnOperatorANS(whenOp: ArithmeticOperator[], whenLeftBase: Base, whenRightBase: Base, resultBase: Base, thenP: (variables: PComputationVariables) => number, thenQ?: (variables: QComputationVariables) => number): ArithmeticTypeRule {
    return {
        when({op, lhs, rhs}) {
            return whenOp.includes(op)
            //for fixed
            && lhs.scale.mode === 'fixed' && rhs.scale.mode === 'fixed'
            //for at least one scaled
            && (lhs.scale.fractionalDigitsCount !== 0 || rhs.scale.fractionalDigitsCount !== 0)
            //for given bases
            && lhs.base === whenLeftBase && rhs.base === whenRightBase;
        },
        then({lhs, rhs}) {
            const { scale: { totalDigitsCount: p1 } } = lhs;
            const { scale: { totalDigitsCount: p2 } } = rhs;
            const variablesForQ = createVariablesForQ(p1, p2, lhs.scale, rhs.scale);
            const variablesForP = createVariablesForP(variablesForQ, thenQ);
            return TypesDescriptions.Arithmetic({
                scale: {
                    mode: "fixed",
                    totalDigitsCount: thenP(variablesForP),
                    fractionalDigitsCount: thenQ?.call(undefined, variablesForQ) ?? 0,
                },
                base: resultBase
            });
        }
    };
}

/**
 * Helper method for Table 4
 * @see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic#resarithoprt__fig19
 * @param whenOp
 * @param whenLeftBase 
 * @param whenRightBase 
 * @param resultBase 
 * @param thenP 
 * @param thenQ 
 * @returns 
 */
function whenScaledFixedCaseOnOperatorIBM(whenOp: ArithmeticOperator[], whenLeftBase: Base, whenRightBase: Base, resultBase: Base, thenP: (variables: PComputationVariables) => number, thenQ?: (variables: QComputationVariables) => number): ArithmeticTypeRule {
    return {
        when({op, lhs, rhs}) {
            return whenOp.includes(op)
            //for fixed
            && lhs.scale.mode === 'fixed' && rhs.scale.mode === 'fixed'
            //for given bases
            && lhs.base === whenLeftBase && rhs.base === whenRightBase;
        },
        then({lhs, rhs}) {
            const { scale: { totalDigitsCount: p1 } } = lhs;
            const { scale: { totalDigitsCount: p2 } } = rhs;
            const variablesForQ = createVariablesForQ(p1, p2, lhs.scale, rhs.scale);
            const variablesForP = createVariablesForP(variablesForQ, thenQ);
            return TypesDescriptions.Arithmetic({
                scale: {
                    mode: "fixed",
                    totalDigitsCount: thenP(variablesForP),
                    fractionalDigitsCount: thenQ?.call(undefined, variablesForQ) ?? 0,
                },
                base: resultBase
            });
        }
    };
}

export class DefaultPliTypeInferer implements PliTypeInferer {
    /** @todo multiple entry points: for Expression, VariableDecl, Entries? */
    inferType(node: PliAstNode): TypesDescriptions.Any | undefined {
        if (isExpression(node)) {
            switch (node.$type) {
                case "BinaryExpression":
                    //@see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic
                    switch (node.op) {
                        case "!!":
                        case "&":
                        case "*":
                        case "**":
                        case "+":
                        case "-":
                        case "/":
                        case "^":
                        case "^=":
                        case "|":
                        case "||":
                        case "¬":
                        case "¬<":
                        case "¬=":
                        case "¬>":
                            break;
                        case "<":
                        case "<=":
                        case "<>":
                        case "=":
                        case ">":
                        case ">=":
                            return TypesDescriptions.Boolean;
                        default:
                            assertUnreachable(node)
                    }
                    break;
                case "UnaryExpression":
                    switch (node.op) {
                        case "+":
                        case "-":
                        case "^":
                        case "¬":
                            break;
                        default:
                            assertUnreachable(node)
                    }
                    break;
                case "Literal":
                    if (isStringLiteral(node.value)) {

                    } else if (isNumberLiteral(node.value)) {

                    } else {
                        assertUnreachable(node.value);
                    }
                    break;
                case "LocatorCall":
                    //node.previous -> node.element
                    break;
            }
        }
        return undefined;
    }
}

function createVariablesForQ(p1: number, p2: number, lhs: Scale, rhs: Scale): QComputationVariables {
    const q1 = lhs.mode === 'fixed' ? lhs.fractionalDigitsCount : 0;
    const q2 = rhs.mode === 'fixed' ? rhs.fractionalDigitsCount : 0;
    return {
        p1,
        p2,
        q1,
        q2,
        M: MaximumPrecisions['fixed']['binary'],
        N: MaximumPrecisions['fixed']['decimal'],
        get r() {
            return 1 + Math.ceil(p1 * DecimalToBinaryDigitsFactor);
        },
        get s() {
            return Math.ceil(Math.abs(q1*DecimalToBinaryDigitsFactor)) * Math.sign(q1);
        },
        get t() {
            return 1 + Math.ceil(p2 * DecimalToBinaryDigitsFactor);
        },
        get u() {
            return Math.ceil(Math.abs(q2*DecimalToBinaryDigitsFactor)) * Math.sign(q2);
        },
        get v() {
            return Math.ceil(p2 / DecimalToBinaryDigitsFactor);
        },
        get w() {
            return Math.ceil(p1 / DecimalToBinaryDigitsFactor);
        },
    };
}

function createVariablesForP(variables: QComputationVariables, q: ((vars: QComputationVariables) => number)|undefined): PComputationVariables {
    return {
        ...variables,
        get q() {
            return q?.call(undefined, variables) ?? 0;
        }
    }
}


function haveSameOperandBases(lhs: TypesDescriptions.Arithmetic, rhs: TypesDescriptions.Arithmetic) {
    return lhs.base === rhs.base;
}

function isExponentationOperator(op: ArithmeticOperator) {
    return op === '**';
}

function isBasicArithmeticOperator(op: ArithmeticOperator) {
    return !isExponentationOperator(op);
}

function applyArithmeticTypeRules(rules: ArithmeticTypeRule[]): Record<`${OperandScaleAndBase}${ArithmeticOperator}${OperandScaleAndBase}`, ResultCompute> {
    let result: Record<string, ResultCompute> = {};

    return result;
}
function hasAnyFloatOperands(lhs: TypesDescriptions.Arithmetic, rhs: TypesDescriptions.Arithmetic) {
    return lhs.scale.mode === 'float' || rhs.scale.mode === 'float';
}