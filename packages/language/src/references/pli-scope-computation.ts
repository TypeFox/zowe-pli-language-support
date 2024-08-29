import { AstNode, AstNodeDescription, AstUtils, DefaultScopeComputation, LangiumDocument, PrecomputedScopes } from "langium";
import { CancellationToken } from "vscode-jsonrpc";

export class PliScopeComputation extends DefaultScopeComputation {

    override computeExports(document: LangiumDocument, cancelToken?: CancellationToken): Promise<AstNodeDescription[]> {
        if (document.uri.scheme === 'pli-builtin') {
            return super.computeExports(document, cancelToken);
        } else {
            return Promise.resolve([]);
        }
    }

    protected override processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
        const container = AstUtils.findRootNode(node);
        if (container) {
            const name = this.nameProvider.getName(node);
            if (name) {
                scopes.add(container, this.descriptions.createDescription(node, name, document));
            }
        }
    }
}
