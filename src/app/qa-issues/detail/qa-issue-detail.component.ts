import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { QaIssueRepository } from '@app/shared/repositories/qa-issue.repository';
import { QaIssueDetailVm } from '@app/shared/models/QaIssueDetailVm';
import { ActivatedRoute, Router } from '@angular/router';
import { ArbitrationStatus } from '@app/shared/models/ArbitrationStatus';
import { BsModalService } from 'ngx-bootstrap/modal';
import { showImageModal } from '@app/shared/utils/common.util';
import { QaIssueStatus } from '@app/shared/models/QaIssueStatus';

@Component({
  selector: 'qa-issue-detail',
  templateUrl: './qa-issue-detail.component.html',
})
export class QaIssueDetailComponent implements OnInit {
  private screenshotUri: string;

  hasScreenshot: boolean = false;
  isReady: boolean = false;
  issue: QaIssueDetailVm;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
    private qaIssueRepo: QaIssueRepository,
    private location: Location,
  ) {
  }

  async ngOnInit(): Promise<void> {
    const issueId = <number>this.route.snapshot.params.issueId;
    this.issue = await this.qaIssueRepo.getDetailById(issueId);
    this.hasScreenshot = this.issue.qaIssueFiles.length > 0;
    this.isReady = true;
  }

  async showScreenshot(): Promise<void> {
    if (!this.screenshotUri)
      this.screenshotUri = await this.qaIssueRepo.getScreenshot(this.issue.id, this.issue.qaIssueFiles[0].id);

    showImageModal(this.modalService, { dataUri: this.screenshotUri });
  }

  navigateBack(): void {
    this.location.back();;
  }

  navigateToEdit(): void {
    this.router.navigate([`/qa-issues/${this.issue.id}`]);
  }

  getStatusName(value: QaIssueStatus): string {
    return QaIssueStatus[value];
  }

  getArbitrationStatusName(value: ArbitrationStatus): string {
    return ArbitrationStatus[value];
  }
}
