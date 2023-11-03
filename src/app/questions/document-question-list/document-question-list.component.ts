import { Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import * as commonUtil from '@app/shared/utils/common.util';
import { TranslationSegmentAnswerRepository } from '@app/shared/repositories/translation-segment-answer.repository';
import * as toasts from '@app/shared/components/toasts/toasts-state';
import { Store } from 'reduce-store';
import { DocumentRepository } from '@app/shared/repositories/document.repository';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { QuestionRepository } from '@app/shared/repositories/question.repository';
import { DocumentQuestionVm } from '@app/shared/models/DocumentQuestionVm';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import * as languages from '@app/languages/state';
import { MemoQTranslationUrlVm } from '@app/shared/models/MemoQTranslationUrlVm';
import { TranslationSegmentRepository } from '@app/shared/repositories/translation-segment.repository';
import { I18nService } from '@app/shared/i18n/i18n.service';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { SegmentWithQuestions } from '@app/questions/document-questions/SegmentWithQuestions';
import { QuestionAnswer } from '@app/questions/document-questions/QuestionAnswer';
import { TranslationSegmentAnswerVm } from '@app/shared/models/TranslationSegmentAnswerVm';
import { TranslationUserRepository } from '@app/shared/repositories/translation-user.repository';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'document-questions',
  templateUrl: './document-question-list.component.html',
  styleUrls: ['./document-question-list.component.scss'],
})
export class DocumentQuestionListComponent implements OnInit, OnDestroy {
  private documentId: number;

  isInitialized: boolean = false;
  isBusy: boolean;
  isDocumentSectionVisible: boolean = false;
  isDocumentNotifierSectionVisible: boolean = false;
  isSourceVisible: boolean = false;
  isTargetVisible: boolean = false;
  hasChangedAnswers: boolean;
  document: DocumentVm;
  documentSubject: BehaviorSubject<DocumentVm>;
  languages: LanguageVm[];
  memoQTranslationUrls: MemoQTranslationUrlVm[];
  segments: SegmentWithQuestions[];

  constructor(
    private readonly i18n: I18nService,
    private readonly dialog: DialogService,
    private readonly route: ActivatedRoute,
    private readonly questionRepo: QuestionRepository,
    private readonly documentRepo: DocumentRepository,
    private readonly translationSegmentAnswerRepo: TranslationSegmentAnswerRepository,
  ) { }

  ngOnDestroy(): void { }

  async ngOnInit(): Promise<void> {
    this.documentId = <number>this.route.snapshot.params.documentId;

    commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      [this.document, this.languages, this.memoQTranslationUrls] = await Promise.all([
        this.documentRepo.getById(this.documentId),
        Store.state.get(languages.State).then(x => x.items),
        this.documentRepo.getMemoQTranslationUrls(this.documentId),
      ]);

      await this.loadSegments();
      this.documentSubject = new BehaviorSubject<DocumentVm>(this.document);
      this.isInitialized = true;
    });
  }

  updateIsContentChanged(answer: QuestionAnswer = null): void {
    answer?.updateIsContentChanged();
    this.hasChangedAnswers = this.segments.any(x => x.languageItems.any(i => i.answer.isContentChanged));
  }

  async updateAnswers(): Promise<void> {
    if (!this.hasChangedAnswers) return;

    const answersToUpdate = this.segments.selectMany(
      x => x.languageItems
        .filter(x => x.answer.isContentChanged)
        .map(i => i.answer));

    const updatePromises = answersToUpdate.map(async a => {
      const answerVm = new TranslationSegmentAnswerVm({
        id: a.translationSegmentAnswerId,
        translationSegmentId: a.translationSegmentId,
        answerContent: a.content,
      });

      a.translationSegmentAnswerId = await this.translationSegmentAnswerRepo.createOrUpdate(answerVm);
      a.originalContent = a.content;
      a.updateIsContentChanged();
    });

    await commonUtil.doWithIndicatorAsync(x => this.isBusy = x, Promise.all(updatePromises));
    this.updateIsContentChanged();
    Store.reduce.byConstructor(toasts.AddSuccessfullyToastReducer);
  }

  async import(files: File[]): Promise<void> {
    if (this.hasChangedAnswers) {
      const dialogResult = await this.dialog.confirm({ messageKey: 'Shared.Text.OperationWillDiscardChanges' });
      if (!dialogResult.isConfirmed) return;
    }

    if (!files || !files.length) {
      await this.dialog.alert({ messageKey: 'NoData' })
      return;
    }

    let failedSegments = new Array<number>();
    await commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const results = await this.questionRepo.importQuestionsAndAnswers(files);
      failedSegments = results
        .filter(x => !x.isSuccess)
        .map(x => x.translationSegmentId);

      await this.loadSegments();
    });

    if (failedSegments.length) {
      let message = await this.i18n.getValue("Questions.Answers.ImportFailed");
      message += failedSegments.join(", ");
      await this.dialog.alert({ message, titleKey: "Shared.Text.Failed" })
    } else {
      await Store.reduce.byConstructor(toasts.AddSuccessfullyToastReducer);
    }

  }

  async export(): Promise<void> {
    commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      await this.questionRepo.exportQuestionsAndAnswersByDocumentId(this.documentId);
    });
  }

  async discardChanges(): Promise<void> {
    const dialogResult = await this.dialog.confirm({ messageKey: 'Confirm.Operation' });
    if (!dialogResult.isConfirmed) return;

    const answers = this.segments.selectMany(x => x.languageItems.map(i => i.answer));
    answers.forEach(a => {
      a.content = a.originalContent;
      a.updateIsContentChanged();
    });

    this.updateIsContentChanged();
  }

  private async loadSegments(): Promise<void> {
    let questions: DocumentQuestionVm[];
    [this.document, questions, this.memoQTranslationUrls] = await Promise.all([
      this.documentRepo.getById(this.documentId),
      this.questionRepo.getQuesionsByDocument(this.documentId),
      this.documentRepo.getMemoQTranslationUrls(this.documentId),
    ]);

    this.segments = questions
      .groupBy(x => x.translationSegmentNumber)
      .orderBy(x => x.key)
      .map(x => SegmentWithQuestions.create(x, this.languages));

    this.updateIsContentChanged();
  }
}


