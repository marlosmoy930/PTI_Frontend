import { DashboardChartType } from "@app/shared/models/DashboardChartType";

export interface IDashboardChartComponent {
  init(chartId: number, chartType: DashboardChartType, parameters: any, saveHandler: () => Promise<void>): void;
  update(): Promise<void>;
  getType(): DashboardChartType;
}
