import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { NgSelectModule } from '@ng-select/ng-select';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { BsDatepickerModule, BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TimepickerModule, TimepickerConfig } from 'ngx-bootstrap/timepicker';
import { PopoverModule } from 'ngx-bootstrap/popover';

import { ReduceStoreModule } from 'reduce-store';

import { AppComponent } from '@app/layout/app.component';
import { routes } from '@app/routes';
import { QiqSystemHttpInterceptor } from '@app/app-global/http/interceptor';
import { HomeComponent } from '@app/home/home.component';
import { SignInComponent } from '@app/users/sign-in/sign-in.component';
import { UserListComponent } from '@app/users/user-list/user-list.component';
import { UserEditComponent } from '@app/users/user-edit/user-edit.component';
import { SanitizeHtmlPipe } from '@app/shared/pipes/sanitize-html.pipe';
import { DialogAlertComponent } from '@app/shared/dialogs/alert/dialog-alert.component';
import { DialogConfirmComponent } from '@app/shared/dialogs/confirm/dialog-confirm.component';
import { DialogPromptComponent } from '@app/shared/dialogs/prompt/dialog-prompt.component';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';
import { UserProfileComponent } from '@app/users/profile/user-profile.component';
import { I18nPlaceholderDirective } from '@app/shared/i18n/i18n-placeholder.directive';
import { I18nDirective } from '@app/shared/i18n/i18n.directive';
import { I18nComponent } from '@app/shared/i18n/i18n.component';
import { I18nTitleDirective } from '@app/shared/i18n/i18n-title.directive';

import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeDe from '@angular/common/locales/de';

