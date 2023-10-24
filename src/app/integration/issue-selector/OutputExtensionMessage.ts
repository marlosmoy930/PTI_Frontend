export type OutputExtensionMessage = {
  tabId?: number;
  type: 'close' | 'updateRevisedTarget';
  revisedTarget?: string;
  commentToAdd?: string;
}
