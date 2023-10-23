import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, OnInit, HostBinding } from '@angular/core';
import { DashboardChartExt } from '@app/dashboards/models/DashboardChartExt';
import { DashboardChartRepository } from '@app/shared/repositories/dashboard-chart.repository';
import { ChartParametersBase } from '@app/charts/ChartParametersBase';
import { IDashboardChartComponent } from '@app/dashboards/models/IDashboardChartComponent';

@Component({
  selector: 'chart-container',
  templateUrl: './chart-container.component.html',
  styleUrls: ['./chart-container.component.scss']
})
export class ChartContainerComponent implements OnInit {
  private onSelectHandler: (chart: DashboardChartExt) => void;

  @HostBinding('class.has-parameters') get hasParameters() {
    return this.parameters && this.parameters.isParametersSectionVisible;
  }

  @HostBinding('class.large') get isLarge() {
    return this.parameters && this.parameters.isLarge;
  }

  chart: DashboardChartExt;
  parameters: ChartParametersBase;
  chartComponentInstance: IDashboardChartComponent;

  @ViewChild('chartContainer', { read: ViewContainerRef, static: true }) chartContainer: ViewContainerRef;
  isSelected: boolean;

  constructor(
    private dashboardChartRepo: DashboardChartRepository,
    private componentResolver: ComponentFactoryResolver,
  ) {
  }

  ngOnInit(): void {
    this.chartContainer.clear();
  }

  addChart(chart: DashboardChartExt, onSelectHandler: (chart: DashboardChartExt) => void): void {
    this.chart = chart;
    this.onSelectHandler = onSelectHandler;

    const factory = this.componentResolver.resolveComponentFactory(chart.componentType);
    this.chartComponentInstance = this.chartContainer.createComponent(factory).instance;

    this.updateParameters();
    this.chartComponentInstance.init(chart.id, chart.type, chart.parameters, this.saveChart.bind(this));
    this.chartComponentInstance.update();
  }

  selectChart(): void {
    event.stopPropagation();
    this.onSelectHandler(this.chart);
  }

  async toggleParametersVisibility(): Promise<void> {
    this.chart.parameters.isParametersSectionVisible = !this.chart.parameters.isParametersSectionVisible;
    await this.saveChart();
  }

  private async saveChart(): Promise<void> {
    this.chart.updateParametersJson();
    this.updateParameters();
    this.chart.type = this.chartComponentInstance.getType();
    await this.dashboardChartRepo.update(this.chart);
  }

  private updateParameters(): void {
    this.parameters = new ChartParametersBase(this.chart.parameters);
  }
}
