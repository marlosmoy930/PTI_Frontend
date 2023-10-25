import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { AppInfoDataVm } from '@app/shared/models/AppInfoDataVm';
import * as layout from '@app/layout/layout-state';
import { AppInfoState } from '@app/shared/states/app-info.state';
import { CurrentUserState } from '@app/shared/states/current-user.state';
import { Store } from 'reduce-store';
import { timeoutPromise, removeElementById } from '@app/shared/utils/common.util';
import { IntegrationMessageState } from '@app/shared/states/integration-message.state';
import { IntegrationMessageSetStateReducer } from '@app/shared/states/integration-message.reducer';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ReportVendorSearchComponent } from '@app/reports/vendor-search/vendor-search.component';
import { ReportTesterHoursByLeadComponent } from '@app/reports/tester-hours-by-lead/tester-hours-by-lead.component';
import { UserVmExt } from '@app/users/user-vm-ext';
import { SignalRService } from '@app/shared/services/signalr.service';
import * as notificationList from '@app/notifications/notification-list/state';

var notificationBarDefaultWidthPx = 320;
var topmenuDefaultWidthPx = 67;
var topmenuMinWidthPx = 50;
var submenuDefaultWidthPx = 300;
var submenuMinWidthPx = 150;
var topHeaderHeightPx = 40;
var brandMenuHeightPx = 48;

