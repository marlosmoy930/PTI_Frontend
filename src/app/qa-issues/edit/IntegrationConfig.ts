export class IntegrationConfig {
  enableSdlUpdateRevisedTarget: boolean;
  canEnableSdlUpdateRevisedTarget: boolean;
  translatorName: string;
  shouldScrollToComments: boolean;

  constructor(init?: Partial<IntegrationConfig>) {
    Object.assign(this, init);
  }

}
