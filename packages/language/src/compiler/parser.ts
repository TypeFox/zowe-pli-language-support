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

import { createToken, EmbeddedActionsParser, IToken, Lexer } from 'chevrotain';

const commaToken = createToken({ name: 'comma', pattern: ',' });
const stringToken = createToken({ name: 'string', pattern: /'([^'\\]|\\.)*'/ });
const wordToken = createToken({ name: 'value', pattern: /[\w\d\-+_]+/ });
const parenOpen = createToken({ name: 'parenOpen', pattern: '(' });
const parenClose = createToken({ name: 'parenClose', pattern: ')' });
const ws = createToken({ name: 'ws', pattern: /\s+/, group: Lexer.SKIPPED });
const tokenTypes = [ws, commaToken, stringToken, parenOpen, parenClose, wordToken];
const lexer = new Lexer(tokenTypes, {
    positionTracking: 'full'
});

class Parser extends EmbeddedActionsParser {

    constructor() {
        super(tokenTypes, { recoveryEnabled: true });
        this.performSelfAnalysis();
    }

    compilerOptions = this.RULE<() => AbstractCompilerOptions>('compilerOptions', () => {
        const options: AbstractCompilerOption[] = [];
        this.MANY_SEP({
            SEP: commaToken,
            DEF: () => {
                let result = this.SUBRULE(this.compilerOption);
                if (isAbstractCompilerOptionText(result)) {
                    result = {
                        name: result.value,
                        token: result.token,
                        values: []
                    };
                }
                options.push(result);
            }
        })
        return {
            options
        };
    }, {
        recoveryValueFunc: () => ({
            options: []
        })
    });

    compilerOption = this.RULE<() => AbstractCompilerOption | AbstractCompilerOptionText>('compilerOption', () => {
        const nameToken = this.CONSUME(wordToken);
        const values: AbstractCompilerValue[] = [];
        let parenthesis = false;
        this.MANY(() => {
            parenthesis = true;
            this.CONSUME(parenOpen);
            this.MANY_SEP({
                SEP: commaToken,
                DEF: () => {
                    values.push(this.SUBRULE(this.compilerValue));
                }
            });
            this.CONSUME(parenClose);
        });
        if (parenthesis) {
            return {
                name: nameToken.image,
                token: nameToken,
                values
            }
        } else {
            return {
                type: 'text',
                token: nameToken,
                value: nameToken.image
            }
        }
    }, {
        recoveryValueFunc: () => ({
            type: 'text',
            token: this.LA(1),
            value: ''
        })
    });

    compilerValue = this.RULE<() => AbstractCompilerValue>('compilerValue', () => {
        return this.OR([
            {
                ALT: () => {
                    const string = this.CONSUME(stringToken);
                    return {
                        type: 'string',
                        token: string,
                        value: string.image.slice(1, -1)
                    };
                }
            },
            {
                ALT: () => {
                    return this.SUBRULE(this.compilerOption);
                }
            },
            {
                ALT: () => {
                    return { type: 'text', value: '', token: this.LA(1) };
                }
            }
        ]);
    }, {
        recoveryValueFunc: () => ({
            type: 'text', value: '', token: this.LA(1)
        })
    });

}

const parser = new Parser();

export interface AbstractCompilerOptions {
    options: AbstractCompilerOption[];
}

export interface AbstractCompilerOption {
    name: string;
    token: IToken;
    values: AbstractCompilerValue[];
}

export function isAbstractCompilerOption(value: object): value is AbstractCompilerOption {
    return 'name' in value;
}

export function isAbstractCompilerOptionString(value: object): value is AbstractCompilerOptionString {
    return 'type' in value && value.type === 'string';
}

export function isAbstractCompilerOptionText(value: object): value is AbstractCompilerOptionText {
    return 'type' in value && value.type === 'text';
}

export type AbstractCompilerValue = AbstractCompilerOption | AbstractCompilerOptionString | AbstractCompilerOptionText;

export interface AbstractCompilerOptionString {
    token: IToken;
    type: 'string';
    value: string;
}

export interface AbstractCompilerOptionText {
    token: IToken;
    type: 'text';
    value: string;
}

export function parseAbstractCompilerOptions(input: string): AbstractCompilerOptions {
    const tokens = lexer.tokenize(input);
    parser.input = tokens.tokens;
    const compilerOptions = parser.compilerOptions();
    return compilerOptions;
}
