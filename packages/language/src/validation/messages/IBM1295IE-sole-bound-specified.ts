import { ValidationAcceptor } from "langium";
import { DimensionBound, isLiteral, isNumberLiteral, isUnaryExpression } from "../../generated/ast";

export function IBM1295IE_sole_bound_specified(bound: DimensionBound, accept: ValidationAcceptor): void {
    if(bound.upper === undefined 
        && bound.lower.expression !== '*'
        && isUnaryExpression(bound.lower.expression)
        && bound.lower.expression.op === '-'
        && isLiteral(bound.lower.expression.expr)
        && isNumberLiteral(bound.lower.expression.expr.value)) {
        accept("error", "Sole bound specified is less than 1. An upper bound of 1 is assumed.", {
            node: bound,
            property: "lower",
            code: "IBM1295IE"
        });
    }
}