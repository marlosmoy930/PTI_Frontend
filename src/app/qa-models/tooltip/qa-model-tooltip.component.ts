import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { QaModelFailedType } from '@app/shared/models/QaModelFailedType';
import { TooltipData } from './tooltip-data';

@Component({
  selector: 'qa-model-tooltip',
  templateUrl: './qa-model-tooltip.component.html',
  styleUrls: ['./qa-model-tooltip.component.scss']
})
export class QaModelTooltipComponent implements OnInit {
  @Input() data: TooltipData;

  qaModel: QaModelVm;
  points: number;
  words: number;

  isByNormalizedLimit: boolean;
  isByPenalty: boolean;
  isByNormalizedPassed: boolean;
  isByPenaltyPassed: boolean;

  ngOnInit(): void {
    this.points = this.data.points;
    this.words = this.data.words;
    this.qaModel = this.data.qaModel;
    this.isByNormalizedLimit = this.getIsByNormalizedLimit();
    this.isByPenalty = this.getIsByPenalty();
    this.isByNormalizedPassed = this.getIsByNormalizedPassed();
    this.isByPenaltyPassed = this.getIsByPenaltyPassed();
  }

  private getIsByNormalizedLimit(): boolean {
    return this.qaModel.failedType == QaModelFailedType.ByNormalizedScoreLimit;
  }

  private getIsByPenalty(): boolean {
    return this.qaModel.failedType == QaModelFailedType.ByPenaltyPointsLimit;
  }

  private getIsByNormalizedPassed(): boolean {
    if (this.data.words == 0) return this.data.points == 0;
    return (1 - this.data.points / this.data.words) > this.qaModel.threshold;
  }

  private getIsByPenaltyPassed(): boolean {
    if (this.data.words == 0) return this.data.points == 0;
    return (this.data.points / this.data.words) < this.qaModel.threshold / this.qaModel.perWordsCount;
  }

}
