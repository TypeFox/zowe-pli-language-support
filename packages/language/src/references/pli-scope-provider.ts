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

import { AstUtils, DefaultScopeProvider, EMPTY_SCOPE, ReferenceInfo, Scope } from "langium";
import { DeclaredVariable, isDeclaredVariable, isMemberCall } from "../generated/ast";

export class PliScopeProvider extends DefaultScopeProvider {
    override getScope(context: ReferenceInfo): Scope {
        if (context.property === 'ref') {
            const memberCall = AstUtils.getContainerOfType(context.container, isMemberCall);
            if (memberCall?.previous) {
                const previouslyReferenced = memberCall.previous.element.ref.ref;
                if (previouslyReferenced && isDeclaredVariable(previouslyReferenced)) {
                    return this.createScopeForNodes(this.findChildren(previouslyReferenced));
                } else {
                    return EMPTY_SCOPE;
                }
            }
        }
        return super.getScope(context);
    }

    private findChildren(declared: DeclaredVariable): DeclaredVariable[] {
        const declaredItem = declared.$container;
        let level = Number(declaredItem.level);
        if (isNaN(level) || level < 1) {
            level = 1;
        }
        const result: DeclaredVariable[] = [];
        const container = declaredItem.$container;
        const index = container.items.indexOf(declaredItem);
        for (let i = index + 1; i < container.items.length; i++) {
            const item = container.items[i];
            const childLevel = Number(item.level);
            if (isNaN(childLevel) || childLevel < level) {
                break;
            }
            if (childLevel === level + 1) {
                result.push(...item.elements.filter(isDeclaredVariable));
            }
        }
        return result;
    }
}