@Component({
  selector: 'body',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private layoutState: layout.State;

  @ViewChild('notificationbar', { static: true }) notificationbar: ElementRef;
  @ViewChild('sidebar', { static: true }) sidebar: ElementRef;
  @ViewChild('submenuAdmin', { static: true }) submenuAdmin: ElementRef;
  @ViewChild('submenuQa', { static: true }) submenuQa: ElementRef;
  @ViewChild('submenuProjectManager', { static: true }) submenuProjectManager: ElementRef;
  @ViewChild('submenuLead', { static: true }) submenuLead: ElementRef;
  @ViewChild('submenuQaManager', { static: true }) submenuQaManager: ElementRef;

  notificationState: notificationList.State;
  subMenuType: SubmenuType;
  isMainContenOnly: boolean = false;
  appInfo: AppInfoDataVm;
  currentUser: UserVmExt;
  currentYear = new Date().getFullYear();

  constructor(
    private modalService: BsModalService,
    private signalR: SignalRService,
  ) {
    window.addEventListener('message', this.onInegrationMessage);

    Store.state.subscribe(CurrentUserState, this, this.onCurrentUserStateChanged);
    Store.state.subscribe(layout.State, this, this.onLayoutStateChanged);
    Store.state.subscribe(notificationList.State, this, this.onNotificationListStateChanged);
  }

  private get notificationbarEl(): HTMLElement {
    return this.notificationbar.nativeElement as HTMLElement;
  }

  private get sidebarEl(): HTMLElement {
    return this.sidebar.nativeElement as HTMLElement;
  }

  private get submenuList(): HTMLElement[] {
    return [
      this.submenuAdmin.nativeElement,
      this.submenuQa.nativeElement,
      this.submenuProjectManager.nativeElement,
      this.submenuLead.nativeElement,
      this.submenuQaManager.nativeElement,
    ];
  }

  get isUnreadNotificationMode(): boolean {
    return this.notificationState && this.notificationState.viewMode == notificationList.ViewMode.Unread;
  }

  get isAllNotificationMode(): boolean {
    return this.notificationState && this.notificationState.viewMode == notificationList.ViewMode.All;
  }

  async ngOnInit(): Promise<void> {
    this.toggleNotificationbar(false);
    this.appInfo = await Store.state.get(AppInfoState).then(x => x.data);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.onInegrationMessage);
  }

  hideSidebar(): void {
    Store.reduce.byConstructor(layout.SidebarHideReducer);
  }

  async toggleSubmenu(submenuEl: HTMLElement, subMenuType: SubmenuType): Promise<void> {
    this.moveSubmenuToTop(submenuEl);
    if (this.subMenuType != subMenuType) {
      await this.showSubmenu(submenuEl, subMenuType);
      await timeoutPromise(200);
      this.hideAllSubmenus(submenuEl);
    } else {
      this.hideSubmenu(submenuEl);
    }
  }

  async showReportVendorSearchDialog(): Promise<void> {
    await this.hideSidebar();
    this.modalService.show(ReportVendorSearchComponent, { backdrop: 'static' });
  }

  async showReportTesterHoursByLeadDialog(): Promise<void> {
    await this.hideSidebar();
    this.modalService.show(ReportTesterHoursByLeadComponent, { backdrop: 'static' });
  }

  toggleNotificationbar(isVisible?: boolean): void {
    Store.reduce.byConstructor(layout.NotificationbarToggleReducer, isVisible);
  }

  showUnreadNotifications(): void {
    Store.reduce.byDelegate(notificationList.State, s => notificationList.changeViewMode(s, notificationList.ViewMode.Unread));
  }

  showAllNotifications(): void {
    Store.reduce.byDelegate(notificationList.State, s => notificationList.changeViewMode(s, notificationList.ViewMode.All));
  }

  private async onNotificationListStateChanged(s: notificationList.State): Promise<void> {
    this.notificationState = s;

    if (this.layoutState.isNotificationbarVisible)
      return;

    await timeoutPromise();

    this.toggleNotificationbar(false);
  }

  private async onCurrentUserStateChanged(s: CurrentUserState): Promise<void> {
    if (!s) return;

    this.currentUser = s.value;
    await timeoutPromise();
    this.hideSidebar();
    this.toggleNotificationbar(false);

    if (this.currentUser.isAnonymous) {
      this.signalR.stopConnection();
    } else {
      this.signalR.startConnection();
    }
  }

  private onLayoutStateChanged(s: layout.State): void {
    if (!s) return;

    this.layoutState = s;
    this.isMainContenOnly = s.isMainContenOnly;
    this.toggleSidebar();
  }

  private toggleSidebar(): void {
    if (!this.currentUser) return;

    if (this.layoutState.isSidebarVisible)
      this.showSidebar();
    else
      this.doHideSidebar();

    if (this.layoutState.isNotificationbarVisible)
      this.showNotificationbar();
    else
      this.hideNotificationbar();
  }

  private async doHideSidebar(): Promise<void> {
    await timeoutPromise();
    this.hideAllSubmenus();
    await timeoutPromise();

    this.subMenuType = null;
    this.sidebarEl.style.left = '-' + this.getElementToHideWidthPx(this.sidebarEl, topmenuMinWidthPx, topmenuDefaultWidthPx);

    document.removeEventListener('click', this.onDocumentClickSidebarProcess);
  }

  private async showSidebar(): Promise<void> {
    this.sidebarEl.style.top = this.getBarTop();
    this.sidebarEl.style.left = '0';
    await timeoutPromise();
    document.addEventListener('click', this.onDocumentClickSidebarProcess);
  }

  private getBarTop(): string {
    const top = Math.max(0, brandMenuHeightPx - document.documentElement.scrollTop) + topHeaderHeightPx;
    return top + 'px';
  }

  private async showSubmenu(submenuEl: HTMLElement, subMenuType: SubmenuType): Promise<void> {
    this.subMenuType = subMenuType;
    await timeoutPromise();
    submenuEl.style.top = this.getBarTop();
    submenuEl.style.left = this.sidebarEl.offsetWidth - 3 + 'px';
  }

  private async hideSubmenu(submenuEl: HTMLElement): Promise<void> {
    this.subMenuType = null;
    submenuEl.style.left = -submenuEl.offsetWidth - this.sidebarEl.offsetWidth + 'px';
  }

  private onDocumentClickSidebarProcess = (event: Event) => {
    const isClickedInsideSidebar = this.sidebarEl.contains(event.target as HTMLElement);
    if (!isClickedInsideSidebar) {
      this.hideSidebar();
    }
  }

  private onDocumentClickNotificationProcess = (event: Event) => {
    const isClickedInsideNotificationbar = this.notificationbarEl.contains(event.target as HTMLElement);
    if (!isClickedInsideNotificationbar) {
      this.toggleNotificationbar(false);
    }
  }

  private onInegrationMessage = (event): void => {
    Store.reduce.byConstructor(IntegrationMessageSetStateReducer, new IntegrationMessageState(event.data));
  }

  private moveSubmenuToTop(submenuEl?: HTMLElement): void {
    this.submenuList.forEach(e => {
      e.style.zIndex = (e == submenuEl ? 1 : 0).toString();
    });
  }

  private hideAllSubmenus(exceptEl?: HTMLElement): void {
    this.submenuList.filter(x => x != exceptEl).forEach(e => {
      e.style.left = '-' + this.getElementToHideWidthPx(e, submenuMinWidthPx, submenuDefaultWidthPx);
    });
  }

  private async showNotificationbar(): Promise<void> {
    this.notificationbarEl.style.top = this.getBarTop();
    this.notificationbarEl.style.right = '0';
    await timeoutPromise();
    document.addEventListener('click', this.onDocumentClickNotificationProcess);
  }

  private async hideNotificationbar(): Promise<void> {
    await timeoutPromise();

    this.notificationbarEl.style.right = '-' + this.getElementToHideWidthPx(this.notificationbarEl, notificationBarDefaultWidthPx, notificationBarDefaultWidthPx);

    document.removeEventListener('click', this.onDocumentClickNotificationProcess);

  }

  private getElementToHideWidthPx(e: HTMLElement, minWidth: number, defaultWidth: number): string {
    const width = e.offsetWidth || 0;
    const result = width < minWidth ? defaultWidth : width;
    return result + 3 + 'px';

  }
}

export type SubmenuType = 'admin' | 'qa' | 'pm' | 'lead' | 'qa-pm';
