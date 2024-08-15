import { AstNode } from 'langium';
import { AbstractSemanticTokenProvider, SemanticTokenAcceptor } from 'langium/lsp';
import { isDeclaredVariable, isDefineAliasStatement, isProcedureParameter, isReferenceItem } from '../generated/ast';
import { SemanticTokenTypes } from 'vscode-languageserver';

export class PliSemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void | undefined | 'prune' {
        if (isReferenceItem(node)) {
            acceptor({
                node,
                property: 'ref',
                type: SemanticTokenTypes.variable
            });
        } else if (isDeclaredVariable(node)) {
            acceptor({
                node,
                property: 'name',
                type: SemanticTokenTypes.variable
            });
        } else if (isDefineAliasStatement(node)) {
            acceptor({
                node,
                property: 'name',
                type: SemanticTokenTypes.type
            });
        } else if (isProcedureParameter(node)) {
            acceptor({
                node,
                property: 'name',
                type: SemanticTokenTypes.parameter
            });
        }
    }

}
