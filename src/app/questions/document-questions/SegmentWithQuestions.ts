import { LanguageWithQuestions } from '@app/questions/document-questions/LanguageWithQuestions';
import { DocumentQuestionVm } from '@app/shared/models/DocumentQuestionVm';
import { Group } from '@app/shared/utils/array-extensions';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { TranslationSegmentAnswerRepository } from '@app/shared/repositories/translation-segment-answer.repository';

export class SegmentWithQuestions {
  segmentNumber: number;
  sourceContent: string;
  languageItems: LanguageWithQuestions[];

  constructor(init: Partial<SegmentWithQuestions>) {
    Object.assign(this, init);
  }

  static create(
    group: Group<number, DocumentQuestionVm>,
    languages: LanguageVm[]): SegmentWithQuestions {
    const languageItems = group.elements
      .groupBy(x => x.translationTargetLanguageId)
      .map(x => LanguageWithQuestions.create(x, languages));

    const sourceContent = group.elements[0]?.translationSegmentSourceContent;
    const segment = new SegmentWithQuestions({
      segmentNumber: group.key,
      sourceContent,
      languageItems,
    });
    return segment;
  }
}
