import { TranslationSummaryItem } from "@app/shared/models/TranslationSummaryItem";
import { TooltipData } from "@app/qa-models/tooltip/tooltip-data";

export class TranslationSummaryItemExt extends TranslationSummaryItem {
  tooltipData: TooltipData;
  benchmarkTooltipData: TooltipData;
}
