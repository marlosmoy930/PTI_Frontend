import { DocumentQuestionVm } from '@app/shared/models/DocumentQuestionVm';

export class DocumentQuestionVmExt extends DocumentQuestionVm {
    externalUserTitle: string;
    userName: string;
    isNameAndDateVisible: boolean;
    constructor(init: DocumentQuestionVm) {
        super(init);
        this.setUserName();
    }
    private setUserName(): void {
        if (this.translationCommentSdlLegacyUserName) {
            this.userName = this.translationCommentSdlLegacyUserName;
            this.externalUserTitle = 'SDL TMS';
            return;
        }
        if (this.translationCommentMemoQUserName) {
            this.userName = this.translationCommentMemoQUserName;
            ;
            this.externalUserTitle = 'memoQ';
            return;
        }
        this.userName = this.translationCommentUserDisplayName;
    }
}
