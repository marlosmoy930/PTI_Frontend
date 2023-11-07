export class TranslationLanguage {
    translationId: number;
    targetLanguage: string;
    constructor(init: Partial<TranslationLanguage>) {
        Object.assign(this, init);
    }
}
