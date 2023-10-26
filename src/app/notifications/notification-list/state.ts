import { Injectable } from '@angular/core';
import { Clone, IReducer, Store } from "reduce-store";
import { SubscriptionNotificationVm } from "@app/shared/models/SubscriptionNotificationVm";
import { SubscriptionNotificationRepository } from '@app/shared/repositories/subscription-notification.repository';
import { SubscriptionNotificationStatus } from '@app/shared/models/SubscriptionNotificationStatus';
import { SubscriptionNotificationDataBase } from '@app/shared/models/SubscriptionNotificationDataBase';
import { EventTriggerType } from '@app/shared/models/EventTriggerType';

export class State extends Clone<State> {
  readonly hasUnread: boolean;
  viewMode: ViewMode;
  notifications: SubscriptionNotificationVmExt[];
  viewModeNotifications: SubscriptionNotificationVmExt[];

  constructor(init: Partial<State>) {
    super(init);

    this.hasUnread = this.notifications.any(x => x.isNew);

    switch (this.viewMode) {
      case ViewMode.Unread:
        this.viewModeNotifications = this.notifications.filter(x => x.isNew);
        break;
      case ViewMode.All:
        this.viewModeNotifications = this.notifications.slice();
        break;
      default:
        throw new Error('viewMode is not implemented');
    }
  }

}

export class SubscriptionNotificationVmExt extends SubscriptionNotificationVm {
  isNew: boolean;
  data: SubscriptionNotificationDataBase;
  shouldMarkAsRead: boolean;
}

export enum ViewMode {
  Unread = 1,
  All = 2
}

@Injectable({ providedIn: 'root' })
export class GetNotificationListReducer implements IReducer<State>  {
  stateCtor = State;

  constructor(
    private repo: SubscriptionNotificationRepository,
  ) { }

  async reduceAsync(s: State = new State({ notifications: [], viewMode: ViewMode.Unread })): Promise<State> {
    const notifications = await this.repo
      .getCurrentUserSubscriptions()
      .then(items => items.map(x => createNotification(x)));

    s.notifications = notifications.orderByDescending(x => x.id);

    return s;
  }
}

@Injectable({ providedIn: 'root' })
export class MarkAsReadReducer implements IReducer<State>  {
  stateCtor = State;

  constructor(
    private repo: SubscriptionNotificationRepository,
  ) { }

  async reduceAsync(s: State): Promise<State> {
    const notifications = s.notifications.filter(x => x.shouldMarkAsRead);
    const notificationIds = notifications.map(x => x.id);

    await this.repo.markWebNotificationsAsRead(notificationIds);

    notifications.forEach(x => {
      x.status = SubscriptionNotificationStatus.Processed;
      x.shouldMarkAsRead = false;
      x.isNew = false;
    });

    return s;
  }
}

@Injectable({ providedIn: 'root' })
export class DeleteReducer implements IReducer<State>  {
  stateCtor = State;

  constructor(
    private repo: SubscriptionNotificationRepository,
  ) { }

  async reduceAsync(s: State, id: number): Promise<State> {
    await this.repo.delete(id);
    s.notifications = s.notifications.filter(x => x.id != id);
    return s;
  }
}

export function changeViewMode(s: State, viewMode: ViewMode): Promise<State> {
  s.viewMode = viewMode;
  return Promise.resolve(s);
}

function createNotification(vm: Partial<SubscriptionNotificationVm>): SubscriptionNotificationVmExt {
  const item = new SubscriptionNotificationVmExt(vm);
  item.isNew = item.status == SubscriptionNotificationStatus.Created;
  switch (item.eventTriggerType) {
    case EventTriggerType.IssueThresholdExceeded:
      item.data = JSON.parse(item.dataJson) as SubscriptionNotificationDataBase;
      break;
    case EventTriggerType.NewSegmentAnswer:
      item.data = JSON.parse(item.dataJson) as SubscriptionNotificationDataBase;
      break;
    default:
      throw new Error('EventTriggerType is not implemented');
  }
  return item;
}
