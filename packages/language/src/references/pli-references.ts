import { AstNode, DefaultReferences, FindReferencesOptions, ReferenceDescription, Stream } from "langium";
import { isLabelPrefix, isProcedureStatement } from "../generated/ast";

export class PliReferences extends DefaultReferences {
    override findReferences(targetNode: AstNode, options: FindReferencesOptions): Stream<ReferenceDescription> {
        if (isLabelPrefix(targetNode) && isProcedureStatement(targetNode.$container!)) {
            return this.findReferences(targetNode.$container!, options);
        } else {
            return super.findReferences(targetNode, options);
        }
    }
}