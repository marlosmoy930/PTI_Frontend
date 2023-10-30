import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { AppInfoState } from '@app/shared/states/app-info.state';
import { ReduceStore } from 'reduce-store';
import { QaSummaryRepository } from '@app/shared/repositories/qa-summary.repository';
import { DocumentSummaryItem } from '@app/shared/models/DocumentSummaryItem';
import { QaSummaryFilterExt } from '@app/qa-summary/QaSummaryFilterExt';
import { Observable, Subject, Subscription } from 'rxjs';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { TranslationProviderVm } from '@app/shared/models/TranslationProviderVm';
import { SelectOption } from '@app/shared/models/select-option';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { DocumentRepository } from '@app/shared/repositories/document.repository';
import { RoutingService } from '@app/shared/services/routing.service';
import { EnumUtil } from '@app/shared/utils/enum.util';
import { QaSummaryDocumentOrderByField } from '@app/shared/models/QaSummaryDocumentOrderByField';
import { doWithIndicatorAsync } from '@app/shared/utils/common.util';
import * as languages from '@app/languages/state';
import * as translationProviders from '@app/translation-providers/state';
import { DocumentSummaryItemExt } from './DocumentSummaryItemExt';
import { TooltipData } from '@app/qa-models/tooltip/tooltip-data';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { QaSummaryExportRepository } from '@app/shared/repositories/qa-summary-export.repository';

@Component({
  selector: 'qa-summary-documents',
  templateUrl: './documents.component.html',
})
export class QaSummaryDocumentsComponent implements OnInit, OnDestroy {
  private queryParamsSubscription: Subscription;

  isBusy: boolean = false;

  documents: DocumentSummaryItemExt[];
  benchmarkQaModel: QaModelVm;
  filter: QaSummaryFilterExt;
  totalRows: number;
  languages: LanguageVm[];
  providers: TranslationProviderVm[];
  qaModels: QaModelVm[];
  orderByFields: SelectOption<QaSummaryDocumentOrderByField>[];

  isProjectsLoaging: boolean;
  projectTerms = new Subject<string>();
  projects$: Observable<ProjectVm[]>;

  isDocumentsLoaging: boolean;
  documentTerms = new Subject<string>();
  documents$: Observable<DocumentVm[]>;

  constructor(
    private store: ReduceStore,
    private summaryRepo: QaSummaryRepository,
    private qaModelsRepo: QaModelRepository,
    private projectRepo: ProjectRepository,
    private documentRepo: DocumentRepository,
    private router: Router,
    private route: ActivatedRoute,
    private routingService: RoutingService,
    private exportRepo: QaSummaryExportRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    this.orderByFields = EnumUtil.toSelectOptions(QaSummaryDocumentOrderByField);

    this.filter = new QaSummaryFilterExt(this.route.snapshot.queryParams);

    await doWithIndicatorAsync(x => this.isBusy = x, async () => {
      let appInfo: AppInfoState;

      // @ts-ignore
      [appInfo, this.qaModels, this.languages, this.providers] = await Promise.all([
        this.store.getState(AppInfoState),
        this.qaModelsRepo.getList(),
        this.store.getState(languages.State).then(x => x.items),
        this.store.getState(translationProviders.State).then(x => x.items),
      ]);

      this.benchmarkQaModel = appInfo.data.ptiSystemSetting.benchmarkQaModel;
    });

    this.setProjectSearch();
    this.setDocumentSearch();
    this.queryParamsSubscription = this.route.queryParams.subscribe(this.onParamsChanged.bind(this));
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription.unsubscribe();
  }

  loadRows(): void {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.documents = await this.summaryRepo.getDocumentSummary(this.filter)
        .then(x => x.map(i => new DocumentSummaryItemExt(i)));

      this.documents.forEach(t => {
        t.tooltipData = this.getTooltipData(t);
        t.benchmarkTooltipData = this.getBenchmarkTooltipData(t);
      });
    });
  }

  gotoPage(pageIndex: number): void {
    this.filter.pageIndex = pageIndex;
    this.routingService.replaceActivatedRouteQueryParams(this.filter.toQueryParams());
  }

  navigateToFailedTranslations(document: DocumentSummaryItem): void {
    if (!document.invalidTranslationsCount) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ documentId: document.documentId, failedTranslationsOnly: true });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToBenchmarkFailedTranslations(document: DocumentSummaryItem): void {
    if (!document.benchmarkInvalidTranslationsCount) return;

    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ documentId: document.documentId, benchmarkFailedTranslationsOnly: true });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToTranslations(documentId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ documentId });
    this.router.navigate([`/qa-summary/translations/`], { queryParams: filter });
  }

  navigateToIssues(documentId: number): void {
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({ documentId });
    this.router.navigate([`/qa-summary/issues/`], { queryParams: filter });
  }

  async export(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const filter = this.filter.clone();
      filter.pageIndex = 0;
      await this.exportRepo.getDocumentSummaryExportData(filter);
    });
  }

  private getTooltipData(item: DocumentSummaryItem): TooltipData {
    const qaModel = this.qaModels.find(x => x.id == item.qaModelId);
    return new TooltipData(qaModel, item.pointSum, item.wordsCount);
  }

  private getBenchmarkTooltipData(item: DocumentSummaryItem): TooltipData {
    return new TooltipData(this.benchmarkQaModel, item.benchmarkPointSum, item.wordsCount);
  }

  private async onParamsChanged(queryParams: Params): Promise<void> {
    this.filter = new QaSummaryFilterExt(queryParams);
    this.loadRows();
    this.totalRows = await this.summaryRepo.getDocumentSummaryTotalRows(this.filter);
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

  private async setDocumentSearch(): Promise<void> {
    let items = new Array<DocumentVm>();
    if (this.filter.documentId) {
      const item = await this.documentRepo.getById(this.filter.documentId);
      items = [item];
    } else {
      items = await this.documentRepo.searchByName('');
    }

    this.documents$ = this.documentTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(name => {
        return doWithIndicatorAsync(x => this.isDocumentsLoaging = x, async () => {
          return await this.documentRepo.searchByName(name || '');
        });
      }),
      startWith(items)
    );
  }

}
