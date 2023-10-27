import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { FormUtil } from '@app/shared/utils/form.util';
import { QaCategoryRepository } from '@app/shared/repositories/qa-category.repository';
import { QaCategoryVm } from '@app/shared/models/QaCategoryVm';
import { ReduceStore } from 'reduce-store';
import * as appInfo from '@app/shared/states/app-info.state';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { QaModelVm } from '@app/shared/models/QaModelVm';

@Component({
  selector: 'qa-categories-edit',
  templateUrl: './qa-categories-edit.component.html',
})
export class QaCategoryEditComponent implements OnInit {
  @ViewChild('form') form: FormGroup;
  errorOnSave: string;
  isNew: boolean;
  isBusy: boolean;
  model: QaCategoryVm;
  qaModel: QaModelVm;
  benchmarkQaCategories: QaCategoryVm[];
  isFormValidated: boolean;
  canBeDeleted: boolean = false;
  qaModelId: number;
  categoryId: number;
  isModalView: boolean = false;
  onEditFinished: () => Promise<void>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private store: ReduceStore,
    private qaModelRepo: QaModelRepository,
    private qaCategoryRepo: QaCategoryRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    this.categoryId = <number>this.route.snapshot.params.categoryId;
    this.qaModelId = <number>this.route.snapshot.params.id;

    if (this.qaModelId) this.loadData();
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
      this.model.id = await this.qaCategoryRepo.create(this.model).catch(reason => { this.errorOnSave = reason; return 0; });
    } else {
      await this.qaCategoryRepo.update(this.model).catch(reason => { this.errorOnSave = reason; });
    }

    if (this.errorOnSave) {
      this.isBusy = false;
      return;
    }

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.navigateToList();
    }
  }

  async delete(): Promise<void> {
    const dialogResult = await this.dialogService.confirm({ messageKey: 'Confirm.Delete' });
    if (!dialogResult.isConfirmed) return;

    this.isBusy = true;
    this.errorOnSave = '';

    await this.qaCategoryRepo.delete(this.model.id).catch(reason => { this.errorOnSave = reason; });

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.navigateToList();
    }
  }

  navigateToList(): void {
    if (this.isModalView)
      this.onEditFinished();
    else
      this.router.navigate(['../'], { relativeTo: this.route });
  }

  async loadData(): Promise<void> {
    const appInfoData = await this.store.getState(appInfo.AppInfoState);
    const benchmarkQaModelId = appInfoData.data.ptiSystemSetting.benchmarkQaModelId
    this.benchmarkQaCategories = await this.qaCategoryRepo.getByModelId(benchmarkQaModelId);

    if (this.categoryId > 0) {
      [this.model, this.canBeDeleted, this.qaModel] = await Promise.all([
        this.qaCategoryRepo.getById(this.categoryId),
        this.qaCategoryRepo.canBeDeleted(this.categoryId),
        this.qaModelRepo.getById(this.qaModelId),
      ]);
    } else {
      this.isNew = true;
      this.model = new QaCategoryVm({ qaModelId: this.qaModelId, factor: 1 });
      this.qaModel = await this.qaModelRepo.getById(this.qaModelId);
    }
  }
}
