import { QaSummaryFilter } from "@app/shared/models/QaSummaryFilter";
import { jsonSafeParse } from "@app/shared/utils/common.util";
import { IssueChartGroupType } from "@app/shared/models/IssueChartGroupType";
import { IssueChartValueOperationType } from "@app/shared/models/IssueChartValueOperationType";
import { ChartPeriodType } from '@app/shared/models/ChartPeriodType';
import { ChartParametersBase } from '@app/charts/ChartParametersBase';

export class IssueChartParameters extends ChartParametersBase {
  filter: QaSummaryFilter;
  isParametersSectionVisible: boolean;
  groupByField1: IssueChartGroupType;
  groupByField2: IssueChartGroupType;
  chartValueOperationType: IssueChartValueOperationType;
  periodType: ChartPeriodType;

  constructor(init: Partial<IssueChartParameters>) {
    super(init);
    this.filter.fromDate = this.filter.fromDate ? new Date(this.filter.fromDate) : undefined;
    this.filter.toDate = this.filter.toDate ? new Date(this.filter.toDate) : undefined;
  }

  static create(json: string): IssueChartParameters {
    return new IssueChartParameters(jsonSafeParse<IssueChartParameters>(json));
  }
}
