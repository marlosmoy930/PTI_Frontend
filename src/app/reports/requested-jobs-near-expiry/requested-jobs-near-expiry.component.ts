import { Component, OnInit } from '@angular/core';
import { PlunetReportRepository } from '@app/shared/repositories/plunet-report.repository';
import { UserVmExt } from '@app/users/user-vm-ext';
import { AppInfoDataExt } from '@app/shared/models/app-info-data-ext';
import { RequestedJobsNearExpiryRowVm } from '@app/shared/models/RequestedJobsNearExpiryRowVm';
import { PlunetReportRequestedJobsNearExpiryParamsVm } from '@app/shared/models/PlunetReportRequestedJobsNearExpiryParamsVm';
import { AppInfoState } from '@app/shared/states/app-info.state';
import { ReduceStore } from 'reduce-store';
import { CurrentUserState } from '@app/shared/states/current-user.state';

@Component({
  selector: 'report-requested-jobs-near-expiry',
  templateUrl: './requested-jobs-near-expiry.component.html',
})
export class ReportRequestedJobsNearExpiryComponent implements OnInit {
  rows: RequestedJobsNearExpiryRowVm[];
  currentUser: UserVmExt;
  appInfo: AppInfoDataExt;
  totalRows: number;
  pageIndex = 1;
  dateFormat: string;
  timeFormat: string;
  locale: string;
  timeZone: string;
  isBusy: boolean = false;

  itemsPerPage = 5;

  constructor(
    private store: ReduceStore,
    private reportRepo: PlunetReportRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    [this.appInfo, this.currentUser] = await Promise.all([
      this.store.getState(AppInfoState).then(x => x.data),
      this.store.getState(CurrentUserState).then(x => x.value)]);

    this.dateFormat = this.currentUser.userProfileExt.shortDateFormat;
    this.timeFormat = this.currentUser.userProfileExt.shortTimeFormat;
    this.locale = this.currentUser.userProfileExt.language;
    this.timeZone = this.currentUser.userProfileExt.timeZone.offset;
    this.totalRows = await this.reportRepo.getRequestedJobsNearExpiryTotalRows(this.currentUser.plunetEmployeeId);
    this.loadRows();
  }

  async gotoPage(pageIndex: number): Promise<void> {
    this.pageIndex = pageIndex;
    this.isBusy = true;
    await this.loadRows();
    this.isBusy = false;
  }

  async loadRows(): Promise<void> {
    const params = new PlunetReportRequestedJobsNearExpiryParamsVm({
      plunetEmployeeId: this.currentUser.plunetEmployeeId,
      limit: this.itemsPerPage,
      offset: (this.pageIndex - 1) * this.itemsPerPage
    });
    this.rows = await this.reportRepo.getRequestedJobsNearExpiry(params);
    this.rows.forEach(x => x.expiryDatePlunet = new Date(x.expiryDatePlunet));
  }

}
