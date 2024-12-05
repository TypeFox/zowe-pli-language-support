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

import { CompilerOptions } from "./options";
import { AbstractCompilerOption, AbstractCompilerOptions, AbstractCompilerOptionString, AbstractCompilerOptionText, AbstractCompilerValue, isAbstractCompilerOption, isAbstractCompilerOptionString, isAbstractCompilerOptionText } from "./parser";

interface TranslatorRule {
    positive?: string[];
    negative?: string[];
    positiveTranslate?: Translate;
    negativeTranslate?: Translate;
}

type Translate = (option: AbstractCompilerOption, options: CompilerOptions) => void;

class Translator {

    options: CompilerOptions = {};

    private rules: TranslatorRule[] = [];

    rule(positive: string[], positiveTranslate: Translate, negative?: string[], negativeTranslate?: Translate) {
        this.rules.push({ positive, negative, positiveTranslate, negativeTranslate });
    }

    translate(option: AbstractCompilerOption) {
        const name = option.name.toUpperCase();
        try {
            for (const rule of this.rules) {
                if (rule.positive && rule.positive.includes(name)) {
                    rule.positiveTranslate?.(option, this.options);
                    return;
                }
                if (rule.negative && rule.negative.includes(name)) {
                    rule.negativeTranslate?.(option, this.options);
                    return;
                }
            }
        } catch (err) {
            // this is fine
        }
    }

}

function ensureArguments(values: AbstractCompilerValue[], min: number, max: number) {
    if (values.length < min || values.length > max) {
        throw new Error(`Expected between ${min} and ${max} arguments, got ${values.length}`);
    }
}

function ensureType(value: AbstractCompilerValue, type: 'plain'): asserts value is AbstractCompilerOptionText;
function ensureType(value: AbstractCompilerValue, type: 'string'): asserts value is AbstractCompilerOptionString;
function ensureType(value: AbstractCompilerValue, type: 'plainOrString'): asserts value is AbstractCompilerOptionString | AbstractCompilerOptionText;
function ensureType(value: AbstractCompilerValue, type: 'option'): asserts value is AbstractCompilerOption;
function ensureType(value: AbstractCompilerValue, type: string): void {
    let received: string;
    if (isAbstractCompilerOption(value)) {
        received = 'option';
    } else if (isAbstractCompilerOptionText(value)) {
        received = 'plain';
        if (type === 'plainOrString') {
            return;
        }
    } else if (isAbstractCompilerOptionString(value)) {
        received = 'string';
        if (type === 'plainOrString') {
            return;
        }
    } else {
        received = 'empty';
    }
    if (type !== received) {
        throw new Error(`Expected a ${type}, got ${received}`);
    }
}

const translator = new Translator();

function stringTranslate(callback: (options: CompilerOptions, value: string) => void): Translate {
    return (option, options) => {
        ensureArguments(option.values, 1, 1);
        const value = option.values[0];
        ensureType(value, 'string');
        callback(options, value.value);
    };
};

function plainTranslate(callback: (options: CompilerOptions, value: string) => void, ...values: string[]): Translate {
    return (option, options) => {
        ensureArguments(option.values, 1, 1);
        const value = option.values[0];
        ensureType(value, 'plain');
        if (values.length > 0 && !values.includes(value.value)) {
            throw new Error(`Expected one of ${values.join(', ')}. Received '${value.value}'`);
        }
        callback(options, value.value);
    };
};

/** {@link CompilerOptions.aggregate} */
translator.rule(
    ['AGGREGATE', 'AG'],
    (option, options) => {
        ensureArguments(option.values, 0, 1);
        const value = option.values[0];
        if (value) {
            ensureType(value, 'plain');
            const text = value.value;
            if (text === 'DECIMAL' || text === 'HEXADEC') {
                options.aggregate = {
                    offsets: text
                }
            } else {
                throw new Error('Invalid aggregate value. Expected DECIMAL or HEXADEC');
            }
        }
    },
    ['NOAGGREGATE', 'NAG'],
    (_, options) => {
        options.aggregate = false;
    }
);

/** {@link CompilerOptions.arch} */
translator.rule(['ARCH'], plainTranslate((options, value) => {
    options.arch = Number(value);
}, '10', '11', '12', '13', '14'));

/** {@link CompilerOptions.assert} */
translator.rule(['ASSERT'], plainTranslate((options, value) => {
    options.assert = value as CompilerOptions.Assert;
}, 'ENTRY', 'CONDITION'));

/** {@link CompilerOptions.attributes} */
translator.rule(['ATTRIBUTES', 'A', 'NOATTRIBUTES', 'NA'], (option, options) => {
    ensureArguments(option.values, 0, 1);
    const include = option.name.startsWith('A');
    let identifiers: 'FULL' | 'SHORT' | undefined = undefined;
    const value = option.values[0];
    if (value) {
        ensureType(value, 'plain');
        const text = value.value;
        if (text === 'F' || text === 'FULL') {
            identifiers = 'FULL';
        } else if (text === 'S' || text === 'SHORT') {
            identifiers = 'SHORT';
        } else {
            throw new Error('Invalid attribute value. Expected FULL or SHORT');
        }
    }
    options.attributes = {
        include,
        identifiers
    };
});

