import { Type } from "@angular/core";

import { DashboardChartType } from "@app/shared/models/DashboardChartType";
import { IDashboardChartComponent } from "@app/dashboards/models/IDashboardChartComponent";
import { ChartIssueFilteredComponent } from '@app/charts/issue-filtered-chart/issue-filtered-chart.component';
import { IssueChartParameters } from "@app/charts/issue-filtered-chart/ChartParameters";
import { DashboardChartVm } from "@app/shared/models/DashboardChartVm";
import { QaSummaryFilter } from "@app/shared/models/QaSummaryFilter";
import { IssueChartGroupType } from "@app/shared/models/IssueChartGroupType";
import { IssueChartValueOperationType } from "@app/shared/models/IssueChartValueOperationType";
import { ChartParametersBase, ChartSizeType } from '@app/charts/ChartParametersBase';
import { ChartPeriodType } from "@app/shared/models/ChartPeriodType";
import { LegendDisplayType } from '@app/charts/ChartParametersBase';

const chartNameMaxLength = 50;

export class DashboardChartExt extends DashboardChartVm {
  componentType: Type<IDashboardChartComponent>;
  parameters: ChartParametersBase;

  constructor(init: Partial<DashboardChartVm>) {
    super(init);

    this.orderIndex = this.orderIndex || 0;

    this.setName(this.name);

    switch (this.type) {
      case DashboardChartType.Static:
      case DashboardChartType.Time:
        this.componentType = ChartIssueFilteredComponent;
        this.parameters = IssueChartParameters.create(this.parametersJson);
        break;
      default:
        throw new Error('DashboardChartType is not implemented');
    }
  }

  setName(newName: string): void {
    this.name = newName.take(chartNameMaxLength);
  }

  updateParametersJson(): void {
    this.parametersJson = JSON.stringify(this.parameters);
  }

  static create(
    dashboardId: number,
    chartName: string,
    chartType: DashboardChartType,
    orderIndex: number
  ): DashboardChartExt {
    const chart = new DashboardChartVm({
      id: 0,
      name: chartName,
      type: chartType,
      parametersJson: createChartParameters(chartType),
      dashboardId,
      orderIndex,
    });

    return new DashboardChartExt(chart);
  }
}

function createChartParameters(chartType: DashboardChartType): string {
  let parameters: {};
  switch (chartType) {
    case DashboardChartType.Static:
      parameters = new IssueChartParameters({
        filter: new QaSummaryFilter(),
        isParametersSectionVisible: true,
        groupByField1: IssueChartGroupType.Category,
        chartValueOperationType: IssueChartValueOperationType.Count,
        periodType: ChartPeriodType.Day,
        chartSizeType: ChartSizeType.Normal,
        legendDisplayType: LegendDisplayType.Top,
      });
      break;
    default:
      throw new Error('DashboardChartType is not implemented');
  }
  return JSON.stringify(parameters);
}
