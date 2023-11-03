import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { QaSummaryRepository } from '@app/shared/repositories/qa-summary.repository';
import { QaSummaryFilterExt } from '@app/qa-summary/QaSummaryFilterExt';
import { ProviderSummaryItem } from '@app/shared/models/ProviderSummaryItem';
import { Subscription } from 'rxjs';
import { doWithIndicatorAsync } from '@app/shared/utils/common.util';
import { RoutingService } from '@app/shared/services/routing.service';
import { QaSummaryExportRepository } from '@app/shared/repositories/qa-summary-export.repository';

@Component({
  selector: 'qa-summary-providers',
  templateUrl: './providers.component.html',
})
export class QaSummaryProvidersComponent implements OnInit {
  private queryParamsSubscription: Subscription;

  isBusy: boolean = false;

  providers: ProviderSummaryItem[];
  filter: QaSummaryFilterExt;
  totalRows: number;

  constructor(
    private summaryRepo: QaSummaryRepository,
    private router: Router,
    private route: ActivatedRoute,
    private routingService: RoutingService,
    private exportRepo: QaSummaryExportRepository,
) { }

  async ngOnInit(): Promise<void> {
    this.filter = new QaSummaryFilterExt(this.route.snapshot.queryParams);
    this.queryParamsSubscription = this.route.queryParams.subscribe(this.onParamsChanged.bind(this));
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription.unsubscribe();
  }

  loadRows(): void {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.providers = await this.summaryRepo.getProviderSummary(this.filter.toQueryParams());
    });
  }

  gotoPage(pageIndex: number): void {
    this.filter.pageIndex = pageIndex;
    this.routingService.replaceActivatedRouteQueryParams(this.filter.toQueryParams());
  }

  navigateToSourceLanguages(translationProviderId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId });
    this.router.navigate([`/qa-summary/source-languages`], { queryParams: filter });
  }

  navigateToTargetLanguages(translationProviderId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId });
    this.router.navigate([`/qa-summary/target-languages`], { queryParams: filter });
  }

  navigateToProjects(translationProviderId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId });
    this.router.navigate([`/qa-summary/projects/`], { queryParams: filter });
  }

  navigateToFailedProjects(provider: ProviderSummaryItem): void {
    if (!provider.failedProjects) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId: provider.providerId, failedProjectsOnly: true });
    this.router.navigate([`/qa-summary/projects/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedProjects(provider: ProviderSummaryItem): void {
    if (!provider.benchmarkFailedProjects) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId: provider.providerId, benchmarkFailedProjectsOnly: true });
    this.router.navigate([`/qa-summary/projects/`], { queryParams: filter });
  }

  navigateToDocuments(translationProviderId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId });
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToFailedDocuments(provider: ProviderSummaryItem): void {
    if (!provider.failedDocuments) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId: provider.providerId, failedDocumentsOnly: true });
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedDocuments(provider: ProviderSummaryItem): void {
    if (!provider.benchmarkFailedDocuments) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId: provider.providerId, benchmarkFailedDocumentsOnly: true });
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToTranslations(translationProviderId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToFailedTranslations(provider: ProviderSummaryItem): void {
    if (!provider.failedTranslations) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId: provider.providerId, failedTranslationsOnly: true });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedTranslations(provider: ProviderSummaryItem): void {
    if (!provider.benchmarkFailedTranslations) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId: provider.providerId, benchmarkFailedTranslationsOnly: true });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToIssues(translationProviderId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ translationProviderId });
    this.router.navigate([`/qa-summary/issues/`], { queryParams: filter });
  }

  async export(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const filter = this.filter.clone();
      filter.pageIndex = 0;
      await this.exportRepo.getProviderSummaryExportData(filter);
    });
  }

  private async onParamsChanged(queryParams: Params): Promise<void> {
    this.filter = new QaSummaryFilterExt(queryParams);
    this.loadRows();
    this.totalRows = await this.summaryRepo.getProviderSummaryTotalRows(this.filter);
  }

}
