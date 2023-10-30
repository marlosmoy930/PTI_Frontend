import { Component, OnInit } from '@angular/core';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { Router, ActivatedRoute } from '@angular/router';
import { QaSeverityVm } from '@app/shared/models/QaSeverityVm';
import { QaSeverityRepository } from '@app/shared/repositories/qa-severity.repository';

@Component({
  selector: 'qa-severities-list',
  templateUrl: './qa-severities-list.component.html',
})
export class QaSeverityListComponent implements OnInit {
  qaModel: QaModelVm;
  rows: QaSeverityVm[];
  isBusy: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qaModelRepo: QaModelRepository,
    private qaSeverityRepo: QaSeverityRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    const qaModelId = <number>this.route.snapshot.params.id;
    [this.rows, this.qaModel] = await Promise.all([
      this.qaSeverityRepo.getByModelId(qaModelId),
      this.qaModelRepo.getById(qaModelId),
    ]);
  }

  navigateToEdit(id: number): void {
    this.router.navigate([`${id}`], { relativeTo: this.route });
  }
}
