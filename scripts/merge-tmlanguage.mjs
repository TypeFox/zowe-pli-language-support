import deepmerge from 'deepmerge';
import * as fs from 'fs/promises';

import { createLangiumGrammarServices } from 'langium/grammar';
import { NodeFileSystem } from 'langium/node';
import { parseHelper } from 'langium/test';
import { AstUtils, GrammarAST, RegExpUtils } from 'langium';
import { readFileSync, writeFileSync } from 'fs';

const services = createLangiumGrammarServices({
    fileSystemProvider: NodeFileSystem.fileSystemProvider
});
const parse = parseHelper(services.grammar);

const file = readFileSync('./packages/language/src/pli.langium', 'utf8');
const grammar = await parse(file);
const keywords = AstUtils.streamAst(grammar.parseResult.value)
    .filter(GrammarAST.isKeyword)
    .map(e => e.value)
    .filter(e => /\w/.test(e));

const manual = JSON.parse(await fs.readFile('./packages/extension/syntaxes/pli.manual.json', 'utf8'));

const controlKeywords = [
    'if',
    'else',
    'then',
    'do',
    'end',
    'on',
    'while',
    'next',
    'go',
    'to',
    'goto',
    'return',
    'when',
    'begin'
];

const storageKeywords = keywords.exclude(controlKeywords).toArray();

function toPattern(keywords) {
    const patterns = [];
    for (const keyword of keywords) {
        let keywordPattern = '';
        for (const char of keyword) {
            if (char.toUpperCase() !== char.toLowerCase()) {
                keywordPattern += `[${char.toUpperCase()}${char.toLowerCase()}]`;
            } else {
                keywordPattern += RegExpUtils.escapeRegExp(char);
            }
        }
        patterns.push(keywordPattern);
    }
    return `\\b(${patterns.join('|')})\\b`;
}

const controlPattern = toPattern(controlKeywords);
const storagePattern = toPattern(storageKeywords);

manual.patterns.unshift({
    name: 'keyword.control.pli',
    match: controlPattern
});

manual.patterns.unshift({
    name: 'keyword.storage.pli',
    match: storagePattern
});

const json = JSON.stringify(manual, null, 2);
await fs.writeFile('./packages/extension/syntaxes/pli.merged.json', json);
