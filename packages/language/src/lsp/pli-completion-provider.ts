import { AstNodeDescription } from "langium";
import { CompletionValueItem, DefaultCompletionProvider } from "langium/lsp";

export class PliCompletionProvider extends DefaultCompletionProvider {

    protected override createReferenceCompletionItem(nodeDescription: AstNodeDescription): CompletionValueItem {
        let detail: string | undefined = undefined;
        if (nodeDescription.type === 'ProcedureStatement') {
            detail = 'PROCEDURE';
        } else if (nodeDescription.type === 'DeclaredVariable' || nodeDescription.type === 'DoType3Variable') {
            detail = 'DECLARE';
        } else if (nodeDescription.type === 'LabelPrefix') {
            detail = 'LABEL';
        }
        const kind = this.nodeKindProvider.getCompletionItemKind(nodeDescription);
        const documentation = this.getReferenceDocumentation(nodeDescription);
        return {
            nodeDescription,
            kind,
            documentation,
            detail,
            sortText: '0'
        };
    }

}