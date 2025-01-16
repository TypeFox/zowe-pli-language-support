import { assertUnreachable } from "langium";
import { isExpression, isNumberLiteral, isStringLiteral, Pl1AstType } from "../generated/ast";
import { TypesDescriptions } from "./descriptions";
import { ArithmeticOperator, createArithmeticOperationTable } from "./arithmetic-operations";

export type PliAstNode = Pl1AstType[keyof Pl1AstType];

export interface PliTypeInferer {
    inferType(node: PliAstNode): TypesDescriptions.Any | undefined;
}

export class DefaultPliTypeInferer implements PliTypeInferer {
    private inferArithmeticOperation: ({ op, lhs, rhs }: { op: ArithmeticOperator; lhs: TypesDescriptions.Arithmetic; rhs: TypesDescriptions.Arithmetic; }) => TypesDescriptions.Any | undefined;
    constructor() {
        /** @todo pass in the compiler flag RULES(X), where X = 'ans' or 'ibm' */
        this.inferArithmeticOperation = createArithmeticOperationTable('ans');
    }
    /** @todo multiple entry points: for Expression, VariableDecl, Entries? */
    inferType(node: PliAstNode): TypesDescriptions.Any | undefined {
        if (isExpression(node)) {
            switch (node.$type) {
                case "BinaryExpression":
                    switch (node.op) {
                        case "+":
                        case "-":
                        case "*":
                        case "/":
                        case "**": {
                            //@see https://www.ibm.com/docs/en/epfz/6.1?topic=operations-results-arithmetic
                            const op = node.op;
                            const lhs = this.inferType(node.left);
                            const rhs = this.inferType(node.right);
                            if (!lhs || !rhs || !TypesDescriptions.isArithmetic(lhs) || !TypesDescriptions.isArithmetic(rhs)) {
                                /** @todo also take care of this branch */
                                return undefined;
                            }
                            return this.inferArithmeticOperation({ op, lhs, rhs })
                        }
                        case "<":
                        case "<=":
                        case "<>":
                        case "=":
                        case ">":
                        case ">=": {
                            return TypesDescriptions.Boolean;
                        }
                        case "^":
                        case "!!":
                        case "&":
                        case "^=":
                        case "|":
                        case "||":
                        case "¬":
                        case "¬<":
                        case "¬=":
                        case "¬>": {
                            /** @todo */
                            return undefined;
                        }
                        default:
                            assertUnreachable(node)
                    }
                case "UnaryExpression":
                    switch (node.op) {
                        case "+":
                        case "-": {
                            /** @todo what about negating vs. sign of the type */
                            return this.inferType(node.expr);
                        }
                        case "^": {
                            /** @todo */
                            return undefined;
                        }
                        case "¬": {
                            return TypesDescriptions.Boolean;
                        }
                        default:
                            assertUnreachable(node)
                    }
                case "Literal":
                    if (isStringLiteral(node.value)) {
                        /** @todo */
                        return undefined;
                    } else if (isNumberLiteral(node.value)) {
                        /** @todo */
                        return undefined;
                    } else {
                        assertUnreachable(node.value);
                    }
                case "LocatorCall": {
                    //node.previous -> node.element
                    /** @todo */
                    return undefined;
                }
                default:
                    assertUnreachable(node);
            }
        }
        return undefined;
    }
}

