import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { ReduceStore } from 'reduce-store';

import { MainContentVisibilityReducer } from '@app/layout/layout-state';
import { QaIssueIntegrationRepository } from '@app/shared/repositories/qa-issue-integration.repository';
import { IntegrationData } from '@app/shared/models/IntegrationData';
import { EditQaIssueVm } from '@app/shared/models/EditQaIssueVm';
import { OutputExtensionMessage } from '@app/integration/issue-selector/OutputExtensionMessage';
import { IntegrationMessageState } from '@app/shared/states/integration-message.state';
import { NewIntegrationIssue } from '@app/shared/models/NewIntegrationIssue';
import { QaIssueStatus } from '@app/shared/models/QaIssueStatus';
import { QaIssueIntegrationInputExt } from '@app/integration/issue-selector/QaIssueIntegrationInputExt';
import { QaIssueRepository } from '@app/shared/repositories/qa-issue.repository';
import { SaveScreenshotVm } from '@app/shared/models/SaveScreenshotVm';
import { IntegrationConfig } from '@app/qa-issues/edit/IntegrationConfig';
import { AddTranslatorVm } from '@app/shared/models/AddTranslatorVm';
import { QaIssueEditorComponent } from '../../qa-issues/editor/editor.component';

@Component({
  selector: 'issue-selector',
  templateUrl: './issue-selector.component.html',
})
export class IssueSelectorComponent implements OnInit, OnDestroy {
  private integrationTabId: number;
  private integrationInput: QaIssueIntegrationInputExt;

  @ViewChild('issueEditor') issueEditor: QaIssueEditorComponent;

  integrationData: IntegrationData;
  issue: EditQaIssueVm;
  integrationConfig: IntegrationConfig;

  constructor(
    private store: ReduceStore,
    private qaIssueIntegrationRepo: QaIssueIntegrationRepository,
    private qaIssueRepo: QaIssueRepository,
  ) {
    this.store.subscribeToState(IntegrationMessageState, this, this.onIntegrationMessage);
  }

  ngOnInit(): void {
    this.store.reduce(MainContentVisibilityReducer, true);
    //this.fakeIntegration();
  }

  fakeIntegration() {
    const state = new IntegrationMessageState({
      type: 'init',
      tabId: 1,

      integrationId: 2582295,
      integrationType: 1,

      segmentNumber: 1,

      sourceString: 'sourceString',
      translatorName: 'Andreas Machoy',
      revisedTarget: 'revisedTarget',
      url: 'url',
      enableSdlUpdateRevisedTarget: true,
    });

    this.onIntegrationMessage(state as any);
  }

  ngOnDestroy(): void {
    this.store.reduce(MainContentVisibilityReducer, false);
  }

  async saveAdditionalDataAndCloseDialog(): Promise<void> {
    if (this.integrationInput.translatorName) {
      const addModel = new AddTranslatorVm({
        issueId: this.issue.id,
        translatorName: this.integrationInput.translatorName
      });
      await this.qaIssueRepo.addTranslator(addModel);
    }

    if (this.integrationInput.screenshotUri) {
      const screenshot = new SaveScreenshotVm({
        issueId: this.issue.id,
        screenshotUri: this.integrationInput.screenshotUri
      });
      await this.qaIssueRepo.saveScreenshot(screenshot);
    }

    if (this.integrationConfig.enableSdlUpdateRevisedTarget)
      this.safeSendIntegrationMessage({ type: 'updateRevisedTarget', revisedTarget: this.issue.revisedTarget });
    else
      this.closeDialog();
  }

  backToIssueList(): void {
    if (!this.integrationData.existingIntegrationIssues.length) {
      this.closeDialog();
      return;
    }

    this.issue = null;
  }

  async selectIssue(issueId: number): Promise<void> {
    if (!issueId) {
      this.issue = this.createEditIssueVm(this.integrationData.newIntegrationIssue);
      this.integrationConfig.shouldScrollToComments = false;
    } else {
      this.issue = await this.qaIssueRepo.getById(issueId);
      this.integrationConfig.shouldScrollToComments = true;
    }
  }

  closeDialog(): void {
    this.safeSendIntegrationMessage({ type: 'close' });
  }

  private createEditIssueVm(issue: NewIntegrationIssue): EditQaIssueVm {
    return new EditQaIssueVm({
      projectId: issue.projectId,
      documentId: issue.documentId,
      translationId: issue.translationId,

      segmentNumber: this.integrationInput.segmentNumber,
      sourceString: this.integrationInput.sourceString,
      originalString: this.integrationInput.revisedTarget,
      revisedTarget: this.integrationInput.revisedTarget,
      url: this.integrationInput.url,
      screenshotUri: this.integrationInput.screenshotUri,

      status: QaIssueStatus.Valid,
    });
  }

  private async loadIntegrationData(): Promise<void> {
    this.integrationData = await this.qaIssueIntegrationRepo.getIntegrationData(this.integrationInput);

    if (this.integrationData.existingIntegrationIssues
      && this.integrationData.existingIntegrationIssues.length) return;

    this.issue = this.createEditIssueVm(this.integrationData.newIntegrationIssue);
  }

  private onIntegrationMessage(state: IntegrationMessageState) {
    if (!state) return;

    switch (state.type) {
      case 'init':
        this.integrationTabId = state.tabId;
        this.integrationInput = new QaIssueIntegrationInputExt(state);
        this.integrationConfig = new IntegrationConfig({
          translatorName: state.translatorName,
          canEnableSdlUpdateRevisedTarget: state.canEnableSdlUpdateRevisedTarget,
          enableSdlUpdateRevisedTarget: state.enableSdlUpdateRevisedTarget,
          shouldScrollToComments: false,
        });
        this.loadIntegrationData();
        break;
      //default: throw Error('state type is not implemented' + JSON.stringify(state));
    }
  }

  private safeSendIntegrationMessage(message: OutputExtensionMessage) {
    const request = Object.assign({}, message, { tabId: this.integrationTabId });
    window.parent.parent.parent.parent.parent.postMessage(request, '*');
  }

}
