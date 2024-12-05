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

import { AstNode, DefaultLangiumDocumentFactory, LangiumDocument, ParseResult, TextDocument, URI } from "langium";
import { CompilerOptions } from "../compiler/options";
import type { PliServices } from "../pli-module";

export interface PliDocument<T extends AstNode> extends LangiumDocument<T> {
    compilerOptions: CompilerOptions;
}

export class PliDocumentFactory extends DefaultLangiumDocumentFactory {

    protected override createLangiumDocument<T extends AstNode = AstNode>(parseResult: ParseResult<T>, uri: URI, textDocument?: TextDocument, text?: string): LangiumDocument<T> {
        const document = super.createLangiumDocument(parseResult, uri, textDocument, text) as unknown as PliDocument<T>;
        const lexer = (this.serviceRegistry.getServices(uri) as PliServices).parser.Lexer;
        document.compilerOptions = lexer.compilerOptions;
        return document;
    }

}
