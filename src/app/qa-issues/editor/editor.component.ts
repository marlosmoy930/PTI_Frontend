import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';

import { ProjectVm } from '@app/shared/models/ProjectVm';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { QaCategoryVm } from '@app/shared/models/QaCategoryVm';
import { QaSeverityVm } from '@app/shared/models/QaSeverityVm';
import { QaCategoryRepository } from '@app/shared/repositories/qa-category.repository';
import { QaSeverityRepository } from '@app/shared/repositories/qa-severity.repository';
import { FormGroup } from '@angular/forms';
import { FormUtil } from '@app/shared/utils/form.util';
import { SelectOption } from '@app/shared/models/select-option';
import { EnumUtil } from '@app/shared/utils/enum.util';
import { ArbitrationStatus } from "src/app/shared/models/ArbitrationStatus";
import { EditQaIssueVm } from '@app/shared/models/EditQaIssueVm';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { TranslationVm } from '@app/shared/models/TranslationVm';
import { DocumentRepository } from '@app/shared/repositories/document.repository';
import { TranslationRepository } from '@app/shared/repositories/translation.repository';
import { QaIssueStatus } from '@app/shared/models/QaIssueStatus';
import { QaIssueRepository } from '@app/shared/repositories/qa-issue.repository';
import { BsModalService } from 'ngx-bootstrap/modal';
import { showImageModal, timeoutPromise } from '@app/shared/utils/common.util';
import { IntegrationConfig } from '../edit/IntegrationConfig';
import { TranslationProviderUserVm } from '@app/shared/models/TranslationProviderUserVm';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { QaIssueCommentsComponent } from '@app/qa-issues/comments/qa-issue-comments.component';
import { QaIssueCommentRepository } from '@app/shared/repositories/qa-issue-comment.repository';
import { QaIssueCommentVm } from '@app/shared/models/QaIssueCommentVm';
import { TranslationSegmentVm } from '@app/shared/models/TranslationSegmentVm';
import { TranslationSegmentRepository } from '@app/shared/repositories/translation-segment.repository';

@Component({
  selector: 'qa-issue-editor',
  templateUrl: './editor.component.html',
})
export class QaIssueEditorComponent implements OnInit {
  @Input() model: EditQaIssueVm;
  @Input() isTranslationSectionVisible: boolean = true;
  @Input() integrationConfig: IntegrationConfig;

  @Output() onSave = new EventEmitter();
  @Output() onCancel = new EventEmitter();

  @ViewChild('form') form: FormGroup;
  @ViewChild('qaIssueComments') qaIssueComments: QaIssueCommentsComponent;

  private screenshotUri: string;
  hasScreenshot: boolean = false;

  isBusy: boolean = false;

  qaModel: QaModelVm;
  projects: ProjectVm[];
  documents: DocumentVm[];
  translations: TranslationVm[];
  translators: TranslationProviderUserVm[];
  qaCategories: QaCategoryVm[];
  qaSeverities: QaSeverityVm[];
  translationSegments: TranslationSegmentVm[];
  arbitrationStatuses: SelectOption<number>[];
  statuses: SelectOption<number>[];

  comment: string;

  constructor(
    private modalService: BsModalService,
    private translationSegmentRepo: TranslationSegmentRepository,
    private projectRepo: ProjectRepository,
    private documentRepo: DocumentRepository,
    private translationRepo: TranslationRepository,
    private qaCategoryRepo: QaCategoryRepository,
    private qaSeverityRepo: QaSeverityRepository,
    private qaIssueCommentRepo: QaIssueCommentRepository,
    private qaIssueRepo: QaIssueRepository,
    private qaModelRepo: QaModelRepository,
  ) {
  }

  get isNew(): boolean {
    return this.model && !this.model.id;
  }

  get hasMemoQTranslator(): boolean {
    return !this.isNew
      && !this.integrationConfig
      && !this.model.translatorId
      && !!this.model.memoQTranslatorUserName;
  }