import { ReportTesterHoursByLeadComponent } from '@app/reports/tester-hours-by-lead/tester-hours-by-lead.component';
import { ReportUpcomingJobDueDatesComponent } from '@app/reports/upcoming-job-due-dates/upcoming-job-due-dates.component';
import { ReportRequestedJobsNearExpiryComponent } from '@app/reports/requested-jobs-near-expiry/requested-jobs-near-expiry.component';
import { ReportVendorSearchComponent } from '@app/reports/vendor-search/vendor-search.component';
import { QaIssueEditComponent } from '@app/qa-issues/edit/qa-issue-edit.component';
import { QaIssueDetailComponent } from '@app/qa-issues/detail/qa-issue-detail.component';
import { UserDatePipe } from '@app/shared/pipes/user-date.pipe';
import { UserNumberPipe } from '@app/shared/pipes/user-number.pipe';
import { QaModelTooltipComponent } from '@app/qa-models/tooltip/qa-model-tooltip.component';
import { QaSummaryIssuesComponent } from '@app/qa-summary/issues/issues.component';
import { QaSummaryTranslationsComponent } from '@app/qa-summary/translations/translations.component';
import { QaSummaryDocumentsComponent } from '@app/qa-summary/documents/documents.component';
import { QaSummaryProjectsComponent } from '@app/qa-summary/projects/projects.component';
import { QaSummaryLanguagesComponent } from '@app/qa-summary/languages/languages.component';
import { QaSummaryBreadcrumbsComponent } from '@app/qa-summary/breadcrumbs/breadcrumbs.component';
import { QaSummaryProvidersComponent } from '@app/qa-summary/providers/providers.component';
import { ModalImageViewerComponent } from '@app/shared/components/modal-image-viewer/modal-image-viewer.component';
import { QaIssueCommentsComponent } from '@app/qa-issues/comments/qa-issue-comments.component';
import { IssueSelectorComponent } from '@app/integration/issue-selector/issue-selector.component';
import { QaIssueEditorComponent } from '@app/qa-issues/editor/editor.component';
import { WorkTaskListComponent } from '@app/work-tasks/list/work-task-list.component';
import { WorkTaskEditComponent } from '@app/work-tasks/edit/work-task-edit.component';
import { ImportSdlLegacyParametersComponent } from '@app/work-tasks/import/sdl/legacy/parameters.component';
import { WorkTaskRunListComponent } from '@app/work-taks-runs/list/work-task-run-list.component';
import { QaModelListComponent } from '@app/qa-models/list/qa-model-list.component';
import { QaModelEditComponent } from '@app/qa-models/edit/qa-model-edit.component';
import { TopHeaderComponent } from '@app/layout/top-header/top-header.component';
import { ChartIssueComponent } from '@app/charts/issue-chart/issue-chart.component';
import { ChartIssueFilteredComponent } from '@app/charts/issue-filtered-chart/issue-filtered-chart.component';
import { DashboardTabsComponent } from '@app/dashboards/tabs/dashboard-tabs.component';
import { DashboardComponent } from '@app/dashboards/dashboard/dashboard.component';
import { AutofocuDirective } from '@app/shared/directives/autofocus.directive';
import { DebounceDirective } from '@app/shared/directives/debounce.directive';
import { BaseChartDirective } from '@app/shared/charts/base-chart.directive';
import { ChartContainerComponent } from '@app/dashboards/chart-container/chart-container.component';
import { QaCategoryListComponent } from '@app/qa-categories/list/qa-categories-list.component';
import { QaCategoryEditComponent } from '@app/qa-categories/edit/qa-categories-edit.component';
import { QaSeverityListComponent } from '@app/qa-severities/list/qa-severities-list.component';
import { QaSeverityEditComponent } from '@app/qa-severities/edit/qa-severities-edit.component';
import { ProjectListComponent } from '@app/projects/list/projects-list.component';
import { ProjectEditComponent } from '@app/projects/edit/projects-edit.component';
import { getDefaultTimepickerConfig, getDefaultDatepickerConfig } from '@app/shared/utils/datetimepicker.config';
import { TranslationProviderListComponent } from '@app/translation-providers/list/translation-providers-list.component';
import { TranslationProviderEditComponent } from '@app/translation-providers/edit/translation-providers-edit.component';
import { BatchTaskParametersComponent } from '@app/work-tasks/batch/parameters.component';
import { TranslationProviderUsersComponent } from '@app/translation-providers/users/translation-providers-users.component';
import { ProjectTranslationProviderComponent } from '@app/projects/translation-providers/translation-providers.component';
import { StatisticsComponent } from '@app/statistics/statistics.component';
import { AppHttpErrorComponent } from '@app/app-global/http/error.component';
import { AppInitializer } from '@app/app.initializer';
import { UserSubscriptionsComponent } from '@app/subscriptions/event-subscriptions/event-subscriptions.component';
import { UserSubscriptionEditComponent } from '@app/subscriptions/edit/event-subscription-edit.component';
import { UserSubscriptionIssueThresholdExceededParametersComponent } from '@app/subscriptions/issue-threshold-exceeded/parameters.component';
import { NotificationListComponent } from '@app/notifications/notification-list/notification-list.component';
import { BrandMenuComponent } from '@app/layout/brand-menu/brand-menu.component';
import { QaSummaryTranslationGenerateIssuesComponent } from '@app/qa-summary/translations/generate-issues/generate-issues.component';
import { PasswordResetComponent } from '@app/users/password-reset/password-reset.component';
import { DocumentEditComponent } from '@app/documents/edit/document-edit.component';
import { TranslationEditComponent } from '@app/translations/edit/translation-edit.component';
import { LanguageListComponent } from '@app/languages/list/language-list.component';
import { LanguageEditComponent } from '@app/languages/edit/language-edit.component';
import { ImportMemoQParametersComponent } from '@app/work-tasks/import/memoq/parameters.component';
import { ToastsComponent } from '@app/shared/components/toasts/toasts.component';
import { TranslationTranslatorsComponent } from '@app/translations/translation-translators/translation-translators.component';
import { UserSubscriptionNewSegmentAnswerParametersComponent } from '@app/subscriptions/new-segment-answer/parameters.component';
import { QiqPaginationComponent } from '@app/shared/components/pagination/pagination.component';
import { QuestionSummaryComponent } from '@app/questions/summary/question-summary.component';
import { DocumentQuestionListComponent } from '@app/questions/document-question-list/document-question-list.component';
import { UserSearchComponent } from '@app/users/user-search/user-search.component';
import { DocumentQuestionNotifierComponent } from '@app/questions/notifier/document-question-notifier.component';
import { UserSubscriptionNewSegmentQuestionParametersComponent } from '@app/subscriptions/new-segment-question/parameters.component';

