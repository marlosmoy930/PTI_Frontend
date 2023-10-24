import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { FormUtil } from '@app/shared/utils/form.util';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { LanguageRepository } from '@app/shared/repositories/language.repository';

@Component({
  selector: 'language-edit',
  templateUrl: './language-edit.component.html',
})
export class LanguageEditComponent implements OnInit {
  @ViewChild('form') form: FormGroup;
  errorOnSave: string;
  isNew: boolean;
  isBusy: boolean;
  model: LanguageVm;
  isFormValidated: boolean;
  hasDependecies: boolean = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private languageRepo: LanguageRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    const languageId = <number>this.route.snapshot.params.id;

    if (languageId > 0) {
      [this.model, this.hasDependecies] = await Promise.all([
        this.languageRepo.getById(languageId),
        this.languageRepo.hasDependecies(languageId),
      ]);
    } else {
      this.isNew = true;
      this.model = new LanguageVm();
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
      this.model.id = await this.languageRepo.create(this.model).catch(reason => { this.errorOnSave = reason; return 0; });
    } else {
      await this.languageRepo.update(this.model).catch(reason => { this.errorOnSave = reason; });
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

    await this.languageRepo.delete(this.model.id).catch(reason => { this.errorOnSave = reason; });

    this.isBusy = false;

    if (!this.errorOnSave) {
      this.navigateToList();
    }
  }

  navigateToList(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
