import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { QaIssueRepository } from '@app/shared/repositories/qa-issue.repository';
import { EditQaIssueVm } from '@app/shared/models/EditQaIssueVm';
import { QaIssueStatus } from '@app/shared/models/QaIssueStatus';

@Component({
  selector: 'qa-issue-edit',
  templateUrl: './qa-issue-edit.component.html',
})
export class QaIssueEditComponent implements OnInit {
  issue: EditQaIssueVm;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private qaIssueRepo: QaIssueRepository,
    private location: Location,
  ) {
  }

  async ngOnInit(): Promise<void> {
    const issueId = <number>this.route.snapshot.params.issueId;

    if (issueId) {
      this.issue = await this.qaIssueRepo.getById(issueId);
    } else {
      this.issue = new EditQaIssueVm({ status: QaIssueStatus.Valid });
    }
  }

  navigateToIssues(): void {
    this.location.back();;
  }

}
