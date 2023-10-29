import { Component, OnInit } from '@angular/core';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { QaModelFailedType } from '@app/shared/models/QaModelFailedType';
import { Router, ActivatedRoute } from '@angular/router';
import * as appInfo from '@app/shared/states/app-info.state';
import { ReduceStore } from 'reduce-store';

@Component({
  selector: 'qa-model-list',
  templateUrl: './qa-model-list.component.html',
})
export class QaModelListComponent implements OnInit {
  private appInfo: appInfo.AppInfoState;

  benchmarkModelName: string;
  rows: QaModelVm[];
  isBusy: boolean = false;

  constructor(
    private store: ReduceStore,
    private route: ActivatedRoute,
    private router: Router,
    private qaModelRepo: QaModelRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    [this.rows, this.appInfo] = await Promise.all([
      this.qaModelRepo.getList(),
      this.store.getState(appInfo.AppInfoState)]);

    const benchmarkQaModelId = this.appInfo.data.ptiSystemSetting.benchmarkQaModelId;
    this.benchmarkModelName = this.rows.find(x => x.id == benchmarkQaModelId).name;
  }

  getFailedTypeName(failedType: QaModelFailedType): string {
    return QaModelFailedType[failedType].splitCamelCase();
  }

  navigateToEdit(id: number): void {
    this.router.navigate([`/qa-models/${id}`], { relativeTo: this.route });
  }

}
