import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReportTesterHoursByLeadComponent } from '@app/reports/tester-hours-by-lead/tester-hours-by-lead.component';
import { UserVmExt } from '@app/users/user-vm-ext';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ReportVendorSearchComponent } from '@app/reports/vendor-search/vendor-search.component';
import { Store } from 'reduce-store';
import { TesterHoursByLeadStateInitialReducer } from '@app/reports/tester-hours-by-lead/tester-hours-by-lead.state';
import { CurrentUserState } from '@app/shared/states/current-user.state';
import { AppInfoState } from '@app/shared/states/app-info.state';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: UserVmExt;
  isPlunetApp: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
  ) {
  }

  async ngOnInit(): Promise<void> {
    Store.state.get(AppInfoState).then(x => this.isPlunetApp = x && x.data && x.data.isPlunetApp);
    Store.reduce.byConstructor(TesterHoursByLeadStateInitialReducer);
    this.currentUser = await Store.state.get(CurrentUserState).then(x => x.value);
  }

  showReportTesterHoursByLeadDialog(): void {
    this.modalService.show(ReportTesterHoursByLeadComponent, { backdrop: 'static' });
  }

  showReportVendorSearchDialog(): void {
    this.modalService.show(ReportVendorSearchComponent, { backdrop: 'static' });
  }

  navigate(commands: string[]): void {
    this.router.navigate(commands, { relativeTo: this.route });
  }
}
