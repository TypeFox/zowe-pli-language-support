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

import { DefaultWorkspaceManager, LangiumDocument, LangiumDocumentFactory, URI, WorkspaceFolder } from "langium";
// @ts-ignore
import builtins from '../../builtin/builtin-functions.pli';
import { LangiumSharedServices } from "langium/lsp";

export class PliWorkspaceManager extends DefaultWorkspaceManager {

    private readonly factory: LangiumDocumentFactory;

    constructor(services: LangiumSharedServices) {
        super(services);
        this.factory = services.workspace.LangiumDocumentFactory;
    }

    protected override async loadAdditionalDocuments(_folders: WorkspaceFolder[], _collector: (document: LangiumDocument) => void): Promise<void> {
        const document = this.factory.fromString(builtins, URI.parse('pli-builtin:///builtins.pli'));
        _collector(document);
    }
}
