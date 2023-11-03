import { Params } from "@angular/router";
import { QaSummaryFilter } from "@app/shared/models/QaSummaryFilter";
import { defaultPageSize } from "@app/constants";
import { convertToBool } from "@app/shared/utils/common.util";

export class QaSummaryFilterExt extends QaSummaryFilter {
  constructor(params: Params, private isSourceLanguage: boolean = false) {
    super(params);

    this.qaModelId = +this.qaModelId || undefined;
    this.categoryId = +this.categoryId || undefined;
    this.severityId = +this.severityId || undefined;
    this.translationId = +this.translationId || undefined;
    this.targetLanguageId = +this.targetLanguageId || undefined;
    this.sourceLanguageId = +this.sourceLanguageId || undefined;
    this.documentId = +this.documentId || undefined;
    this.projectId = +this.projectId || undefined;

    this.translationProviderId = !this.translationProviderId && this.translationProviderId !== 0
      ? undefined
      : +this.translationProviderId;

    this.issueOrderByField = +this.issueOrderByField || undefined;
    this.translationOrderByField = +this.translationOrderByField || undefined;
    this.documentOrderByField = +this.documentOrderByField || undefined;
    this.isOrderByDescending = convertToBool(this.isOrderByDescending);

    this.failedTranslationsOnly = convertToBool(this.failedTranslationsOnly);
    this.benchmarkFailedTranslationsOnly = convertToBool(this.benchmarkFailedTranslationsOnly);
    this.failedDocumentsOnly = convertToBool(this.failedDocumentsOnly);
    this.benchmarkFailedDocumentsOnly = convertToBool(this.benchmarkFailedDocumentsOnly);
    this.failedProjectsOnly = convertToBool(this.failedProjectsOnly);
    this.benchmarkFailedProjectsOnly = convertToBool(this.benchmarkFailedProjectsOnly);

    this.id = +this.id || undefined;
    this.pageSize = +this.pageSize || defaultPageSize;
    this.pageIndex = +this.pageIndex || 1;
  }

  getProviderParams(): { [k: string]: any } {
    const result = this.toQueryParams();
    delete result.sourceLanguageId;
    delete result.targetLanguageId;
    delete result.projectId;
    delete result.documentId;
    delete result.translationId;
    delete result.failedProjectsOnly;
    delete result.benchmarkFailedProjectsOnly;
    delete result.failedTranslationsOnly;
    delete result.benchmarkFailedTranslationsOnly;
    delete result.failedDocumentsOnly;
    delete result.benchmarkFailedDocumentsOnly;

    return result;
  }

  getLanguageParams(): { [k: string]: any } {
    const result = this.toQueryParams();
    delete result.projectId;
    delete result.documentId;
    delete result.translationId;
    delete result.failedProjectsOnly;
    delete result.benchmarkFailedProjectsOnly;
    delete result.failedTranslationsOnly;
    delete result.benchmarkFailedTranslationsOnly;
    delete result.failedDocumentsOnly;
    delete result.benchmarkFailedDocumentsOnly;

    return result;
  }

  getProjectParams(): { [k: string]: any } {
    const result = this.toQueryParams();
    delete result.documentId;
    delete result.translationId;
    delete result.failedProjectsOnly;
    delete result.benchmarkFailedProjectsOnly;
    delete result.failedTranslationsOnly;
    delete result.benchmarkFailedTranslationsOnly;
    delete result.failedDocumentsOnly;
    delete result.benchmarkFailedDocumentsOnly;

    return result;
  }

  getDocumentParams(): { [k: string]: any } {
    const result = this.toQueryParams();
    delete result.translationId;
    delete result.failedProjectsOnly;
    delete result.benchmarkFailedProjectsOnly;
    delete result.failedTranslationsOnly;
    delete result.benchmarkFailedTranslationsOnly;
    delete result.failedDocumentsOnly;
    delete result.benchmarkFailedDocumentsOnly;

    return result;
  }

  toLanguageQueryParams(languagetId: number, init: Partial<QaSummaryFilterExt> = {}): QaSummaryFilter {
    let filter = this.toQueryParams(init);
    if (this.isSourceLanguage) {
      filter.sourceLanguageId = languagetId;
      filter.targetLanguageId = undefined;
    } else {
      filter.targetLanguageId = languagetId;
      filter.sourceLanguageId = undefined;
    }
    return filter;
  }

  toQueryParams(init: Partial<QaSummaryFilterExt> = {}): QaSummaryFilter {
    const filter = new QaSummaryFilterExt(Object.assign({}, this, init));
    delete filter.isSourceLanguage;
    return filter;
  }

  toQueryParamsWithoutPagingAndSort(init?: Partial<QaSummaryFilterExt>): QaSummaryFilter {
    const filter = new QaSummaryFilterExt(Object.assign({}, this, init || {}));
    delete filter.isSourceLanguage;
    delete filter.isOrderByDescending;
    delete filter.translationOrderByField;
    delete filter.documentOrderByField;
    delete filter.issueOrderByField;
    delete filter.pageIndex;
    delete filter.pageSize;
    return filter;
  }

}
