import { Component, OnInit } from '@angular/core';
import { PlunetReportRepository } from '@app/shared/repositories/plunet-report.repository';
import { PlunetReportUpcomingJobDueDatesParamsVm } from '@app/shared/models/PlunetReportUpcomingJobDueDatesParamsVm';
import { PlunetReportUpcomingJobDueDatesResultVm } from '@app/shared/models/PlunetReportUpcomingJobDueDatesResultVm';
import { UserVmExt } from '@app/users/user-vm-ext';
import { AppInfoDataExt } from '@app/shared/models/app-info-data-ext';
import { AppInfoState } from '@app/shared/states/app-info.state';
import { CurrentUserState } from '@app/shared/states/current-user.state';
import { ReduceStore } from 'reduce-store';

@Component({
  selector: 'report-upcoming-job-due-dates',
  templateUrl: './upcoming-job-due-dates.component.html',
})
export class ReportUpcomingJobDueDatesComponent implements OnInit {
  rows: PlunetReportUpcomingJobDueDatesResultVm[];
  currentUser: UserVmExt;
  appInfo: AppInfoDataExt;
  totalRows: number;
  pageIndex = 1;
  dateFormat: string;
  timeFormat: string;
  locale: string;
  timeZone: string;
  isBusy: boolean = false;

  private itemsPerPage = 5;

  constructor(
    private store: ReduceStore,
    private reportRepo: PlunetReportRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    [this.appInfo, this.currentUser] = await Promise.all([
      this.store.getState(AppInfoState).then(x => x.data),
      this.store.getState(CurrentUserState).then(x => x.value)
    ]);

    this.dateFormat = this.currentUser.userProfileExt.shortDateFormat;
    this.timeFormat = this.currentUser.userProfileExt.shortTimeFormat;
    this.locale = this.currentUser.userProfileExt.language;
    this.timeZone = this.currentUser.userProfileExt.timeZone.offset;
    this.totalRows = await this.reportRepo.getUpcomingJobDueDatesTotalRows(this.currentUser.plunetEmployeeId);
    this.loadRows();
  }

  async gotoPage(pageIndex: number): Promise<void> {
    this.pageIndex = pageIndex;
    this.isBusy = true;
    await this.loadRows();
    this.isBusy = false;
  }

  async loadRows(): Promise<void> {
    const params = new PlunetReportUpcomingJobDueDatesParamsVm({
      plunetEmployeeId: this.currentUser.plunetEmployeeId,
      limit: this.itemsPerPage,
      offset: (this.pageIndex - 1) * this.itemsPerPage
    });
    this.rows = await this.reportRepo.getUpcomingJobDueDates(params);
    this.rows.forEach(x => x.dueDatePlunet = new Date(x.dueDatePlunet));
  }

  isOverdue(date: Date): boolean {
    return new Date() > date;
    //return this.appInfo.plunetNow > date;
  }
}
