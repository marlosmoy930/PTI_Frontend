import { Component, OnInit, ViewChild } from '@angular/core';
import { DashboardExt } from '@app/dashboards/models/DashboardExt';
import { UserDashboardRepository } from '@app/shared/repositories/user-dashboard.repository';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { TabsetComponent, TabDirective } from 'ngx-bootstrap/tabs';
import { timeoutPromise, doWithIndicatorAsync } from '@app/shared/utils/common.util';

@Component({
  selector: 'dashboard-tabs',
  templateUrl: './dashboard-tabs.component.html',
})
export class DashboardTabsComponent implements OnInit {
  @ViewChild('tabset', { static: true }) tabset: TabsetComponent;
  private previousTab: TabDirective;

  isBusy: boolean = false;
  dashboards: Array<DashboardExt>;

  constructor(
    private dialogService: DialogService,
    private userDashboardRepo: UserDashboardRepository,
  ) {
  }

  async ngOnInit(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const dashboards = await this.userDashboardRepo.getAll();
      this.dashboards = dashboards.map(x => new DashboardExt(x));

      if (this.dashboards.length > 0) {
        await timeoutPromise();
        this.tabset.tabs[1].active = true;
      }
    });
  }

  async addDashboard(): Promise<void> {
    const dialogResult = await this.dialogService
      .prompt({
        messageKey: 'Prompt.EnterName',
        infoKey: 'Validation.MaxLength.50'
      });

    if (dialogResult.isCanceled) {
      if (this.previousTab) this.previousTab.active = true;
      return;
    }

    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const newDashboardVm = new DashboardExt({ name: dialogResult.userInput });

      newDashboardVm.id = await this.userDashboardRepo.create(newDashboardVm);
      this.dashboards.push(newDashboardVm);
      await timeoutPromise();
      this.tabset.tabs[this.tabset.tabs.length - 1].active = true;
    });
  }

  async removeDashboard(dashboardToRemoveId: number): Promise<void> {
    const dialogResult = await this.dialogService.confirm({ messageKey: 'Confirm.Delete' });
    if (!dialogResult.isConfirmed) return;

    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      let dashboardToRemoveIndex = this.dashboards.findIndex(x => x.id == dashboardToRemoveId);

      await this.userDashboardRepo.delete(dashboardToRemoveId);

      this.dashboards = this.dashboards.filter(x => x.id != dashboardToRemoveId);

      await timeoutPromise();

      if (dashboardToRemoveIndex == 0 && this.dashboards.length > 0)
        dashboardToRemoveIndex = 1;

      this.tabset.tabs[dashboardToRemoveIndex].active = true;
    });
  }

  async renameDashboard(dashboardToRename: DashboardExt): Promise<void> {
    const dialogResult = await this.dialogService.prompt({
      messageKey: 'Prompt.EnterName',
      userInput: dashboardToRename.name,
      infoKey: 'Validation.MaxLength.50'
    });

    if (dialogResult.isCanceled) return;

    dashboardToRename.setName(dialogResult.userInput);

    this.isBusy = true;

    await this.userDashboardRepo.update(dashboardToRename);

    this.isBusy = false;
  }

  onDeselectTab(tab: TabDirective): void {
    this.previousTab = tab;
  }

}
