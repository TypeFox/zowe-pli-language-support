import { ValidationAcceptor } from "langium";
import { Bound } from "../../generated/ast";

export function IBM1749IS_VALUE_and_INITIAL_expressions_must_be_scalars(bound: Bound, accept: ValidationAcceptor): void {
  //TODO VALUE and INITIAL expressions must be scalars.
  //Aggregate expressions are not valid as INITIAL and VALUE expressions.
}

