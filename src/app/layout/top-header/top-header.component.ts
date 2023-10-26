import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { UserVm } from '@app/shared/models/UserVm';
import * as layout from '@app/layout/layout-state';
import * as notificationList from '@app/notifications/notification-list/state';
import * as currentUser from '@app/shared/states/current-user.state';

import { Store } from 'reduce-store';
import { getOrDefault, timeoutPromise } from '@app/shared/utils/common.util';
import { environment } from '@environments/environment';
import { BrowserService } from '@app/shared/services/browser.service';

declare var chrome: any;

@Component({
  selector: '[top-header]',
  templateUrl: './top-header.component.html',
  styleUrls: ['./top-header.component.scss'],
})
export class TopHeaderComponent implements OnInit, OnDestroy {
  readonly isChrome: boolean;

  isMainContenOnly: boolean;
  currentUser: UserVm;
  isExtensionInstalled: boolean = false;
  notificationState: notificationList.State;

  constructor(
    private browserService: BrowserService,
  ) {
    this.isChrome = this.browserService.isChrome;

    Store.state.subscribe(
      layout.State,
      this,
      x => this.isMainContenOnly = getOrDefault(() => x.isMainContenOnly, false),
    );

    Store.state.subscribe(currentUser.CurrentUserState, this, this.onCurrentUserStateChanged);
    Store.state.subscribe(notificationList.State, this, s => this.notificationState = s);
  }

  get hasUnreadNotifications(): boolean {
    return this.notificationState && this.notificationState.hasUnread;
  }

  get isAnonymousUser(): boolean {
    return !this.currentUser || this.currentUser.isAnonymous;
  }

  async ngOnInit(): Promise<void> {
    this.checkExtensionInstalled();
  }

  ngOnDestroy() {
  }

  toggleSidebar(): void {
    Store.reduce.byConstructor(layout.SidebarToggleReducer);
  }

  toggleNotificationbar(): void {
    Store.reduce.byConstructor(layout.NotificationbarToggleReducer);
  }

  installExtension(): void {
    const extensionId = environment.extension.id;
    const url = `https://chrome.google.com/webstore/detail/ptiglobal-qc-extension/${extensionId}`;
    window.open(url, '_blank');
  }

  private checkExtensionInstalled() {
    if (!this.isChrome) return;

    const extensionId = environment.extension.id;
    chrome.runtime.sendMessage(extensionId, { message: "version" }, reply => {
      if (reply && reply.version) {
        this.isExtensionInstalled = true;
      }
    });
  }

  private async onCurrentUserStateChanged(s: currentUser.CurrentUserState): Promise<void> {
    this.currentUser = s.value;
    await timeoutPromise();
  }

}

