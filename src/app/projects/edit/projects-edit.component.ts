import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { FormUtil } from '@app/shared/utils/form.util';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { ProjectRepository } from '@app/shared/repositories/project.repository';

@Component({
  selector: 'projects-edit',
  templateUrl: './projects-edit.component.html',
})
export class ProjectEditComponent implements OnInit {
  @ViewChild('form') form: FormGroup;
  errorOnSave: string;
  isNew: boolean;
  isBusy: boolean;
  model: ProjectVm;
  qaModels: QaModelVm[];
  isFormValidated: boolean;
  canBeDeleted: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private projectRepo: ProjectRepository,
    private qaModelRepo: QaModelRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    const projectId = <number>this.route.snapshot.params.id;

    this.qaModelRepo.getList().then(items => this.qaModels = items);

    if (projectId > 0) {
      [this.model, this.canBeDeleted] = await Promise.all([
        this.projectRepo.getById(projectId),
        this.projectRepo.canBeDeleted(projectId),
      ]);
    } else {
      this.isNew = true;
      this.model = new ProjectVm();
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

    const model = this.model.clone();
    if (model.startDate) {
      model.startDate = model.startDate.getDateStart();
    }

    if (model.dueDate) {
      model.dueDate = model.dueDate.getDateStart();
    }

    if (model.finishDate) {
      model.finishDate = model.finishDate.getDateStart();
    }

    if (this.isNew) {
      this.model.id = await this.projectRepo.create(model).catch(reason => { this.errorOnSave = reason; return 0; });
    } else {
      await this.projectRepo.update(model).catch(reason => { this.errorOnSave = reason; });
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

    await this.projectRepo.delete(this.model.id).catch(reason => { this.errorOnSave = reason; });

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.navigateToList();
    }
  }

  navigateToList(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