  async ngOnInit(): Promise<void> {
    this.arbitrationStatuses = EnumUtil.toSelectOptions(ArbitrationStatus);
    this.statuses = EnumUtil.toSelectOptions(QaIssueStatus);

    await this.loadListData();
    this.hasScreenshot = this.model.qaIssueFiles && this.model.qaIssueFiles.length > 0;

    if (!this.integrationConfig || !this.integrationConfig.shouldScrollToComments)
      return;

    await timeoutPromise();
    this.qaIssueComments.areCommentsVisible = true;
    await timeoutPromise();
    window.scrollTo(0, document.body.scrollHeight);
  }

  async onProjectChange(projectId: number, shouldClear: boolean = true): Promise<void> {
    if (shouldClear) {
      this.qaModel = undefined;
      this.documents = [];
      this.translations = [];
      this.translators = [];
      this.qaCategories = [];
      this.qaSeverities = [];
      this.qaSeverities = [];
      this.model.qaSeverityId = null;
      this.model.qaCategoryId = null;
      this.model.translatorId = null;
      this.model.translationId = null;
      this.model.documentId = null;
    }

    if (!projectId)
      return;

    this.documents = await this.documentRepo.getByProjectId(projectId);
    await this.onDocumentChange(this.model.documentId, shouldClear);
  }

  async onDocumentChange(documentId: number, shouldClear: boolean = true): Promise<void> {
    if (shouldClear) {
      this.qaModel = undefined;
      this.translations = [];
      this.translators = [];
      this.qaCategories = [];
      this.qaSeverities = [];
      this.qaSeverities = [];
      this.model.qaSeverityId = null;
      this.model.qaCategoryId = null;
      this.model.translatorId = null;
      this.model.translationId = null;
    }

    if (!documentId)
      return;

    this.translations = await this.translationRepo.getByDocumentId(documentId);
    await this.onTranslationChange(this.model.translationId, shouldClear);
  }

  async onTranslationChange(translationId: number, shouldClear: boolean = true): Promise<void> {
    if (shouldClear) {
      this.qaModel = undefined;
      this.translators = [];
      this.qaCategories = [];
      this.qaSeverities = [];
      this.qaSeverities = [];
      this.model.qaSeverityId = null;
      this.model.qaCategoryId = null;
      this.model.translatorId = null;
    }

    if (!translationId)
      return;

    const translation = this.translations.single(x => x.id == translationId);
    this.translators = translation.translators.distinctBy(t => t.id);

    const qaModelId = this.isNew ? translation.qaModelId : this.model.qaModelId;

    [
      this.qaModel,
      this.translationSegments,
      this.qaCategories,
      this.qaSeverities,
    ] = await Promise.all([
      this.qaModelRepo.getByTranslationId(translationId),
      this.translationSegmentRepo.getByTranslation(translation.id),
      this.qaCategoryRepo.getByModelId(qaModelId),
      this.qaSeverityRepo.getByModelId(qaModelId),
    ]);

    this.qaCategories.orderBy(x => x.name);
  }

  async save(): Promise<void> {
    FormUtil.markAsTouched(this.form);

    if (this.form.invalid) return;

    this.isBusy = true;

    if (this.model.translatorId == 0) this.model.translatorId = undefined;

    if (this.model.id)
      await this.qaIssueRepo.update(this.model);
    else {
      this.model.id = await this.qaIssueRepo.create(this.model);
    }

    if (this.comment) {
      const commentModel = new QaIssueCommentVm({
        comment: this.comment,
        qaIssueId: this.model.id
      });
      await this.qaIssueCommentRepo.create(commentModel);
    }

    this.isBusy = false;

    this.onSave.emit();
  }

  cancel(): void {
    this.onCancel.emit();
  }

  groupByCategory(category: QaCategoryVm): string {
    return category.groupName;
  }

  async showScreenshot(): Promise<void> {
    if (!this.screenshotUri)
      this.screenshotUri = await this.qaIssueRepo.getScreenshot(this.model.id, this.model.qaIssueFiles[0].id);

    showImageModal(this.modalService, { dataUri: this.screenshotUri });
  }

  onSegmentNumberChange(translationSegment: TranslationSegmentVm): void {
    this.model.segmentNumber = translationSegment && translationSegment.segmentNumber;
  }

  private async loadListData(): Promise<void> {
    this.projects = await this.projectRepo.getCurrentUserProjects();
    const shouldClear = false;
    await this.onProjectChange(this.model.projectId, shouldClear);
  }
}
