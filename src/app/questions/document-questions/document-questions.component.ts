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
import { TranslationLanguage } from './TranslationLanguage';
import { SegmentWithQuestions } from '@app/questions/document-questions/SegmentWithQuestions';

@Component({
  selector: 'document-questions',
  templateUrl: './document-questions.component.html',
  styleUrls: ['./document-questions.component.scss'],
})
export class DocumentQuestionsComponent implements OnInit, OnDestroy {
  private documentId: number;

  isBusy: boolean;
  isDocumentSectionVisible: boolean = false;
  document: DocumentVm;
  segments: SegmentWithQuestions[];
  languages: LanguageVm[];
  memoQTranslationUrls: MemoQTranslationUrlVm[];
  translationLanguages: TranslationLanguage[];

  constructor(
    private i18n: I18nService,
    private dialog: DialogService,
    private route: ActivatedRoute,
    private questionRepo: QuestionRepository,
    private documentRepo: DocumentRepository,
    private translationSegmentAnswerRepo: TranslationSegmentAnswerRepository,
    private translationSegmentRepo: TranslationSegmentRepository,
  ) { }

  get hasUnreadAnswers(): boolean {
    return this.segments?.any(x => x.hasUnreadAnswers);
  }

  ngOnDestroy(): void { }

  async ngOnInit(): Promise<void> {
    this.documentId = <number>this.route.snapshot.params.documentId;

    commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.languages = await Store.state.get(languages.State).then(x => x.items);
      this.loadData();
    });
  }

  async export(translationId: number): Promise<void> {
    commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      await this.translationSegmentRepo.exportQuestionsAndAnswersByTranslationId(translationId);
    });
  }

  async import(files: File[]): Promise<void> {
    if (!files || !files.length) return;

    let failedSegments = new Array<number>();
    await commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const results = await this.translationSegmentRepo.importQuestionsAndAnswersByTranslationId(files);
      failedSegments = results
        .filter(x => !x.isSuccess)
        .map(x => x.translationSegmentId);

      await this.loadData();
    });

    if (failedSegments.length) {
      let message = await this.i18n.getValue("Translation.Questions.Answers.ImportFailed");
      message += failedSegments.join(", ");
      await this.dialog.alert({ message, titleKey: "Shared.Text.Failed" })
    } else {
      await Store.reduce.byConstructor(toasts.AddSuccessfullyToastReducer);
    }

  }

  async markAllTranslationAnswersAsRead(): Promise<void> {
    await commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      await this.translationSegmentAnswerRepo.markAllTranslationAnswersAsRead(this.documentId);
      await this.loadData();
    });
  }

  private async loadData(): Promise<void> {
    let questions: DocumentQuestionVm[];
    [this.document, questions, this.memoQTranslationUrls] = await Promise.all([
      this.documentRepo.getById(this.documentId),
      this.questionRepo.getQuesionsByDocument(this.documentId),
      this.documentRepo.getMemoQTranslationUrls(this.documentId),
    ]);

    this.translationLanguages = questions
      .distinctBy(x => x.translationId)
      .map(x => {
        const language = this.languages.find(l => l.id == x.translationTargetLanguageId);
        const item = new TranslationLanguage({
          translationId: x.translationId,
          targetLanguage: language.name
        });
        return item;
      })

    const previousSegments = this.segments?.slice(0);
    this.segments = questions
      .groupBy(x => x.translationSegmentNumber)
      .orderBy(x => x.key)
      .map(x => SegmentWithQuestions.create(x, this.languages, this.translationSegmentAnswerRepo));

    if (previousSegments?.length) {
      for (let segment of this.segments) {
        const previousSegment = previousSegments.find(x => x.segmentNumber == segment.segmentNumber);
        if (!previousSegment) continue;

        segment.isCollapsed = previousSegment.isCollapsed;

        if (!segment.hasMultipleLanguages) continue;

        for (let previousSelectedLanguageItem of previousSegment.selectedLanguageItems) {
          const languageItem = segment.languageItems.find(
            x => x.targetLanguageId == previousSelectedLanguageItem.targetLanguageId)
          segment.selectedLanguageItems.pushIfTruthy(languageItem);
        }
      }
    }

  }
}


