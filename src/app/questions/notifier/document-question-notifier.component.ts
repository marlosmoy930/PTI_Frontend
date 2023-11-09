import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';

import * as toasts from '@app/shared/components/toasts/toasts-state';
import * as commonUtil from '@app/shared/utils/common.util';
import { TranslationUserRepository } from '@app/shared/repositories/translation-user.repository';
import { UserVmExt } from '@app/users/user-vm-ext';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { I18nService } from '@app/shared/i18n/i18n.service';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { DocumentVm } from '@app/shared/models/DocumentVm';
import { Observable } from 'rxjs';
import { TranslationUserGroup } from './TranslationUserGroup';
import { Store } from 'reduce-store';
import { QuestionRepository } from '@app/shared/repositories/question.repository';

@Component({
  selector: '[document-questions-notifier]',
  templateUrl: './document-question-notifier.component.html',
  styleUrls: ['./document-question-notifier.component.scss'],
})
export class DocumentQuestionNotifierComponent implements OnInit {
  @ViewChild('addUserToNotifyModal') addUserToNotifyModal: ModalDirective;
  @Input('document') document$: Observable<DocumentVm>;

  isInitialized: boolean = false;
  isBusy: boolean;
  isAllSelected: boolean;
  document: DocumentVm
  documentUserGroups: TranslationUserGroup[];
  additionalUsers: UserVmExt[] = [];

  constructor(
    private readonly translationUserRepo: TranslationUserRepository,
    private readonly i18n: I18nService,
    private readonly questionRepo: QuestionRepository,
    private readonly dialog: DialogService,
  ) { }

  ngOnInit(): void {
    this.document$.subscribe(this.onDocumentChanged.bind(this));
  }

  private async onDocumentChanged(document: DocumentVm): Promise<void> {
    this.document = document;
    commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      this.documentUserGroups = await this.translationUserRepo
        .getByDocument(this.document.id)
        .then(x => x.groupBy(i => i.userId))
        .then(x => x.mapCtor(TranslationUserGroup));

      this.updateSelection();
      this.isInitialized = true;
    });
  }

  onUserClick(user: UserVmExt): void {
    user.isSelected = !user.isSelected;
    this.updateSelection();
    return;
  }

  selectAll(): void {
    const hasSelectedUsers = this.documentUserGroups.any(x => x.userExt.isSelected);
    const isSelected = !hasSelectedUsers;

    this.documentUserGroups.forEach(x => x.userExt.isSelected = isSelected);
    this.updateSelection();
  }

  removeAdditionalUser(userId: number): void {
    this.additionalUsers = this.additionalUsers.filter(x => x.id != userId);
  }

  async addUsersToNotify(selectedUsers: UserVmExt[]): Promise<void> {
    this.addUserToNotifyModal.hide();

    const currentUserIds = this.documentUserGroups
      .map(x => x.userExt.id)
      .concat(this.additionalUsers.map(x => x.id));

    const alreadyExistingUsers = selectedUsers
      .filter(x => currentUserIds.contains(x.id))
      .map(x => x.displayName);

    if (alreadyExistingUsers.length) {
      const displayNames = alreadyExistingUsers.join(', ');
      const key = 'Questions.Answers.DocumentQuestionsNotifier.TheFollowingUsersAreInTheListAlready';
      let message = await this.i18n.getValue(key);
      message += `:\n ${displayNames}`;
      await this.dialog.alert({ message });
    }

    this.additionalUsers = this.additionalUsers
      .concat(selectedUsers)
      .distinctBy(x => x.id)
      .filter(x => !this.documentUserGroups.any(g => g.userExt.id == x.id));

  }

  async notifyUsers(): Promise<void> {
    const defaultSubject = `New answers for ${this.document.name} of ${this.document.projectName}`;

    const dialogResult = await this.dialog.prompt({
      messageKey: 'Questions.Answers.DocumentQuestionsNotifier.EnterSubject',
      userInput: defaultSubject,
    });
    if (dialogResult.isCanceled) return;

    var userIds = this.documentUserGroups
      .filter(x => x.userExt.isSelected)
      .map(x => x.userExt.id)
      .concat(this.additionalUsers.map(x => x.id));

    var subject = dialogResult.userInput;

    await commonUtil.doWithIndicatorAsync(x => this.isBusy = x, async () => {
      await this.questionRepo.addQuestionNotifications(this.document.id, userIds, subject);
    });

    Store.reduce.byConstructor(toasts.AddSuccessfullyToastReducer);
  }

  private updateSelection(): void {
    this.isAllSelected = this.documentUserGroups.every(x => x.userExt.isSelected);
  }
}

