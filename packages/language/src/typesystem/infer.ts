import { assertUnreachable } from "langium";
import { isExpression, isNumberLiteral, isStringLiteral, Pl1AstType } from "../generated/ast";
import { TypesDescriptions } from "./descriptions";

export type PliAstNode = Pl1AstType[keyof Pl1AstType];

export interface PliTypeInferer {
    inferType(node: PliAstNode): TypesDescriptions.Any | undefined;
}

export class DefaultPliTypeInferer implements PliTypeInferer {
    //TODO multiple entry points: for Expression, VariableDecl, Entries?
    inferType(node: PliAstNode): TypesDescriptions.Any | undefined {
        if(isExpression(node)) {
            switch(node.$type) {
                case "BinaryExpression":
                    switch(node.op) {
                        case "!!":
                        case "&":
                        case "*":
                        case "**":
                        case "+":
                        case "-":
                        case "/":
                        case "<":
                        case "<=":
                        case "<>":
                        case "=":
                        case ">":
                        case ">=":
                        case "^":
                        case "^=":
                        case "|":
                        case "||":
                        case "¬":
                        case "¬<":
                        case "¬=":
                        case "¬>":
                            break;
                        default:
                            assertUnreachable(node)
                    }
                    break;
                case "UnaryExpression":
                    switch(node.op) {
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
                    if(isStringLiteral(node.value)) {

                    } else if(isNumberLiteral(node.value)) {

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