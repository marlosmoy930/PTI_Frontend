import { QaIssueIntegrationInput } from "@app/shared/models/QaIssueIntegrationInput";
import { IntegrationMessageState } from "@app/shared/states/integration-message.state";

export class QaIssueIntegrationInputExt extends QaIssueIntegrationInput {
  sourceString: string;
  revisedTarget: string;
  screenshotUri: string;
  url: string;
  translatorName: string;

  constructor(state: IntegrationMessageState) {
    super(state as any);
    this.sourceString = state.sourceString;
    this.revisedTarget = state.revisedTarget;
    this.screenshotUri = state.screenshotUri;
    this.url = state.url;
    this.translatorName = state.translatorName;
  }
}
