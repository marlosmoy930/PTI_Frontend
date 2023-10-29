import { QaModelVm } from "@app/shared/models/QaModelVm";

export class TooltipData {

  constructor(
    public readonly qaModel: QaModelVm,
    public readonly points: number,
    public readonly words: number) {
  }

}
