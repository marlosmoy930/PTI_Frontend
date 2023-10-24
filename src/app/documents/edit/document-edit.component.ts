import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ActivatedRoute } from '@angular/router';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { FormUtil } from '@app/shared/utils/form.util';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { DocumentRepository } from '@app/shared/repositories/document.repository';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { StoreService } from 'reduce-store';
import * as languages from '@app/languages/state';
import { ProjectRepository } from '@app/shared/repositories/project.repository';

@Component({
  selector: 'document-edit',
  templateUrl: './document-edit.component.html',
})
export class DocumentEditComponent implements OnInit {
  @ViewChild('form') form: FormGroup;
  errorOnSave: string;
  isNew: boolean;
  isBusy: boolean;
  model: DocumentVm;
  qaModels: QaModelVm[];
  languages: LanguageVm[];
  isFormValidated: boolean;
  hasDependecies: boolean = false;

  constructor(
    private store: StoreService,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private projectRepo: ProjectRepository,
    private documentRepo: DocumentRepository,
    private qaModelRepo: QaModelRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    const documentId = <number>this.route.snapshot.params.documentId;

    this.qaModelRepo.getList().then(items => this.qaModels = items);
    this.store.state.get(languages.State).then(x => this.languages = x.items);

    if (documentId > 0) {
      [this.model, this.hasDependecies] = await Promise.all([
        this.documentRepo.getById(documentId),
        this.documentRepo.canBeDeleted(documentId),
      ]);
    } else {
      this.isNew = true;
      this.hasDependecies = true;
      const projectId = <number>this.route.snapshot.params.id;

      const project = await this.projectRepo.getById(projectId);

      this.model = new DocumentVm({ projectId: project.id, projectName: project.name });
    }
  }

  async save(): Promise<void> {
    FormUtil.markAsTouched(this.form);
    this.isFormValidated = true;

    if (this.form.invalid) {
      return;
    }

    this.isBusy = true;
    this.errorOnSave = '';

    if (this.isNew) {
      this.model.id = await this.documentRepo.create(this.model).catch(reason => { this.errorOnSave = reason; return 0; });
    } else {
      await this.documentRepo.update(this.model).catch(reason => { this.errorOnSave = reason; });
    }

    if (this.errorOnSave) {
      this.isBusy = false;
      return;
    }

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.navigateBack();
    }
  }

  async delete(): Promise<void> {
    const dialogResult = await this.dialogService.confirm({ messageKey: 'Confirm.Delete' });
    if (!dialogResult.isConfirmed) return;

    this.isBusy = true;
    this.errorOnSave = '';

    await this.documentRepo.delete(this.model.id).catch(reason => { this.errorOnSave = reason; });

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.navigateBack();
    }
  }

  navigateBack(): void {
    window.history.back();
  }
}
