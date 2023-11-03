import { Component, OnInit } from '@angular/core';

import { QaCategoryVm } from '@app/shared/models/QaCategoryVm';
import { Store } from 'reduce-store';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { doWithIndicatorAsync } from '@app/shared/utils/common.util';
import { QaSeverityVm } from '@app/shared/models/QaSeverityVm';
import * as qaModels from '@app/qa-models/state';
import * as categories from '@app/qa-categories/state';
import * as severities from '@app/qa-severities/state';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { QaSummaryRepository } from '@app/shared/repositories/qa-summary.repository';
import { QaSummaryFilter } from '@app/shared/models/QaSummaryFilter';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'qa-summary-translation-generate-issues',
  templateUrl: './generate-issues.component.html',
})
export class QaSummaryTranslationGenerateIssuesComponent implements OnInit {
  private allCategories: QaCategoryVm[];
  private allSeverities: QaSeverityVm[];

  isBusy: boolean = false;
  filter: QaSummaryFilter;
  qaModels: QaModelVm[];
  categories: QaCategoryVm[];
  severities: QaSeverityVm[];
  countPerTranslation: number;
  modalRef: BsModalRef;

  constructor(
    private summaryRepo: QaSummaryRepository,
    private dialogService: DialogService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.countPerTranslation = 1;

    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      [this.qaModels, this.allCategories, this.allSeverities,]
        = await Promise.all([
          Store.state.get(qaModels.State).then(x => x.items),
          Store.state.get(categories.State).then(x => x.items),
          Store.state.get(severities.State).then(x => x.items),
        ]);

      this.setCategoriesAndSeverities();
    });

  }

  onFilterQaModelChange(): void {
    this.filter.categoryId = undefined;
    this.filter.severityId = undefined;
    this.setCategoriesAndSeverities();
  }

  async generate(): Promise<void> {
    const count = Math.floor(this.countPerTranslation);

    if (isNaN(count) || count <= 0) {
      this.dialogService.alert({ messageKey: 'Shared.Text.InvalidNumber' });
      return;
    }

    this.isBusy = true;
    await this.summaryRepo.generateQaIssues(this.filter, count);
    this.isBusy = false;

    this.dialogService.alert({ messageKey: 'Translations.List.DoneNewIssuesWillAppearInReportAfterTheyAreProcessedBySystem' });

    this.close();
  }

  close(): void {
    this.modalRef.hide();
  }

  private setCategoriesAndSeverities(): void {
    if (this.filter.qaModelId) {
      this.categories = this.allCategories.filter(x => x.qaModelId == this.filter.qaModelId);
      this.severities = this.allSeverities.filter(x => x.qaModelId == this.filter.qaModelId);
    } else {
      this.categories = [];
      this.severities = [];
    }
  }

}
