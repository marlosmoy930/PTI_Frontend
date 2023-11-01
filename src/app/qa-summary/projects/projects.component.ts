import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { AppInfoState } from '@app/shared/states/app-info.state';
import { ReduceStore } from 'reduce-store';
import { ProjectSummaryItem } from '@app/shared/models/ProjectSummaryItem';
import { QaSummaryRepository } from '@app/shared/repositories/qa-summary.repository';
import { QaSummaryFilterExt } from '@app/qa-summary/QaSummaryFilterExt';
import { ProjectSummaryItemExt } from './ProjectSummaryItemExt';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { RoutingService } from '@app/shared/services/routing.service';
import { doWithIndicatorAsync } from '@app/shared/utils/common.util';
import { TooltipData } from '@app/qa-models/tooltip/tooltip-data';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { Observable, Subject, Subscription } from 'rxjs';
import * as translationProviders from '@app/translation-providers/state';
import { TranslationProviderVm } from '@app/shared/models/TranslationProviderVm';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import * as languages from '@app/languages/state';
import { QaSummaryExportRepository } from '@app/shared/repositories/qa-summary-export.repository';

@Component({
  selector: 'qa-summary-projects',
  templateUrl: './projects.component.html',
})
export class QaSummaryProjectsComponent implements OnInit, OnDestroy {
  private queryParamsSubscription: Subscription;
  isBusy: boolean = false;

  projects: ProjectSummaryItemExt[];
  languages: LanguageVm[];
  providers: TranslationProviderVm[];
  benchmarkQaModel: QaModelVm;
  filter: QaSummaryFilterExt;
  totalRows: number;
  qaModels: QaModelVm[];

  isProjectsLoaging: boolean;
  projectTerms = new Subject<string>();
  projects$: Observable<ProjectVm[]>;

  constructor(
    private store: ReduceStore,
    private summaryRepo: QaSummaryRepository,
    private qaModelsRepo: QaModelRepository,
    private projectRepo: ProjectRepository,
    private router: Router,
    private route: ActivatedRoute,
    private routingService: RoutingService,
    private exportRepo: QaSummaryExportRepository,
) { }

  async ngOnInit(): Promise<void> {
    this.filter = new QaSummaryFilterExt(this.route.snapshot.queryParams);

    await doWithIndicatorAsync(x => this.isBusy = x, async () => {
      let appInfo: AppInfoState;

      // @ts-ignore
      [appInfo, this.qaModels, this.providers, this.languages]
        = await Promise.all([
          this.store.getState(AppInfoState),
          this.qaModelsRepo.getList(),
          this.store.getState(translationProviders.State).then(x => x.items),
          this.store.getState(languages.State).then(x => x.items),
        ]);

      this.benchmarkQaModel = appInfo.data.ptiSystemSetting.benchmarkQaModel;
    });

    this.setProjectSearch();
    this.queryParamsSubscription = this.route.queryParams.subscribe(this.onParamsChanged.bind(this));
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription.unsubscribe();
  }

  loadRows(): void {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.projects = await this.summaryRepo.getProjectSummary(this.filter)
        .then(x => x.map(i => new ProjectSummaryItemExt(i)));

      this.projects.forEach(t => {
        t.tooltipData = this.getTooltipData(t);
        t.benchmarkTooltipData = this.getBenchmarkTooltipData(t);
      });
    });
  }

  gotoPage(pageIndex: number): void {
    this.filter.pageIndex = pageIndex;
    this.routingService.replaceActivatedRouteQueryParams(this.filter.toQueryParams());
  }

  navigateToDocuments(projectId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ projectId });
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToFailedDocuments(project: ProjectSummaryItem): void {
    if (!project.invalidDocumentsCount) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ projectId: project.projectId, failedDocumentsOnly: true });
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedDocuments(project: ProjectSummaryItem): void {
    if (!project.benchmarkInvalidDocumentsCount) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ projectId: project.projectId, benchmarkFailedDocumentsOnly: true });
    this.router.navigate([`/qa-summary/documents/`], { queryParams: filter });
  }

  navigateToFailedTranslations(project: ProjectSummaryItem): void {
    if (!project.invalidTranslationsCount) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ projectId: project.projectId, failedTranslationsOnly: true });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedTranslations(project: ProjectSummaryItem): void {
    if (!project.benchmarkInvalidTranslationsCount) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ projectId: project.projectId, benchmarkFailedTranslationsOnly: true });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToTranslations(projectId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ projectId });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToIssues(projectId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ projectId });
    this.router.navigate([`/qa-summary/issues/`], { queryParams: filter });
  }

  async export(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const filter = this.filter.clone();
      filter.pageIndex = 0;
      await this.exportRepo.getProjectSummaryExportData(filter);
    });
  }

  private getTooltipData(item: ProjectSummaryItem): TooltipData {
    const qaModel = this.qaModels.find(x => x.id == item.qaModelId);
    return new TooltipData(qaModel, item.pointSum, item.translationsWordsCount);
  }

  private getBenchmarkTooltipData(item: ProjectSummaryItem): TooltipData {
    return new TooltipData(this.benchmarkQaModel, item.benchmarkPointSum, item.translationsWordsCount);
  }

  private async onParamsChanged(queryParams: Params): Promise<void> {
    this.filter = new QaSummaryFilterExt(queryParams);
    this.loadRows();
    this.totalRows = await this.summaryRepo.getProjectSummaryTotalRows(this.filter);
  }

  private async setProjectSearch(): Promise<void> {
    let projects = new Array<ProjectVm>();
    if (this.filter.projectId) {
      const project = await this.projectRepo.getById(this.filter.projectId);
      projects = [project];
    } else {
      projects = await this.projectRepo.searchByName('');
    }

    this.projects$ = this.projectTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(name => {
        return doWithIndicatorAsync(x => this.isProjectsLoaging = x, async () => {
          return await this.projectRepo.searchByName(name || '');
        });
      }),
      startWith(projects)
    );
  }

}
