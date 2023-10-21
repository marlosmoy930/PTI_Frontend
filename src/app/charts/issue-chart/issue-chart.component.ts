import { Component, ViewChild, ElementRef } from '@angular/core';
import { timeoutPromise } from '@app/shared/utils/common.util';
import { ChartData } from '@app/shared/models/ChartData';
import { LegendDisplayType } from '@app/charts/ChartParametersBase';
import { IssueChartValueOperationType } from '@app/shared/models/IssueChartValueOperationType';
import { DashboardChartType } from '@app/shared/models/DashboardChartType';

@Component({
  selector: 'chart-issue',
  templateUrl: './issue-chart.component.html',
  styleUrls: ['./issue-chart.component.scss'],
})
export class ChartIssueComponent {
  @ViewChild('chartCanvas') chartCanvas: ElementRef<HTMLCanvasElement>;

  isReady: boolean;
  hasSingleQaModel: boolean;
  chartDataSets: Chart.ChartDataSets[];
  chartLabels: Array<string>;
  chartType: Chart.ChartType;
  legend: Chart.ChartLegendOptions;
  options: Chart.ChartOptions;

  get isChartVisible(): boolean {
    return this.chartDataSets
      && this.chartDataSets.length > 0
      && this.chartDataSets[0].data
      && this.chartDataSets[0].data.length > 0;
  }

  async createChart(
    chartType: DashboardChartType,
    operationType: IssueChartValueOperationType,
    legendDisplayType: LegendDisplayType,
    chartData: ChartData): Promise<void> {

    await this.configureChart(chartType, chartData, operationType, legendDisplayType);

    if (!chartData.dataSets || !chartData.dataSets.length) {
      this.isReady = true;
      return;
    }

    this.chartDataSets = chartData.dataSets;
    this.chartLabels = chartData.chartLabels;

    this.isReady = true;
  }

  private configureChart(
    chartType: DashboardChartType,
    chartData: ChartData,
    operationType: IssueChartValueOperationType,
    legendDisplayType: LegendDisplayType): Promise<void> {

    this.isReady = false;
    this.chartType = 'bar';

    var dataSets = chartData.dataSets;

    this.options = this.getOptions(chartType, operationType, chartData.threshold);

    if (chartType == DashboardChartType.Time) {
      this.chartType = 'line';
    } else if (dataSets && dataSets.length == 1 && operationType != IssueChartValueOperationType.Quality) {
      this.chartType = 'pie';
    }

    if (this.chartType == 'bar') {
      this.options.scales = this.options.scales || {};
      this.options.scales.xAxes = this.options.scales.xAxes || [];
      this.options.scales.xAxes[0] = this.options.scales.xAxes[0] || {};
      this.options.scales.xAxes[0].ticks = this.options.scales.xAxes[0].ticks || {};
      this.options.scales.xAxes[0].ticks.autoSkip = false;

      this.options.scales.yAxes = this.options.scales.yAxes || [];
      this.options.scales.yAxes[0] = this.options.scales.yAxes[0] || {};
      this.options.scales.yAxes[0].ticks = this.options.scales.yAxes[0].ticks || {};
      this.options.scales.yAxes[0].ticks.beginAtZero = true;
    }

    this.chartDataSets = undefined;

    if (!legendDisplayType) {
      this.legend = undefined;
    } else {
      const position = (LegendDisplayType[legendDisplayType]).toLowerCase() as Chart.PositionType;
      this.legend = { display: true, position };
    }

    return timeoutPromise();
  }

  private getOptions(dashboardChartType: DashboardChartType, operationType: IssueChartValueOperationType, threshold: number): Chart.ChartOptions {
    let options = <Chart.ChartOptions>{
      maintainAspectRatio: true,
    };

    if (dashboardChartType == DashboardChartType.Time) {
      Object.assign(options, <Chart.ChartOptions>{
        animation: {
          duration: 0
        },
        hover: {
          animationDuration: 0
        },
        responsiveAnimationDuration: 0,
        elements: {
          line: {
            fill: false,
            tension: 0
          }
        }
      });
    }

    if (operationType == IssueChartValueOperationType.Quality) {
      const thresholdPercentage = (threshold * 100).round(0);

      Object.assign(options, <Chart.ChartOptions>{
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              suggestedMax: 101,
              callback: value => value + '%'
            },
          }],
        },
        annotation: {
          annotations: [{
            type: 'line',
            drawTime: 'beforeDatasetsDraw',
            mode: 'horizontal',
            scaleID: 'y-axis-0',
            value: thresholdPercentage,
            borderColor: 'black',
            borderWidth: 1,
            label: {
              enabled: true,
              content: `Threshold ${thresholdPercentage}%`,
              fontSize: 11,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }
          }]
        }
      });
    }

    return options
  }

}
