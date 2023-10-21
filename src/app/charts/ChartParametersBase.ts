export class ChartParametersBase {
  chartSizeType: ChartSizeType;
  legendDisplayType: LegendDisplayType;
  isParametersSectionVisible: boolean;

  constructor(init: Partial<ChartParametersBase>) {
    Object.assign(this, init);
  }

  get isLarge(): boolean {
    return this.chartSizeType == ChartSizeType.Large;
  }
}

export enum ChartSizeType {
  Normal = 1,
  Large,
}

export enum LegendDisplayType {
  Hidden = 0,
  Top,
  Bottom,
  Left,
  Right
}
