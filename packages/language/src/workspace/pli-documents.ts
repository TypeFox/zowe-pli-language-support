/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { AstNode, DefaultLangiumDocumentFactory, LangiumDocument, Mutable, ParseResult, TextDocument, URI } from "langium";
import { CompilerOptionResult } from "../compiler/options";
import type { PliServices } from "../pli-module";
import { PliProgram } from "../generated/ast";
import { CancellationToken } from "vscode-languageserver";

export interface PliDocument extends LangiumDocument<PliProgram> {
    compilerOptions: CompilerOptionResult;
}

export class PliDocumentFactory extends DefaultLangiumDocumentFactory {

    protected override createLangiumDocument<T extends AstNode = AstNode>(parseResult: ParseResult<T>, uri: URI, textDocument?: TextDocument, text?: string): LangiumDocument<T> {
        const document = super.createLangiumDocument(parseResult, uri, textDocument, text) as unknown as PliDocument;
        const lexer = (this.serviceRegistry.getServices(uri) as PliServices).parser.Lexer;
        document.compilerOptions = lexer.compilerOptions;
        return document as unknown as LangiumDocument<T>;
    }

    override async update<T extends AstNode = AstNode>(document: Mutable<LangiumDocument<T>>, cancellationToken: CancellationToken): Promise<LangiumDocument<T>> {
        const updatedDocument = await super.update(document, cancellationToken);
        const pliDocument = updatedDocument as unknown as PliDocument;
        const lexer = (this.serviceRegistry.getServices(updatedDocument.uri) as PliServices).parser.Lexer;
        pliDocument.compilerOptions = lexer.compilerOptions;
        return pliDocument as unknown as LangiumDocument<T>;
    }

}
