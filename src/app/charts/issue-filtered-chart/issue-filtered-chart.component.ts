import { Component, OnInit, ViewChild } from '@angular/core';
import { ReduceStore } from 'reduce-store';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import * as languages from '@app/languages/state';
import * as projects from '@app/projects/state';
import * as translationProviders from '@app/translation-providers/state';
import { SelectOption } from '@app/shared/models/select-option';
import { EnumUtil } from '@app/shared/utils/enum.util';
import { ChartIssueComponent } from '@app/charts/issue-chart/issue-chart.component';
import { IssueChartParameters } from './ChartParameters';
import { IDashboardChartComponent } from '@app/dashboards/models/IDashboardChartComponent';
import { TranslationProviderVm } from '@app/shared/models/TranslationProviderVm';
import { doWithIndicatorAsync, timeoutPromise } from '@app/shared/utils/common.util';
import { ChartRepository } from '@app/shared/repositories/chart.repository';
import { IssueChartInput } from '@app/shared/models/IssueChartInput';
import { ChartData } from '@app/shared/models/ChartData';
import { IssueChartValueOperationType } from '@app/shared/models/IssueChartValueOperationType';
import { IssueChartGroupType } from "@app/shared/models/IssueChartGroupType";
import { ChartSizeType, LegendDisplayType } from '@app/charts/ChartParametersBase';
import { DashboardChartType } from '@app/shared/models/DashboardChartType';
import { ChartPeriodType } from '@app/shared/models/ChartPeriodType';

@Component({
  selector: 'chart-issue-filtered',
  templateUrl: './issue-filtered-chart.component.html',
  styleUrls: ['../shared-chart.component.scss']
})
export class ChartIssueFilteredComponent implements IDashboardChartComponent, OnInit {
  private saveHandler: () => Promise<void>;

  @ViewChild('chart', { static: true }) chartComponent: ChartIssueComponent;

  parameters: IssueChartParameters;
  chartType: DashboardChartType;
  chartId: number;

  isBusy: boolean = false;
  languages: LanguageVm[];
  projects: ProjectVm[];
  providers: TranslationProviderVm[];
  groupByFields: SelectOption<IssueChartGroupType>[];
  chartValueOperationTypes: SelectOption<IssueChartValueOperationType>[];
  chartSizeTypes: SelectOption<ChartSizeType>[];
  legendDisplayTypes: SelectOption<LegendDisplayType>[];
  chartTypes: SelectOption<DashboardChartType>[];
  chartPeriodTypes: SelectOption<ChartPeriodType>[];

  constructor(
    private chartRepo: ChartRepository,
    private store: ReduceStore,
  ) {
  }

  get isStaticChartType(): boolean {
    return this.chartType == DashboardChartType.Static;
  }

  get isTimeChartType(): boolean {
    return this.chartType == DashboardChartType.Time;
  }

  async ngOnInit(): Promise<void> {
    this.groupByFields = EnumUtil.toSelectOptions(IssueChartGroupType);
    this.chartValueOperationTypes = EnumUtil.toSelectOptions(IssueChartValueOperationType);
    this.chartSizeTypes = EnumUtil.toSelectOptions(ChartSizeType);
    this.legendDisplayTypes = EnumUtil.toSelectOptions(LegendDisplayType);
    this.chartTypes = EnumUtil.toSelectOptions(DashboardChartType);
    this.chartPeriodTypes = EnumUtil.toSelectOptions(ChartPeriodType);

    // @ts-ignore
    [this.languages, this.projects, this.providers] = await Promise.all([
      this.store.getState(languages.State).then(x => x.items),
      this.store.getState(projects.State).then(x => x.items),
      this.store.getState(translationProviders.State).then(x => x.items)
    ]);
  }

  init(chartId: number, chartType: DashboardChartType, parameters: IssueChartParameters, saveHandler: () => Promise<void>): void {
    this.chartId = chartId
    this.chartType = chartType;
    this.saveHandler = saveHandler;
    this.parameters = parameters;
  }

  async saveAndUpdate(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      await this.doUpdate();
      await this.saveHandler();
    });
  }

  async update(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      await this.doUpdate();
    });
  }

  getType(): DashboardChartType {
    return this.chartType;
  }

  createElementId(prefix: string): string {
    return prefix + '-' + this.chartId;
  }

  private async doUpdate(): Promise<void> {
    const chartData = await this.getChartData();

    await this.chartComponent.createChart(
      this.chartType,
      this.parameters.chartValueOperationType,
      this.parameters.legendDisplayType,
      chartData);
  }

  private async getChartData(): Promise<ChartData> {
    const input = new IssueChartInput({
      filter: this.parameters.filter,
      groupType1: this.parameters.groupByField1,
      groupType2: this.parameters.groupByField2,
      operationType: this.parameters.chartValueOperationType,
      chartType: this.chartType,
      periodType: this.parameters.periodType,
    });

    const chartData = await this.chartRepo.getIssueChartData(input);
    return chartData;
  }
}
