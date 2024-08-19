import { DefaultIndexManager, LangiumDocument } from "langium";

export class PliIndexManager extends DefaultIndexManager {
    override isAffected(document: LangiumDocument, changedUris: Set<string>): boolean {
        return false;
    }
}