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

import { DefaultLexer, LexerResult } from "langium";
import { CompilerOptions } from "../compiler/options";
import { parseAbstractCompilerOptions } from "../compiler/parser";
import { translateCompilerOptions } from "../compiler/translator";
import { PliTokenBuilder } from "./pli-token-builder";

const NEWLINE = '\n'.charCodeAt(0);

export class PliLexer extends DefaultLexer {

    compilerOptions: CompilerOptions = {};

    protected override readonly tokenBuilder!: PliTokenBuilder;

    override tokenize(text: string): LexerResult {
        const lines = this.splitLines(text);
        this.fillCompilerOptions(lines);
        this.tokenBuilder.or = this.compilerOptions.or || '|';
        this.tokenBuilder.not = this.compilerOptions.not || '¬';
        const adjustedLines = lines.map(line => this.adjustLine(line));
        const adjustedText = adjustedLines.join('');
        return super.tokenize(adjustedText);
    }

    private splitLines(text: string): string[] {
        const lines: string[] = [];
        for (let i = 0; i < text.length; i++) {
            const start = i;
            while (i < text.length && text.charCodeAt(i) !== NEWLINE) {
                i++;
            }
            lines.push(text.substring(start, i + 1));
        }
        return lines;
    }

    private fillCompilerOptions(lines: string[]): CompilerOptions {
        const max = Math.min(lines.length, 100);
        for (let i = 0; i < max; i++) {
            const line = lines[i];
            if (line.includes('*PROCESS')) {
                const startChar = line.indexOf('*PROCESS');
                let endChar = line.lastIndexOf(';', startChar);
                if (endChar < 0) {
                    // Ensure we keep the correct line ending
                    if (line.endsWith('\r\n')) {
                        endChar = line.length - 2;
                    } else if (line.endsWith('\n')) {
                        endChar = line.length - 1;
                    } else {
                        endChar = line.length;
                    }
                }
                const compilerOptionsText = line.substring(startChar + '*PROCESS'.length, endChar);
                const parsed = parseAbstractCompilerOptions(compilerOptionsText);
                this.compilerOptions = translateCompilerOptions(parsed);
                const newText = line.substring(0, startChar) + ' '.repeat(endChar - startChar) + line.substring(endChar);
                lines[i] = newText;
                return this.compilerOptions;
            }
        }
        this.compilerOptions = {};
        return this.compilerOptions;
    }

    private adjustLine(line: string): string {
        let eol = '';
        if (line.endsWith('\r\n')) {
            eol = '\r\n';
        } else if (line.endsWith('\n')) {
            eol = '\n';
        }
        const prefixLength = 1;
        const lineLength = line.length - eol.length;
        if (lineLength < prefixLength) {
            return ' '.repeat(lineLength) + eol;
        }
        const lineEnd = 72;
        const prefix = ' '.repeat(prefixLength);
        let postfix = '';
        if (lineLength > lineEnd) {
            postfix = ' '.repeat(lineLength - lineEnd);
        }
        return prefix + line.substring(prefixLength, Math.min(lineEnd, lineLength)) + postfix + eol;
    }

}
