import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QaSummaryFilterExt } from '@app/qa-summary/QaSummaryFilterExt';
import { TranslationRepository } from '@app/shared/repositories/translation.repository';
import { LanguageRepository } from '@app/shared/repositories/language.repository';
import { DocumentRepository } from '@app/shared/repositories/document.repository';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { TranslationVm } from '@app/shared/models/TranslationVm';
import { TranslationProviderVm } from '@app/shared/models/TranslationProviderVm';
import { TranslationProviderRepository } from '@app/shared/repositories/translation-provider.repository';
import { Breadcrumb } from '@app/qa-summary/breadcrumbs/Breadcrumb';

@Component({
  selector: 'qa-summary-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
})
export class QaSummaryBreadcrumbsComponent implements OnInit {
  filter: QaSummaryFilterExt;
  provider: TranslationProviderVm;
  sourceLanguage: LanguageVm;
  targetLanguage: LanguageVm;
  project: ProjectVm;
  document: DocumentVm;
  translation: TranslationVm;
  breadcrumbs: Breadcrumb[];

  constructor(
    private route: ActivatedRoute,
    private translationRepo: TranslationRepository,
    private languageRepo: LanguageRepository,
    private documentRepo: DocumentRepository,
    private projectRepo: ProjectRepository,
    private providerRepo: TranslationProviderRepository,
  ) { }

  async ngOnInit(): Promise<void> {
    this.filter = new QaSummaryFilterExt(this.route.snapshot.queryParams);

    [
      this.provider,
      this.sourceLanguage,
      this.targetLanguage,
      this.project,
      this.document,
      this.translation,
    ] = await Promise.all([
      this.filter.translationProviderId ? this.providerRepo.getById(this.filter.translationProviderId) : Promise.resolve(null),
      this.filter.sourceLanguageId ? this.languageRepo.getById(this.filter.sourceLanguageId) : Promise.resolve(null),
      this.filter.targetLanguageId ? this.languageRepo.getById(this.filter.targetLanguageId) : Promise.resolve(null),
      this.filter.projectId ? this.projectRepo.getById(this.filter.projectId) : Promise.resolve(null),
      this.filter.documentId ? this.documentRepo.getById(this.filter.documentId) : Promise.resolve(null),
      this.filter.translationId ? this.translationRepo.getById(this.filter.translationId) : Promise.resolve(null),
    ]);

    this.breadcrumbs = this.getBreadcrumbs();
  }

  private getBreadcrumbs(): Breadcrumb[] {
    const list = new Array<Breadcrumb>();
    if (this.provider) {
      list.push(new Breadcrumb({
        link: this.sourceLanguage ? 'source-languages' :
          this.targetLanguage ? 'target-languages' :
            this.project ? 'projects' :
              this.document ? 'documents' :
                this.translation ? 'translations' : null,
        title: 'Translation Provider',
        params: this.filter.getProviderParams(),
        name: this.provider.name,
      }));
    }


    if (this.sourceLanguage) {
      list.push(new Breadcrumb({
        link: this.project ? 'projects' :
          this.document ? 'documents' :
            this.translation ? 'translations' : null,
        title: 'Source Language',
        params: this.filter.getLanguageParams(),
        name: this.sourceLanguage.acronym
      }));
    }

    if (this.targetLanguage) {
      list.push(new Breadcrumb({
        link: this.project ? 'projects' :
          this.document ? 'documents' :
            this.translation ? 'translations' : null,
        title: 'Target Language',
        params: this.filter.getLanguageParams(),
        name: this.targetLanguage.acronym
      }));
    }

    if (this.project) {
      list.push(new Breadcrumb({
        link: this.document ? 'documents' : this.translation ? 'translations' : null,
        title: 'Project',
        params: this.filter.getProjectParams(),
        name: this.project.name,
        isFailed: this.filter.failedProjectsOnly,
        isBenchmarkFailed: this.filter.benchmarkFailedProjectsOnly
      }));
    }

    if (this.document) {
      list.push(new Breadcrumb({
        link: this.translation ? 'translations' : null,
        title: 'Document',
        params: this.filter.getDocumentParams(),
        name: this.document.name,
        isFailed: this.filter.failedDocumentsOnly,
        isBenchmarkFailed: this.filter.benchmarkFailedDocumentsOnly
      }));
    }

    if (this.translation) {
      list.push(new Breadcrumb({
        title: 'Translation Target Language',
        name: this.translation.targetLanguageAcronym,
        isLink: false,
        isFailed: this.filter.failedTranslationsOnly,
        isBenchmarkFailed: this.filter.benchmarkFailedTranslationsOnly
      }));
    }

    const lastBreadcrumb = list.last();
    if (lastBreadcrumb) {
      lastBreadcrumb.isLink = false;
    }

    return list;
  }
}
