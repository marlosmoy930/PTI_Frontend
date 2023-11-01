import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { LanguageSummaryItem } from '@app/shared/models/LanguageSummaryItem';
import { QaSummaryRepository } from '@app/shared/repositories/qa-summary.repository';
import { QaSummaryFilterExt } from '@app/qa-summary/QaSummaryFilterExt';
import { doWithIndicatorAsync } from '@app/shared/utils/common.util';
import { RoutingService } from '@app/shared/services/routing.service';
import { Subscription } from 'rxjs';
import { TranslationProviderVm } from '@app/shared/models/TranslationProviderVm';
import { ReduceStore } from 'reduce-store';
import * as translationProviders from '@app/translation-providers/state';
import { QaSummaryExportRepository } from '@app/shared/repositories/qa-summary-export.repository';

@Component({
  selector: 'qa-summary-languages',
  templateUrl: './languages.component.html',
})
export class QaSummaryLanguagesComponent implements OnInit, OnDestroy {
  private queryParamsSubscription: Subscription;

  isBusy: boolean = false;

  isSourceLanguage: boolean;
  languages: LanguageSummaryItem[];
  providers: TranslationProviderVm[];
  filter: QaSummaryFilterExt;
  totalRows: number;

  constructor(
    private store: ReduceStore,
    private summaryRepo: QaSummaryRepository,
    private router: Router,
    private route: ActivatedRoute,
    private routingService: RoutingService,
    private exportRepo: QaSummaryExportRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    this.isSourceLanguage = this.route.snapshot.data.isSourceLanguage;
    this.filter = new QaSummaryFilterExt(this.route.snapshot.queryParams, this.isSourceLanguage);

    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.providers = await this.store.getState(translationProviders.State).then(x => x.items);
    });

    this.queryParamsSubscription = this.route.queryParams.subscribe(this.onParamsChanged.bind(this));
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription.unsubscribe();
  }

  loadRows(): void {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      if (this.isSourceLanguage)
        this.languages = await this.summaryRepo.getSourceLanguageSummary(this.filter);
      else
        this.languages = await this.summaryRepo.getTargetLanguageSummary(this.filter);
    });
  }

  gotoPage(pageIndex: number): void {
    this.filter.pageIndex = pageIndex;
    this.routingService.replaceActivatedRouteQueryParams(this.filter.toQueryParams());
  }

  navigateToProjects(languageId: number): void {
    const filter = this.filter.toLanguageQueryParams(languageId);
    this.router.navigate([`/qa-summary/projects/`], { queryParams: filter });
  }

  navigateToFailedProjects(language: LanguageSummaryItem): void {
    if (!language.failedProjects) return;

    const filter = this.filter.toLanguageQueryParams(language.languageId, { failedProjectsOnly: true });
    this.router.navigate([`/qa-summary/projects/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedProjects(language: LanguageSummaryItem): void {
    if (!language.benchmarkFailedProjects) return;

    const filter = this.filter.toLanguageQueryParams(language.languageId, { benchmarkFailedProjectsOnly: true });
    this.router.navigate([`/qa-summary/projects/`], { queryParams: filter });
  }

  navigateToDocuments(languageId: number): void {
    const filter = this.filter.toLanguageQueryParams(languageId);
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToFailedDocuments(language: LanguageSummaryItem): void {
    if (!language.failedDocuments) return;

    const filter = this.filter.toLanguageQueryParams(language.languageId, { failedDocumentsOnly: true });
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedDocuments(language: LanguageSummaryItem): void {
    if (!language.benchmarkFailedDocuments) return;

    const filter = this.filter.toLanguageQueryParams(language.languageId, { benchmarkFailedDocumentsOnly: true });
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToTranslations(languageId: number): void {
    const filter = this.filter.toLanguageQueryParams(languageId);
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToFailedTranslations(language: LanguageSummaryItem): void {
    if (!language.failedTranslations) return;

    const filter = this.filter.toLanguageQueryParams(language.languageId, { failedTranslationsOnly: true });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedTranslations(language: LanguageSummaryItem): void {
    if (!language.benchmarkFailedTranslations) return;

    const filter = this.filter.toLanguageQueryParams(language.languageId, { benchmarkFailedTranslationsOnly: true });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToIssues(languageId: number): void {
    const filter = this.filter.toLanguageQueryParams(languageId);
    this.router.navigate([`/qa-summary/issues/`], { queryParams: filter });
  }

  async export(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const filter = this.filter.clone();
      filter.pageIndex = 0;
      if (this.isSourceLanguage) {
        await this.exportRepo.getSourceLanguageSummaryExportData(filter);
      } else {
        await this.exportRepo.getTargetLanguageSummaryExportData(filter);
      }
    });
  }

  private async onParamsChanged(queryParams: Params): Promise<void> {
    this.filter = new QaSummaryFilterExt(queryParams, this.isSourceLanguage);
    this.loadRows();
    if (this.isSourceLanguage)
      this.totalRows = await this.summaryRepo.getSourceLanguageSummaryTotalRows(this.filter);
    else
      this.totalRows = await this.summaryRepo.getTargetLanguageSummaryTotalRows(this.filter);
  }
}
