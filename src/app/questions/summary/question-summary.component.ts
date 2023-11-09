import { Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute, Params } from '@angular/router';
import { TranslationRepository } from '@app/shared/repositories/translation.repository';
import * as commonUtil from '@app/shared/utils/common.util';
import { Store } from 'reduce-store';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';
import { TranslationSegmentQandASummaryItem } from '@app/shared/models/TranslationSegmentQandASummaryItem';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { debounceTime } from 'rxjs/internal/operators/debounceTime';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { startWith } from 'rxjs/internal/operators/startWith';
import { RoutingService } from '@app/shared/services/routing.service';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { DocumentRepository } from '@app/shared/repositories/document.repository';
import * as languages from '@app/languages/state';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { TranslationSegmentQandASummaryFilterExt } from '@app/questions/summary/TranslationSegmentQandASummaryFilter';

@Component({
  selector: 'question-summary',
  templateUrl: './question-summary.component.html',
})
export class QuestionSummaryComponent implements OnInit, OnDestroy {
  private queryParamsSubscription: Subscription;

  isBusy: boolean;
  languages: LanguageVm[];

  filter: TranslationSegmentQandASummaryFilterExt;
  summaryItems: TranslationSegmentQandASummaryItem[];
  totalRows: number;

  areProjectsLoading: boolean;
  projectTerms = new Subject<string>();
  projects$: Observable<ProjectVm[]>;

  areDocumentsLoading: boolean;
  documentTerms = new Subject<string>();
  documents$: Observable<DocumentVm[]>;

  constructor(
    private route: ActivatedRoute,
    private projectRepo: ProjectRepository,
    private documentRepo: DocumentRepository,
    private translationRepo: TranslationRepository,
    private routingService: RoutingService,
  ) {
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription.unsubscribe();
  }

  async ngOnInit(): Promise<void> {
    this.filter = TranslationSegmentQandASummaryFilterExt.fromQueryParams(this.route.snapshot.queryParams);

    await commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.languages = await Store.state.get(languages.State).then(x => x.items);
    });

    this.setProjectSearch();
    this.setDocumentSearch();
    this.queryParamsSubscription = this.route.queryParams.subscribe(this.onParamsChanged.bind(this));
  }

  gotoPage(pageIndex: number): void {
    this.filter.pageIndex = pageIndex;
    this.routingService.replaceActivatedRouteQueryParams(this.filter.toQueryParams());
  }

  private async onParamsChanged(queryParams: Params): Promise<void> {
    this.filter = TranslationSegmentQandASummaryFilterExt.fromQueryParams(queryParams);
    this.loadRows();
    this.totalRows = await this.translationRepo.getQuestionSummaryItemsTotalRows(this.filter);
  }

  private loadRows(): void {
    commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.summaryItems = await this.translationRepo.getQuestionSummaryItems(this.filter);
    });
  }

  private async setProjectSearch(): Promise<void> {
    let projects = new Array<ProjectVm>();
    if (this.filter.projectIds.length) {
      projects = await this.projectRepo.searchByIds(this.filter.projectIds);
    } else {
      projects = await this.projectRepo.searchByName('');
    }

    this.projects$ = this.projectTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(name => {
        return commonUtil.doWithIndicatorAsync(x => this.areProjectsLoading = x, async () => {
          return await this.projectRepo.searchByName(name || '');
        });
      }),
      startWith(projects)
    );
  }

  private async setDocumentSearch(): Promise<void> {
    let documents = new Array<DocumentVm>();
    if (this.filter.documentIds.length) {
      documents = await this.documentRepo.searchByIds(this.filter.documentIds);
    } else {
      documents = await this.documentRepo.searchByName('');
    }

    this.documents$ = this.documentTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(name => {
        return commonUtil.doWithIndicatorAsync(x => this.areDocumentsLoading = x, async () => {
          return await this.documentRepo.searchByName(name || '');
        });
      }),
      startWith(documents)
    );
  }

}

