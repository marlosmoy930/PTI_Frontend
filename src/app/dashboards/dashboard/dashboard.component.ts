import { Component, OnInit, Input, ViewChild, ViewContainerRef, ComponentFactoryResolver, Output, EventEmitter } from '@angular/core';
import { DashboardExt } from '@app/dashboards/models/DashboardExt';
import { DashboardChartType } from '@app/shared/models/DashboardChartType';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { DashboardChartExt } from '@app/dashboards/models/DashboardChartExt';
import { DashboardChartRepository } from '@app/shared/repositories/dashboard-chart.repository';
import { ChartContainerComponent } from '@app/dashboards/chart-container/chart-container.component';
import * as commonUtil from '@app/shared/utils/common.util';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private chartContainers: ChartContainerComponent[] = [];

  @Output() onDashboardRemove = new EventEmitter<number>();
  @Output() onDashboardRename = new EventEmitter<DashboardExt>();
  @Input() data: DashboardExt;
  @ViewChild('componentsContainer', { read: ViewContainerRef, static: true }) componentsContainer: ViewContainerRef;

  isBusy: boolean = false;
  selectedChart: DashboardChartExt;

  constructor(
    private dashboardChartRepo: DashboardChartRepository,
    private dialogService: DialogService,
    private componentResolver: ComponentFactoryResolver,
  ) {
  }

  get canMoveCharts(): boolean {
    return this.chartContainers.length > 1;
  }

  async ngOnInit(): Promise<void> {
    const hasUniqueIndexes = this.data.charts
      .groupBy(x => x.orderIndex)
      .length == this.data.charts.length;

    if (!hasUniqueIndexes) {
      this.data.charts
        .orderBy(x => x.orderIndex)
        .forEach((c, i) => { c.orderIndex = i; });

      const updatePromises = this.data.charts.map(x => this.dashboardChartRepo.update(x));
      await commonUtil.doWithIndicatorAsync(x => this.isBusy = x, Promise.all(updatePromises));
    }

    this.addChartComponents();
  }

  async addChart(chartType: DashboardChartType): Promise<void> {
    const dialogResult = await this.dialogService.prompt({
      messageKey: 'Prompt.EnterName',
      infoKey: 'Validation.MaxLength.50'
    });
    if (dialogResult.isCanceled) return;

    const chart = DashboardChartExt.create(this.data.id, dialogResult.userInput, chartType, this.chartContainers.length);

    this.isBusy = true;

    chart.id = await this.dashboardChartRepo.create(chart);
    this.data.charts.push(chart);
    await this.addChartComponent(chart);

    this.isBusy = false;
  }

  removeDashboard(): void {
    this.onDashboardRemove.emit(this.data.id);
  }

  renameDashboard(): void {
    this.onDashboardRename.emit(this.data);
  }

  async removeChart(): Promise<void> {
    if (this.selectedChart == null) {
      this.dialogService.alert({ messageKey: 'Dashboard.PleaseSelectChart' });
      return;
    }

    const dialogResult = await this.dialogService.confirm({ messageKey: 'Confirm.Delete' });
    if (!dialogResult.isConfirmed) return;

    this.isBusy = true;

    await this.dashboardChartRepo.delete(this.selectedChart.id);
    this.data.charts = this.data.charts.filter(x => x.id != this.selectedChart.id);

    const containerIndex = this.chartContainers.findIndex(x => x.chart.id == this.selectedChart.id);
    this.componentsContainer.remove(containerIndex);

    this.chartContainers = this.chartContainers.filter(x => x.chart.id != this.selectedChart.id);

    this.selectedChart = null;
    this.isBusy = false;
  }

  async renameChart(): Promise<void> {
    if (this.selectedChart == null) {
      this.dialogService.alert({ messageKey: 'Dashboard.PleaseSelectChart' });
      return;
    }

    const dialogResult = await this.dialogService.prompt({
      messageKey: 'Prompt.EnterName',
      userInput: this.selectedChart.name,
      infoKey: 'Validation.MaxLength.50'
    });

    if (dialogResult.isCanceled) return;

    this.selectedChart.setName(dialogResult.userInput);

    this.isBusy = true;
    await this.dashboardChartRepo.update(this.selectedChart);
    this.isBusy = false;
  }

  async moveChart(increment: number): Promise<void> {
    if (this.selectedChart == null) {
      this.dialogService.alert({ messageKey: 'Dashboard.PleaseSelectChart' });
      return;
    }

    const selectedOrderIndex = this.selectedChart.orderIndex;
    let neigbourChart: DashboardChartExt;

    if (increment > 0) {
      neigbourChart = this.data.charts
        .slice()
        .orderBy(x => x.orderIndex)
        .find(x => x.orderIndex > selectedOrderIndex);
    } else {
      neigbourChart = this.data.charts
        .slice()
        .orderByDescending(x => x.orderIndex)
        .find(x => x.orderIndex < selectedOrderIndex);
    }

    if (!neigbourChart) return;

    const neigbourOrderIndex = neigbourChart.orderIndex;
    neigbourChart.orderIndex = selectedOrderIndex;
    this.selectedChart.orderIndex = neigbourOrderIndex;

    commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      await Promise.all([
        this.dashboardChartRepo.update(this.selectedChart),
        this.dashboardChartRepo.update(neigbourChart),
      ]);

      const selectedChart = this.selectedChart;
      this.selectedChart = null;
      this.addChartComponents();

      await commonUtil.timeoutPromise();
      this.selectChart(selectedChart);
    });
  }

  private selectChart(chart: DashboardChartExt): void {
    this.chartContainers.forEach(c => c.isSelected = false);

    if (this.selectedChart && this.selectedChart.id == chart.id) {
      this.selectedChart = null;
      return;
    }

    this.selectedChart = chart;
    const componentToSelect = this.chartContainers.find(x => x.chart.id == chart.id);
    componentToSelect.isSelected = true;
  }

  private addChartComponents(): void {
    this.chartContainers = [];
    this.componentsContainer.clear();
    this.data.charts
      .orderBy(x => x.orderIndex)
      .forEach(c => this.addChartComponent(c));
  }

  private async addChartComponent(chart: DashboardChartExt): Promise<void> {
    const factory = this.componentResolver.resolveComponentFactory(ChartContainerComponent);
    const componentContainerInstance = this.componentsContainer.createComponent(factory).instance;
    this.chartContainers.push(componentContainerInstance);

    await commonUtil.timeoutPromise();

    componentContainerInstance.addChart(chart, this.selectChart.bind(this));
  }

}
