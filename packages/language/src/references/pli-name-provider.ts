import { AstNode, CstNode, DefaultNameProvider } from "langium";
import { isProcedureStatement } from "../generated/ast";

export class PliNameProvider extends DefaultNameProvider {
    override getName(node: AstNode): string | undefined {
        if (isProcedureStatement(node)) {
            const label = node.labels[0];
            return label?.name || undefined;
        } else {
            return super.getName(node);
        }
    }
    override getNameNode(node: AstNode): CstNode | undefined {
        if (isProcedureStatement(node)) {
            const label = node.labels[0];
            if (label) {
                return this.getNameNode(label);
            } else {
                return undefined;
            }
        } else {
            return super.getNameNode(node);
        }
    }
}