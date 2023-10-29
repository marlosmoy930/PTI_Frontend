import { QaModelVm } from '@app/shared/models/QaModelVm';
import { QaModelFailedType } from '@app/shared/models/QaModelFailedType';

const defaultNormilizedPerWordsCount = 1000;

export class QaModelVmExt extends QaModelVm {
  previousFailedType: QaModelFailedType;
  testPointsSum: number = 10;
  testWordsCount: number = 1000;

  constructor(init: Partial<QaModelVmExt>) {
    super(init);
    this.failedType = this.failedType || QaModelFailedType.ByPenaltyPointsLimit;
    this.previousFailedType = this.failedType;
  }

  get isByNormalizedScore(): boolean {
    return this.failedType == QaModelFailedType.ByNormalizedScoreLimit;
  }

  get isByPoints(): boolean {
    return this.failedType == QaModelFailedType.ByPenaltyPointsLimit;
  }

  get pointsThreshold(): number {
    return ((1 - this.threshold) * this.perWordsCount).round(0);
  }

  get normolizedThreshold(): number {
    return 1 - this.threshold / this.perWordsCount;
  }

  get quality(): string {
    return (100 - this.testPointsSum.percent(this.testWordsCount) * 100).round(2) + '%';
  }

  get isPassed(): boolean {
    if (this.failedType == QaModelFailedType.ByNormalizedScoreLimit) {
      return this.testPointsSum / this.testWordsCount < 1 - this.threshold;
    } else if (this.failedType == QaModelFailedType.ByPenaltyPointsLimit) {
      return this.testPointsSum / this.testWordsCount < this.threshold / this.perWordsCount;
    }
    throw 'Not implemented';
  }

  updateThreshold(e): void {
    if (this.previousFailedType == QaModelFailedType.ByNormalizedScoreLimit) {
      this.threshold = this.pointsThreshold;
    } else if (this.previousFailedType == QaModelFailedType.ByPenaltyPointsLimit) {
      this.threshold = this.normolizedThreshold;
      this.perWordsCount = defaultNormilizedPerWordsCount;
    } else {
      throw 'Not implemented';
    }

    this.previousFailedType = this.failedType;
  }



}

