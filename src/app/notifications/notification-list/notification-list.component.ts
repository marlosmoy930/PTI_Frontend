import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { Store, ReducerTask } from "reduce-store";
import * as currentUser from '@app/shared/states/current-user.state';
import * as layout from '@app/layout/layout-state';
import * as notificationList from '@app/notifications/notification-list/state';

@Component({
  selector: '[notification-list]',
  templateUrl: './notification-list.component.html',
})
export class NotificationListComponent implements OnInit, OnDestroy {
  private markAsReadTask: ReducerTask<notificationList.State>;

  @HostBinding('class')
  get classes(): string {
    let result = 'flex-fill d-flex flex-column text-center';
    if (this.hasNoNewNotifications)
      result += ' justify-content-center';

    return result;
  } 

  notificationState: notificationList.State;

  constructor(
  ) {
    this.markAsReadTask = Store.reduce.createReducerTask(notificationList.MarkAsReadReducer, 1000);
    Store.state.subscribe(notificationList.State, this, s => this.notificationState = s);
    Store.state.subscribe(currentUser.CurrentUserState, this, this.onCurrentUserStateChanged);
  }

  get hasNotifications(): boolean {
    return this.notificationState
      && this.notificationState.viewModeNotifications.length > 0;
  }

  get hasNoNewNotifications(): boolean {
    return this.notificationState
      && this.notificationState.viewMode == notificationList.ViewMode.Unread
      && this.notificationState.viewModeNotifications.length == 0;
  }

  async ngOnInit(): Promise<void> {
  }

  ngOnDestroy(): void { }

  markNotificationAsRead(notification: notificationList.SubscriptionNotificationVmExt): void {
    notification.shouldMarkAsRead = true;
    this.markAsReadTask.execute();
  }

  markAsReadAndNavigateToSubscription(notification: notificationList.SubscriptionNotificationVmExt): void {
    this.markNotificationAsRead(notification);
    Store.reduce.byConstructor(layout.NotificationbarToggleReducer);
  }

  async deleteNotificationById(id: number): Promise<void> {
    Store.reduce.byConstructor(notificationList.DeleteReducer, id);
  }

  private async onCurrentUserStateChanged(s: currentUser.CurrentUserState): Promise<void> {
    if (!s) return;

    const currentUser = s.value;
    if (!currentUser.isAnonymous) {
      Store.reduce.byConstructor(notificationList.GetNotificationListReducer);
    } 
  }

}
