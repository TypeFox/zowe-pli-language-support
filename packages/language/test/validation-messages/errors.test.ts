import { EmptyFileSystem } from "langium";
import { expectIssue, parseHelper } from "langium/test";
import { beforeAll, describe, test } from "vitest";
import { createPliServices, PliProgram } from "../../src";

describe('Error messages', () => {
    let services: ReturnType<typeof createPliServices>;
    let parse: ReturnType<typeof parseHelper<PliProgram>>;

    beforeAll(async () => {
        services = createPliServices(EmptyFileSystem);
        parse = (input: string) => parseHelper<PliProgram>(services.pli)(input, { validation: true });
        await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
    });

    test('IBM1295IE Sole bound specified is less than 1', async () => {
        const document = await parse(`
            TEST: PROCEDURE OPTIONS(MAIN) REORDER;
            dcl x(-5) fixed bin;    
            END TEST;
        `);
        const diagnostics = document.diagnostics ?? [];
        const result = { document, diagnostics, dispose: undefined! };
        expectIssue(result, {
            code: 'IBM1295IE'
        });
    });

    test('IBM1324IE the name occurs more than once in the EXPORTS clause', async () => {
        const document = await parse(`
0PACK: PACKAGE EXPORTS(TEST, TEST);
0END;
        `);
        const diagnostics = document.diagnostics ?? [];
        const result = { document, diagnostics, dispose: undefined! };
        expectIssue(result, {
            code: 'IBM1324IE'
        });
    });

    test('IBM1388IE_NODESCRIPTOR attribute_is_invalid_when_any_parameter_has_NONCONNECTED_attribute', async () => {
        const document = await parse(`
0a: proc( x ) options(nodescriptor);
  dcl x(20) fixed bin nonconnected;
0end a;
        `);
        const diagnostics = document.diagnostics ?? [];
        const result = { document, diagnostics, dispose: undefined! };
        expectIssue(result, {
            code: 'IBM1388IE'
        });
    });
});