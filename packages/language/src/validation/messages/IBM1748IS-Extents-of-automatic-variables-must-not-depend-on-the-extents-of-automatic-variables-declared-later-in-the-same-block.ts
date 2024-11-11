import { ValidationAcceptor } from "langium";
import { Bound } from "../../generated/ast";

export function IBM1748IS_Extents_of_automatic_variables_must_not_depend_on_the_extents_of_automatic_variables_declared_later_in_the_same_block(bound: Bound, accept: ValidationAcceptor): void {
 //TODO IBM1748IS Extents of automatic variables must not depend on the extents of automatic variables declared later in the same block.
 /* EXAMPLE
 dcl a char( length(b) ) auto;
 dcl b char( 10 ) auto;
  */
}