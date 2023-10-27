import { Component, OnInit } from '@angular/core';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { Router, ActivatedRoute } from '@angular/router';
import { QaCategoryVm } from '@app/shared/models/QaCategoryVm';
import { QaCategoryRepository } from '@app/shared/repositories/qa-category.repository';
import { doWithIndicatorAsync } from '@app/shared/utils/common.util';

@Component({
  selector: 'qa-categories-list',
  templateUrl: './qa-categories-list.component.html',
})
export class QaCategoryListComponent implements OnInit {
  qaModel: QaModelVm;
  rows: QaCategoryVm[];
  isBusy: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qaModelRepo: QaModelRepository,
    private qaCategoryRepo: QaCategoryRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async() => {
      const qaModelId = <number>this.route.snapshot.params.id;
      [this.rows, this.qaModel] = await Promise.all([
        this.qaCategoryRepo.getByModelId(qaModelId),
        this.qaModelRepo.getById(qaModelId),
      ]);
    });
  }

  navigateToEdit(id: number): void {
    this.router.navigate([`${id}`], { relativeTo: this.route });
  }
}
