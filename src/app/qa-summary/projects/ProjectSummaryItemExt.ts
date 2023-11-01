import { TooltipData } from "@app/qa-models/tooltip/tooltip-data";
import { ProjectSummaryItem } from "@app/shared/models/ProjectSummaryItem";

export class ProjectSummaryItemExt extends ProjectSummaryItem {
  tooltipData: TooltipData;
  benchmarkTooltipData: TooltipData;
}