registerLocaleData(localeEn, 'en-US');
registerLocaleData(localeDe, 'de-DE');

@NgModule({
  declarations: [
    SanitizeHtmlPipe,
    UserDatePipe,
    UserNumberPipe,

    AppComponent,
    AppHttpErrorComponent,
    TopHeaderComponent,
    SignInComponent,
    HomeComponent,
    UserSearchComponent,
    UserListComponent,
    UserEditComponent,
    PasswordResetComponent,

    DialogAlertComponent,
    DialogConfirmComponent,
    DialogPromptComponent,
    ToastsComponent,
    QiqPaginationComponent,

    ReportTesterHoursByLeadComponent,
    ReportVendorSearchComponent,
    ReportUpcomingJobDueDatesComponent,
    ReportRequestedJobsNearExpiryComponent,
    UserProfileComponent,

    QaIssueEditComponent,
    QaIssueDetailComponent,
    QaIssueCommentsComponent,

    QaSummaryIssuesComponent,
    QaSummaryTranslationsComponent,
    QaSummaryDocumentsComponent,
    QaSummaryProjectsComponent,
    QaSummaryLanguagesComponent,
    QaSummaryProvidersComponent,

    QaModelTooltipComponent,

    SpinnerComponent,
    I18nPlaceholderDirective,
    I18nDirective,
    I18nComponent,
    I18nTitleDirective,
    AutofocuDirective,
    DebounceDirective,
    BaseChartDirective,

    QaSummaryBreadcrumbsComponent,
    ModalImageViewerComponent,
    IssueSelectorComponent,
    QaIssueEditorComponent,
    WorkTaskListComponent,
    WorkTaskEditComponent,
    ImportSdlLegacyParametersComponent,
    ImportMemoQParametersComponent,
    WorkTaskRunListComponent,
    QaModelListComponent,
    QaModelEditComponent,
    ChartIssueComponent,
    ChartIssueFilteredComponent,
    DashboardComponent,
    DashboardTabsComponent,
    ChartContainerComponent,
    QaCategoryListComponent,
    QaCategoryEditComponent,
    QaSeverityListComponent,
    QaSeverityEditComponent,
    ProjectListComponent,
    ProjectEditComponent,
    ProjectTranslationProviderComponent,

    DocumentEditComponent,
    TranslationEditComponent,
    TranslationTranslatorsComponent,

    TranslationProviderListComponent,
    TranslationProviderEditComponent,
    TranslationProviderUsersComponent,

    BatchTaskParametersComponent,

    UserSubscriptionsComponent,
    UserSubscriptionEditComponent,

    StatisticsComponent,
    UserSubscriptionIssueThresholdExceededParametersComponent,
    UserSubscriptionNewSegmentAnswerParametersComponent,
    UserSubscriptionNewSegmentQuestionParametersComponent,
    NotificationListComponent,
    BrandMenuComponent,
    QaSummaryTranslationGenerateIssuesComponent,

    LanguageListComponent,
    LanguageEditComponent,

    DocumentQuestionListComponent,
    DocumentQuestionNotifierComponent,
    QuestionSummaryComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,

    NgSelectModule,
    ReduceStoreModule.forRoot(),

    TabsModule.forRoot(),
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    PaginationModule.forRoot(),
    TooltipModule.forRoot(),
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    TimepickerModule.forRoot(),
    PopoverModule.forRoot(),

    RouterModule.forRoot(routes),
  ],
  providers: [
    AppInitializer,
    { provide: HTTP_INTERCEPTORS, useClass: QiqSystemHttpInterceptor, multi: true },
    { provide: TimepickerConfig, useFactory: getDefaultTimepickerConfig },
    { provide: BsDatepickerConfig, useFactory: getDefaultDatepickerConfig },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
