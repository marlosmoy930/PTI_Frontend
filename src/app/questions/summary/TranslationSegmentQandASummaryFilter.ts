import { TranslationSegmentQandASummaryFilter } from '@app/shared/models/TranslationSegmentQandASummaryFilter';
import { Params } from '@angular/router';
import { defaultPageSize } from '@app/constants';

export class TranslationSegmentQandASummaryFilterExt extends TranslationSegmentQandASummaryFilter {
  static fromQueryParams(params: Params): TranslationSegmentQandASummaryFilterExt {
    var filter = new TranslationSegmentQandASummaryFilterExt(params);

    if (Array.isArray(filter.projectIds))
      filter.projectIds = filter.projectIds.map(x => +x);
    else {
      filter.projectIds = +filter.projectIds ? [+filter.projectIds] : [];
    }

    if (Array.isArray(filter.documentIds))
      filter.documentIds = filter.documentIds.map(x => +x);
    else {
      filter.documentIds = +filter.documentIds ? [+filter.documentIds] : [];
    }

    if (Array.isArray(filter.targetLanguageIds))
      filter.targetLanguageIds = filter.targetLanguageIds.map(x => +x);
    else {
      filter.targetLanguageIds = +filter.targetLanguageIds ? [+filter.targetLanguageIds] : [];
    }

    if (Array.isArray(filter.sourceLanguageIds))
      filter.sourceLanguageIds = filter.sourceLanguageIds.map(x => +x);
    else {
      filter.sourceLanguageIds = +filter.sourceLanguageIds ? [+filter.sourceLanguageIds] : [];
    }

    filter.pageSize = +filter.pageSize || defaultPageSize;
    filter.pageIndex = +filter.pageIndex || 1;

    return filter;
  }

  toQueryParams(): { [key: string]: any; } {
    const params = this.clone();

    delete params.clone;

    if (!this.projectIds.length)
      delete params.projectIds;

    if (!this.documentIds.length)
      delete params.documentIds;

    if (!this.targetLanguageIds.length)
      delete params.targetLanguageIds;

    if (!this.sourceLanguageIds.length)
      delete params.sourceLanguageIds;

    return params;
  }

}
