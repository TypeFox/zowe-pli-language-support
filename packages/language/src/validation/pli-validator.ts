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

import type { MaybePromise, ValidationAcceptor, ValidationChecks } from 'langium';
import { Pl1AstType, SimpleOptionsItem } from '../generated/ast.js';
import type { Pl1Services } from '../pli-module.js';
import { IBM1295IE_sole_bound_specified } from './messages/IBM1295IE-sole-bound-specified.js';
import { IBM1324IE_name_occurs_more_than_once_within_exports_clause } from './messages/IBM1324IE-name-occurs-more-than-once-within-exports-clause.js';
import { IBM1388IE_NODESCRIPTOR_attribute_is_invalid_when_any_parameter_has_NONCONNECTED_attribute } from './messages/IBM1388IE-NODESCRIPTOR-attribute-is-invalid-when-any-parameter-has-NONCONNECTED-attribute.js';
import { IBM1747IS_Function_cannot_be_used_before_the_functions_descriptor_list_has_been_scanned } from './messages/IBM1747IS-Function-cannot-be-used-before-the-functions-descriptor-list-has-been-scanned.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: Pl1Services) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.Pl1Validator;
    const checks: ValidationChecks<Pl1AstType> = {
        DimensionBound: [IBM1295IE_sole_bound_specified],
        Exports: [IBM1324IE_name_occurs_more_than_once_within_exports_clause],
        MemberCall: [IBM1747IS_Function_cannot_be_used_before_the_functions_descriptor_list_has_been_scanned],
        ProcedureStatement: [IBM1388IE_NODESCRIPTOR_attribute_is_invalid_when_any_parameter_has_NONCONNECTED_attribute],

        SimpleOptionsItem: [validator.checkOptionUnderValidParent]
    };
    registry.register(checks, validator);
}

const undocumentedOptions = ['INTER', 'RECURSIVE'] as const;
const optionsMap: Partial<Record<keyof Pl1AstType, SimpleOptionsItem['value'][]>> = {
    BeginStatement: ['NOCHARGRAPHIC', 'CHARGRAPHIC', 'NOINLINE', 'INLINE', 'NORETURN', 'ORDER', 'REORDER'],
    EntryAttribute: ['ASSEMBLER', 'ASM', 'RETCODE', 'COBOL', 'FORTRAN', 'FETCHABLE', 'RENT', 'BYADDR', 'BYVALUE', 'DESCRIPTOR', 'NODESCRIPTOR', 'AMODE31', 'AMODE64', 'IRREDUCIBLE', 'REDUCIBLE', 'NORETURN', ...undocumentedOptions],
    EntryStatement: ['ASSEMBLER', 'ASM', 'RETCODE', 'REENTRANT', 'COBOL', 'FORTRAN', 'BYADDR', 'BYVALUE', 'DESCRIPTOR', 'NODESCRIPTOR', 'DLLINTERNAL', 'IRREDUCIBLE', 'REDUCIBLE', 'NORETURN'],
    Package: ['NOCHARGRAPHIC', 'CHARGRAPHIC', 'ORDER', 'REORDER', 'REENTRANT'],
    ProcedureStatement: ['ASSEMBLER', 'ASM', 'COBOL', 'FORTRAN', 'FETCHABLE', 'FETCHABLE', 'MAIN', 'NOEXECOPS', 'BYADDR', 'BYVALUE', 'NOCHARGRAPHIC', 'CHARGRAPHIC', 'DESCRIPTOR', 'NODESCRIPTOR', 'AMODE31', 'AMODE64', 'DLLINTERNAL', 'FROMALIEN', 'NOINLINE', 'INLINE', 'ORDER', 'REORDER', 'IRREDUCIBLE', 'REDUCIBLE', 'NORETURN', 'REENTRANT', 'RETCODE', 'WINMAIN', ...undocumentedOptions]
};

/**
 * Implementation of custom validations.
 */
export class Pl1Validator {
    checkOptionUnderValidParent(node: SimpleOptionsItem, accept: ValidationAcceptor): MaybePromise<void> {
        const optionsParent = node.$container.$container.$type;
        if(optionsParent in optionsMap) {
            const validValues = optionsMap[optionsParent]!;
            if(!validValues.includes(node.value)) {
                accept('error', `Option '${node.value}' is not allowed within the '${optionsParent}}' node.`, {
                    node: node,
                    property: 'value'
                });
            }
        }
    }    
}


