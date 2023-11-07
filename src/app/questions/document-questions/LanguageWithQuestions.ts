import { TranslationSegmentAnswerRepository } from '@app/shared/repositories/translation-segment-answer.repository';
import { DocumentQuestionVm } from '@app/shared/models/DocumentQuestionVm';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { Group } from '@app/shared/utils/array-extensions';
import { DocumentQuestionVmExt } from './DocumentQuestionVmExt';
import { QuestionAnswer } from './QuestionAnswer';

export class LanguageWithQuestions {
  targetLanguageId: number;
  targetLanguageAcronym: string;
  targetContent: string;
  questions: DocumentQuestionVm[];
  answer: QuestionAnswer;

  constructor(init: Partial<LanguageWithQuestions>) {
    Object.assign(this, init);
  }

  static create(
    group: Group<number, DocumentQuestionVm>,
    languages: LanguageVm[]): LanguageWithQuestions {

    const targetLanguageId = group.key;
    const targetLanguageAcronym = languages.find(x => x.id == targetLanguageId).acronym;
    const questions = group.elements.mapCtor(DocumentQuestionVmExt);
    const answer = QuestionAnswer.create(questions);
    const targetContent = questions[0].translationSegmentTargetContent;
    const language = new LanguageWithQuestions({
      targetLanguageId,
      targetLanguageAcronym,
      questions,
      answer,
      targetContent,
    });

    return language;
  }
}
