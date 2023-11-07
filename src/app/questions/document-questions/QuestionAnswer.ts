import { DocumentQuestionVm } from '@app/shared/models/DocumentQuestionVm';

export class QuestionAnswer {
  translationSegmentAnswerId: number;
  translationSegmentId: number;
  originalContent: string;
  content: string;

  isContentChanged: boolean;

  constructor(init: Partial<QuestionAnswer>) {
    Object.assign(this, init);
  }

  updateIsContentChanged(): void {
    this.isContentChanged = this.originalContent !== this.content;
  }

  static create(questions: DocumentQuestionVm[]): QuestionAnswer {
    const question = questions[0] || new DocumentQuestionVm({});
    const translationSegmentAnswerId = question.translationSegmentAnswerId;
    const content = question.translationSegmentAnswerContent;
    const translationSegmentId = question.translationSegmentId;
    const answer = new QuestionAnswer({
      translationSegmentAnswerId,
      translationSegmentId,
      content,
      originalContent: content,
    });
    return answer;
  }
}
