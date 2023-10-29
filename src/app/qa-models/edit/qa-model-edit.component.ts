import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';
import { EnumUtil } from '@app/shared/utils/enum.util';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { SelectOption } from '@app/shared/models/select-option';
import { FormUtil } from '@app/shared/utils/form.util';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { QaModelFailedType } from '@app/shared/models/QaModelFailedType';
import * as appInfo from '@app/shared/states/app-info.state';
import { ReduceStore } from 'reduce-store';
import { QaSeverityVm } from '@app/shared/models/QaSeverityVm';
import { QaCategoryVm } from '@app/shared/models/QaCategoryVm';
import { QaSeverityRepository } from '@app/shared/repositories/qa-severity.repository';
import { QaCategoryRepository } from '@app/shared/repositories/qa-category.repository';
import { BsModalService, ModalOptions, BsModalRef } from 'ngx-bootstrap/modal';
import { QaSeverityEditComponent } from '@app/qa-severities/edit/qa-severities-edit.component';
import { QaCategoryEditComponent } from '@app/qa-categories/edit/qa-categories-edit.component';
import { QaModelVmExt } from '@app/qa-models/edit/QaModelVmExt';

@Component({
  selector: 'qa-model-edit',
  styleUrls: ['./qa-model-edit.component.scss'],
  templateUrl: './qa-model-edit.component.html',
})
export class QaModelEditComponent implements OnInit {
  private appInfo: appInfo.AppInfoState;

  @ViewChild('form') form: FormGroup;

  errorOnSave: string;
  isNew: boolean;
  isBusy: boolean;
  model: QaModelVmExt;
  severities: QaSeverityVm[] = [];
  categories: QaCategoryVm[] = [];
  failedTypes: SelectOption<number>[];
  isFormValidated: boolean;
  canBeDeleted: boolean = false;
  isBenchmarkQaModel: boolean = false;
  viewType: PenaltyPointViewType = PenaltyPointViewType.Model;
  viewTypes: SelectOption<PenaltyPointViewType>[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private qaModelRepo: QaModelRepository,
    private qaSeverityRepo: QaSeverityRepository,
    private qaCategoryRepo: QaCategoryRepository,
    private modalService: BsModalService,
    private store: ReduceStore,
  ) {
    this.viewTypes = EnumUtil.toSelectOptions(PenaltyPointViewType);
    this.failedTypes = EnumUtil.toSelectOptions(QaModelFailedType);
  }

  async ngOnInit(): Promise<void> {
    const modelId = <number>this.route.snapshot.params.id;
    if (modelId > 0) {
      this.loadData(modelId);
    } else {
      this.isNew = true;
      this.model = new QaModelVmExt({});
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
      this.model.id = await this.qaModelRepo.create(this.model).catch(reason => { this.errorOnSave = reason; return 0; });
      this.isNew = false;
    } else {
      await this.qaModelRepo.update(this.model).catch(reason => { this.errorOnSave = reason; });
    }

    if (this.errorOnSave) {
      this.isBusy = false;
      return;
    }

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.dialogService.alert({ messageKey: 'Shared.Text.Successfully' });
    }
  }

  async delete(): Promise<void> {
    const dialogResult = await this.dialogService.confirm({ messageKey: 'Confirm.Delete' });
    if (!dialogResult.isConfirmed) return;

    this.isBusy = true;
    this.errorOnSave = '';

    await this.qaModelRepo.delete(this.model.id).catch(reason => { this.errorOnSave = reason; });

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.navigateToList();
    }
  }

  async setAsBenchmarkModel(): Promise<void> {
    const dialogResult = await this.dialogService.confirm({ messageKey: 'QaModel.Edit.SetAsBenchmarkConfirmation' });
    if (!dialogResult.isConfirmed) return;

    this.isBusy = true;
    this.errorOnSave = '';

    await this.qaModelRepo.setAsBenchmark(this.model.id).catch(reason => { this.errorOnSave = reason; });

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.store.reduce(appInfo.AppInfoStateInitReducer);
      this.appInfo = await this.store.getState(appInfo.AppInfoState)
      this.isBenchmarkQaModel = true;
      await this.loadData(this.model.id);
      this.dialogService.alert({ messageKey: 'Shared.Text.Successfully' });
    }
  }

  navigateToList(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  navigateToCategories(): void {
    this.router.navigate(['qa-categories'], { relativeTo: this.route });
  }

  navigateToSeverities(): void {
    this.router.navigate(['qa-severities'], { relativeTo: this.route });
  }

  showEditSeverityModal(severityId: number): void {
    if (this.isBusy) return;

    const options = this.getModalOptions();
    const modalRef = this.modalService.show(QaSeverityEditComponent, options);
    const component = modalRef.content as QaSeverityEditComponent;
    component.qaModelId = this.model.id;
    component.severityId = severityId;
    component.isModalView = true;
    component.onEditFinished = this.getOnEditFinishedCallback(modalRef);
    component.loadData();
  }

  showEditCategoryModal(categoryId: number): void {
    if (this.isBusy) return;

    const options = this.getModalOptions();
    const modalRef = this.modalService.show(QaCategoryEditComponent, options);
    const component = modalRef.content as QaCategoryEditComponent;
    component.qaModelId = this.model.id;
    component.categoryId = categoryId;
    component.isModalView = true;
    component.onEditFinished = this.getOnEditFinishedCallback(modalRef);
    component.loadData();
  }

  private getOnEditFinishedCallback(modalRef: BsModalRef): () => Promise<void> {
    return async () => {
      await this.loadData(this.model.id);
      modalRef.hide();
    }
  }

  private async loadData(modelId): Promise<void> {
    [
      this.model,
      this.canBeDeleted,
      this.appInfo,
      this.severities,
      this.categories
    ] = await Promise.all([
      this.qaModelRepo.getById(modelId).then(x => new QaModelVmExt(x)),
      this.qaModelRepo.canBeDeleted(modelId),
      this.store.getState(appInfo.AppInfoState),
      this.qaSeverityRepo.getByModelId(modelId),
      this.qaCategoryRepo.getByModelId(modelId),
    ]);
    this.isBenchmarkQaModel = this.model.id == this.appInfo.data.ptiSystemSetting.benchmarkQaModelId
  }

  private getModalOptions(): ModalOptions {
    return { backdrop: 'static', }
  }
}

enum PenaltyPointViewType {
  Model = 1,
  Benchmark = 2,
  Both = 3,
}
