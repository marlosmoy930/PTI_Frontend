import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ReduceStore } from 'reduce-store';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { AppInfoState } from '@app/shared/states/app-info.state';
import { QaSummaryRepository } from '@app/shared/repositories/qa-summary.repository';
import { TranslationSummaryItem } from '@app/shared/models/TranslationSummaryItem';
import { QaSummaryFilterExt } from '@app/qa-summary/QaSummaryFilterExt';
import { doWithIndicatorAsync } from '@app/shared/utils/common.util';
import * as translationProviders from '@app/translation-providers/state';
import * as qaModels from '@app/qa-models/state';
import * as languages from '@app/languages/state';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { TranslationProviderVm } from '@app/shared/models/TranslationProviderVm';
import { SelectOption } from '@app/shared/models/select-option';
import { QaSummaryTranslationOrderByField } from '@app/shared/models/QaSummaryTranslationOrderByField';
import { EnumUtil } from '@app/shared/utils/enum.util';
import { RoutingService } from '@app/shared/services/routing.service';
import { TooltipData } from '@app/qa-models/tooltip/tooltip-data';
import { TranslationSummaryItemExt } from './TranslationSummaryItemExt';
import { Subject, Observable, Subscription } from 'rxjs';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { DocumentRepository } from '@app/shared/repositories/document.repository';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { QaSummaryExportRepository } from '@app/shared/repositories/qa-summary-export.repository';
import { QaCategoryVm } from '@app/shared/models/QaCategoryVm';
import { QaSeverityVm } from '@app/shared/models/QaSeverityVm';
import * as currentUser from '@app/shared/states/current-user.state';
import { UserVmExt } from '@app/users/user-vm-ext';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { QaSummaryTranslationGenerateIssuesComponent } from '@app/qa-summary/translations/generate-issues/generate-issues.component';

@Component({
  selector: 'qa-summary-translations',
  templateUrl: './translations.component.html',
})
export class QaSummaryTranslationsComponent implements OnInit, OnDestroy {
  private queryParamsSubscription: Subscription;

  isBusy: boolean = false;

  currentUser: UserVmExt;
  translations: TranslationSummaryItemExt[];
  benchmarkQaModel: QaModelVm;
  filter: QaSummaryFilterExt;
  totalRows: number;
  languages: LanguageVm[];
  qaModels: QaModelVm[];
  categories: QaCategoryVm[];
  severities: QaSeverityVm[];
  providers: TranslationProviderVm[];
  orderByFields: SelectOption<QaSummaryTranslationOrderByField>[];

  isProjectsLoaging: boolean;
  projectTerms = new Subject<string>();
  projects$: Observable<ProjectVm[]>;

  isDocumentsLoaging: boolean;
  documentTerms = new Subject<string>();
  documents$: Observable<DocumentVm[]>;

  constructor(
    private store: ReduceStore,
    private summaryRepo: QaSummaryRepository,
    private projectRepo: ProjectRepository,
    private documentRepo: DocumentRepository,
    private router: Router,
    private route: ActivatedRoute,
    private routingService: RoutingService,
    private exportRepo: QaSummaryExportRepository,
    private modalService: BsModalService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.orderByFields = EnumUtil.toSelectOptions(QaSummaryTranslationOrderByField);

    this.filter = new QaSummaryFilterExt(this.route.snapshot.queryParams);

    await doWithIndicatorAsync(x => this.isBusy = x, async () => {
      let appInfo: AppInfoState;

      // @ts-ignore
      [this.qaModels, appInfo, this.languages, this.providers, this.currentUser]
        = await Promise.all([
          this.store.getState(qaModels.State).then(x => x.items),
          this.store.getState(AppInfoState),
          this.store.getState(languages.State).then(x => x.items),
          this.store.getState(translationProviders.State).then(x => x.items),
          this.store.getState(currentUser.CurrentUserState).then(x => x.value),
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

  gotoPage(pageIndex: number): void {
    this.filter.pageIndex = pageIndex;
    this.routingService.replaceActivatedRouteQueryParams(this.filter.toQueryParams());
  }

  navigateToIssues(translationId: number): void {
    const translation = this.translations.find(x => x.translationId == translationId);
    const filter = this.filter.toQueryParamsWithoutPagingAndSort({
      projectId: translation.projectId,
      documentId: translation.documentId,
      sourceLanguageId: translation.sourceLanguageId,
      targetLanguageId: translation.targetLanguageId,
    });
    this.router.navigate([`/qa-summary/issues/`], { queryParams: filter });
  }

  showGenerateIssuesModal(): void {
    const options = this.getModalOptions();
    const modalRef = this.modalService.show(QaSummaryTranslationGenerateIssuesComponent, options);
    modalRef.setClass('modal-lg');
    const component = modalRef.content as QaSummaryTranslationGenerateIssuesComponent;
    component.filter = this.filter.clone();
    component.modalRef = modalRef;
  }

  async export(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const filter = this.filter.clone();
      filter.pageIndex = 0;
      await this.exportRepo.getTranslationSummaryExportData(filter);
    });
  }

  private loadRows(): void {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.translations = await this.summaryRepo.getTranslationSummary(this.filter)
        .then(x => x.map(i => new TranslationSummaryItemExt(i)));

      this.translations.forEach(t => {
        t.tooltipData = this.getTooltipData(t);
        t.benchmarkTooltipData = this.getBenchmarkTooltipData(t);
      });
    });
  }

  private getTooltipData(item: TranslationSummaryItem): TooltipData {
    const qaModel = this.qaModels.find(x => x.id == item.qaModelId);
    return new TooltipData(qaModel, item.pointSum, item.wordsCount);
  }

  private getBenchmarkTooltipData(item: TranslationSummaryItem): TooltipData {
    return new TooltipData(this.benchmarkQaModel, item.benchmarkPointSum, item.wordsCount);
  }

  private async onParamsChanged(queryParams: Params): Promise<void> {
    this.filter = new QaSummaryFilterExt(queryParams);
    this.loadRows();
    this.totalRows = await this.summaryRepo.getTranslationSummaryTotalRows(this.filter);
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

  private getModalOptions(): ModalOptions {
    return { backdrop: 'static', }
  }
}

