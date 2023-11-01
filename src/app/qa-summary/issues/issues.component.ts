import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { QaSummaryRepository } from '@app/shared/repositories/qa-summary.repository';
import { QaIssueSummaryItem } from '@app/shared/models/QaIssueSummaryItem';
import { QaSummaryFilterExt } from '@app/qa-summary/QaSummaryFilterExt';
import { timeoutPromise, doWithIndicatorAsync } from '@app/shared/utils/common.util';
import { ReduceStore } from 'reduce-store';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { TranslationProviderVm } from '@app/shared/models/TranslationProviderVm';
import * as qaModels from '@app/qa-models/state';
import * as categories from '@app/qa-categories/state';
import * as severities from '@app/qa-severities/state';
import * as languages from '@app/languages/state';
import * as translationProviders from '@app/translation-providers/state';
import * as currentUser from '@app/shared/states/current-user.state';
import { SelectOption } from '@app/shared/models/select-option';
import { QaSummaryIssueOrderByField } from '@app/shared/models/QaSummaryIssueOrderByField';
import { EnumUtil } from '@app/shared/utils/enum.util';
import { RoutingService } from '@app/shared/services/routing.service';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { Subject, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { DocumentRepository } from '@app/shared/repositories/document.repository';
import { QaSummaryExportRepository } from '@app/shared/repositories/qa-summary-export.repository';
import { QaCategoryVm } from '@app/shared/models/QaCategoryVm';
import { QaSeverityVm } from '@app/shared/models/QaSeverityVm';
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { UserVmExt } from '@app/users/user-vm-ext';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { QaIssueRepository } from '@app/shared/repositories/qa-issue.repository';

@Component({
  selector: 'qa-summary-issues',
  templateUrl: './issues.component.html',
})
export class QaSummaryIssuesComponent implements OnInit {
  private queryParamsSubscription: Subscription;
  private allCategories: QaCategoryVm[];
  private allSeverities: QaSeverityVm[];

  isBusy: boolean = false;
  currentUser: UserVmExt;
  rows: QaIssueSummaryItem[];
  totalRows: number;
  filter: QaSummaryFilterExt;
  languages: LanguageVm[];
  qaModels: QaModelVm[];
  categories: QaCategoryVm[];
  severities: QaSeverityVm[];
  providers: TranslationProviderVm[];
  orderByFields: SelectOption<QaSummaryIssueOrderByField>[];

  isProjectsLoaging: boolean;
  projectTerms = new Subject<string>();
  projects$: Observable<ProjectVm[]>;

  isDocumentsLoaging: boolean;
  documentTerms = new Subject<string>();
  documents$: Observable<DocumentVm[]>;

  constructor(
    private store: ReduceStore,
    private summaryRepo: QaSummaryRepository,
    private qaIssueRepo: QaIssueRepository,
    private projectRepo: ProjectRepository,
    private documentRepo: DocumentRepository,
    private router: Router,
    private route: ActivatedRoute,
    private routingService: RoutingService,
    private exportRepo: QaSummaryExportRepository,
    private dialogService: DialogService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.orderByFields = EnumUtil.toSelectOptions(QaSummaryIssueOrderByField);

    this.filter = new QaSummaryFilterExt(this.route.snapshot.queryParams);

    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      // @ts-ignore
      [this.qaModels, this.languages, this.providers, this.allCategories, this.allSeverities, this.currentUser]
        = await Promise.all([
          this.store.getState(qaModels.State).then(x => x.items),
          this.store.getState(languages.State).then(x => x.items),
          this.store.getState(translationProviders.State).then(x => x.items),
          this.store.getState(categories.State).then(x => x.items),
          this.store.getState(severities.State).then(x => x.items),
          this.store.getState(currentUser.CurrentUserState).then(x => x.value),
        ]);

      this.setCategoriesAndSeverities();
    });

    this.setProjectSearch();
    this.setDocumentSearch();
    this.queryParamsSubscription = this.route.queryParams.subscribe(this.onParamsChanged.bind(this));
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription.unsubscribe();
  }

  onFilterQaModelChange(): void {
    this.filter.categoryId = undefined;
    this.filter.severityId = undefined;
    this.setCategoriesAndSeverities();
  }

  loadRows(): void {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.rows = await this.summaryRepo.getIssueSummary(this.filter);
    });
  }

  gotoPage(pageIndex: number): void {
    this.filter.pageIndex = pageIndex;
    this.routingService.replaceActivatedRouteQueryParams(this.filter.toQueryParams());
  }

  navigateToAdd(): void {
    this.router.navigate(['/qa-issues/add'], { relativeTo: this.route });
  }

  async confirmDeleteIssues(): Promise<void> {
    const dialogResult = await this.dialogService.confirm({ messageKey: 'Confirm.Delete' });
    if (!dialogResult.isConfirmed) return;

    this.isBusy = true;
    await this.qaIssueRepo.deleteByFilter(this.filter);
    this.isBusy = false;

    if (this.filter.pageIndex > 1) {
      this.gotoPage(1);
    } else {
      this.loadRows();
      this.totalRows = await this.summaryRepo.getIssueSummaryTotalRows(this.filter);
    }
  }

  async export(): Promise<void> {
    doWithIndicatorAsync(x => this.isBusy = x, async () => {
      const filter = this.filter.clone();
      filter.pageIndex = 0;
      await this.exportRepo.getIssueSummaryExportData(filter);
    });
  }

  private setCategoriesAndSeverities(): void {
    if (this.filter.qaModelId) {
      this.categories = this.allCategories.filter(x => x.qaModelId == this.filter.qaModelId);
      this.severities = this.allSeverities.filter(x => x.qaModelId == this.filter.qaModelId);
    } else {
      this.categories = [];
      this.severities = [];
    }
  }

  private async onParamsChanged(queryParams: Params): Promise<void> {
    this.filter = new QaSummaryFilterExt(queryParams);
    this.loadRows();
    this.totalRows = await this.summaryRepo.getIssueSummaryTotalRows(this.filter);
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
