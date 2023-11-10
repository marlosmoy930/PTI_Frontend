import { Component, OnInit, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { PlunetReportRepository } from '@app/shared/repositories/plunet-report.repository';
import { PlunetEmployeeVm } from '@app/shared/models/PlunetEmployeeVm';
import { FormGroup } from '@angular/forms';
import { FormUtil } from '@app/shared/utils/form.util';
import { getOrDefault } from '@app/shared/utils/common.util';
import { PlunetReportTesterHoursByLeadParamsVm } from '@app/shared/models/PlunetReportTesterHoursByLeadParamsVm';
import { TesterHoursByLeadState, TesterHoursByLeadStateSetStateReducer } from '@app/reports/tester-hours-by-lead/tester-hours-by-lead.state';
import { PlunetEmployeesState } from '@app/plunet-entities/plunet-employees.state';
import { PlunetProjectVm } from '@app/shared/models/PlunetProjectVm';
import { PlunetMasterProjectState } from '@app/plunet-entities/plunet-master-projects.state';
import { ReduceStore } from 'reduce-store';

@Component({
  selector: 'report-tester-hours-by-lead',
  templateUrl: './tester-hours-by-lead.component.html',
})
export class ReportTesterHoursByLeadComponent implements OnInit {
  @ViewChild('form', { static: true }) form: FormGroup;

  state = new TesterHoursByLeadState();
  employees: PlunetEmployeeVm[] = [];
  projects: PlunetProjectVm[] = [];

  isEndDateInvalid: boolean;
  _isBusy: boolean = false;

  private subscription: { unsubscribe: () => void };

  constructor(
    public bsModalRef: BsModalRef,
    private modalService: BsModalService,
    private store: ReduceStore,
    private reportRepo: PlunetReportRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    this.subscription = this.modalService.onHidden.subscribe(this.onHidden.bind(this));

    [this.state, this.employees, this.projects] = await Promise.all([
      this.store.getState(TesterHoursByLeadState),
      this.store.getState(PlunetEmployeesState).then(x => x.items),
      this.store.getState(PlunetMasterProjectState).then(x => x.items),
    ]);
  }

  get isBusy(): boolean {
    return this._isBusy;
  }

  set isBusy(value: boolean) {
    this._isBusy = value;
    FormUtil.updateFormAccess(this.form, !value);
  }

  onHidden(reason: string): void {
    this.subscription.unsubscribe();
    this.subscription = null;
    this.store.reduce(TesterHoursByLeadStateSetStateReducer, this.state);
  }

  validate(): Promise<any> {
    return new Promise(resolve => setTimeout(() => {
      if (this.state.startDate && this.state.endDate && this.state.startDate > this.state.endDate) {
        this.form.controls.endDate.setErrors({ range: true });
        this.isEndDateInvalid = true;
      } else if (!this.state.endDate) {
        this.form.controls.endDate.setErrors({ required: true });
        this.isEndDateInvalid = false;
      } else {
        this.form.controls.endDate.setErrors(null);
        this.isEndDateInvalid = false;
      }
      if (this.form.updateValueAndValidity) {
        this.form.updateValueAndValidity();
      }
      resolve();
    }));
  }

  async generateReport(): Promise<void> {
    if (this.isBusy) return;

    this.isBusy = true;
    await this.validate();

    FormUtil.markAsTouched(this.form);

    if (this.form.invalid) {
      this.isBusy = false;
      return;
    }

    const model = new PlunetReportTesterHoursByLeadParamsVm({
      startDate: this.state.startDate.setOffsetToUTC(),
      endDate: this.state.endDate.setOffsetToUTC(),
      plunetEmployeeId: getOrDefault(() => this.state.lead.id, null),
      projectIds: getOrDefault(() => this.state.projects.map(x => x.id))
    });

    await this.reportRepo.getLeadTesterHours(model);

    this.isBusy = false;

    this.bsModalRef.hide();
  }
}
