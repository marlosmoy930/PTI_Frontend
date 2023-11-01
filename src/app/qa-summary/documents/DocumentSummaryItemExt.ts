import { TooltipData } from "@app/qa-models/tooltip/tooltip-data";
import { DocumentSummaryItem } from "@app/shared/models/DocumentSummaryItem";

export class DocumentSummaryItemExt extends DocumentSummaryItem {
  tooltipData: TooltipData;
  benchmarkTooltipData: TooltipData;
}
