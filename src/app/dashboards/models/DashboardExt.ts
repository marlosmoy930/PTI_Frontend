import { DashboardChartExt } from "@app/dashboards/models/DashboardChartExt";
import { UserDashboardVm } from '@app/shared/models/UserDashboardVm';

var nameMaxLength = 50;

export class DashboardExt extends UserDashboardVm {
  name: string;
  charts: DashboardChartExt[];

  constructor(init: Partial<UserDashboardVm>) {
    super(init);
    this.setName(this.name);
    this.charts = (this.charts || []).map(x => new DashboardChartExt(x));
  }

  setName(newName: string): void {
    this.name = newName.take(nameMaxLength);
  }
}