/** {@link CompilerOptions.backreg} */
translator.rule(['BACKREG'], plainTranslate((options, value) => {
    options.backreg = Number(value);
}, '5', '11'));

/** {@link CompilerOptions.bifprec} */
translator.rule(['BIFPREC'], plainTranslate((options, value) => {
    options.bifprec = Number(value);
}, '31', '15'));

/** {@link CompilerOptions.blank} */
translator.rule(['BIFPREC'], stringTranslate((options, value) => {
    options.blank = value;
}));

/** {@link CompilerOptions.blkoff} */
translator.rule(
    ['BLKOFF'],
    (_, options) => {
        options.blkoff = true;
    },
    ['NOBLKOFF'],
    (_, options) => {
        options.blkoff = false;
    }
);

/** {@link CompilerOptions.brackets} */
translator.rule(
    ['BRACKETS'],
    stringTranslate((options, value) => {
        const length = value.length;
        if (length !== 2) {
            throw new Error('Expected two characters');
        }
        const start = value.charAt(0);
        const end = value.charAt(1);
        options.brackets = [start, end];
    })
);

/** {@link CompilerOptions.case} */
translator.rule(['CASE'], plainTranslate((options, value) => {
    options.case = value as CompilerOptions.Case;
}, 'UPPER', 'ASIS'));

/** {@link CompilerOptions.caserules} */
translator.rule(['CASERULES'], (option, options) => {
    ensureArguments(option.values, 1, 1);
    const keyword = option.values[0];
    ensureType(keyword, 'option');
    ensureArguments(keyword.values, 1, 1);
    const keywordCase = keyword.values[0];
    ensureType(keywordCase, 'plain');
    options.caserules = keywordCase.value as CompilerOptions.CaseRules;
});

/** {@link CompilerOptions.check} */
translator.rule(['CHECK'], plainTranslate((options, value) => {
    if (value === 'STG') {
        value = 'STORAGE';
    } else if (value === 'NSTG') {
        value = 'NOSTORAGE';
    }
    options.check = {
        storage: value as 'STORAGE' | 'NOSTORAGE'
    };
}, 'STORAGE', 'STG', 'NOSTORAGE', 'NSTG'));

/** {@link CompilerOptions.cmpat} */
translator.rule(['CMPAT', 'CMP'], plainTranslate((options, value) => {
    options.cmpat = value as CompilerOptions.CMPat;
}, 'V1', 'V2', 'V3', 'LE'));

/** {@link CompilerOptions.codepage} */
translator.rule(['CODEPAGE'], plainTranslate((options, value) => {
    options.codepage = value;
}));

/** {@link CompilerOptions.common} */
translator.rule(
    ['COMMON'],
    (_, options) => {
        options.common = true;
    },
    ['NOCOMMON'],
    (_, options) => {
        options.common = false;
    }
);

/** {@link CompilerOptions.common} */
translator.rule(
    ['COMPILE', 'C'],
    (_, options) => {
        options.compile = true;
    },
    ['NOCOMPILE', 'NC'],
    (option, options) => {
        ensureArguments(option.values, 0, 1);
        const severity = option.values[0];
        let sev: CompilerOptions.Compile['severity'] | undefined;
        if (severity) {
            ensureType(severity, 'plain');
            const value = severity.value;
            if (value === 'S') {
                sev = 'SEVERE';
            } else if (value === 'W') {
                sev = 'WARNING';
            } else if (value === 'E') {
                sev = 'ERROR';
            } else {
                throw new Error('Invalid severity value. Expected S, W or E');
            }
        }
        options.compile = {
            severity: sev
        };
    }
);

/** {@link CompilerOptions.margins} */
translator.rule(['MARGINS', 'MAR'], (option, options) => {
    ensureArguments(option.values, 2, 3);
    const m = option.values[0];
    const n = option.values[1];
    const c = option.values[2];
    ensureType(m, 'plain');
    ensureType(n, 'plain');
    let cValue: string | undefined = undefined;
    if (c) {
        ensureType(c, 'plain');
        cValue = c.value;
    }
    const start = m.value ? Number(m.value) : NaN;
    const end = n.value ? Number(n.value) : NaN;
    options.margins = {
        m: start,
        n: end,
        c: cValue
    };
}, ['NOMARGINS'], (_, options) => {
    options.margins = false;
});

/** {@link CompilerOptions.or} */
translator.rule(['OR'], stringTranslate((options, value) => {
    options.or = value;
}));

/** {@link CompilerOptions.not} */
translator.rule(['NOT'], stringTranslate((options, value) => {
    options.not = value;
}));

export function translateCompilerOptions(input: AbstractCompilerOptions): CompilerOptions {
    translator.options = {};
    for (const option of input.options) {
        translator.translate(option);
    }
    return translator.options;
}
