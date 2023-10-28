import { Component, OnInit, Input } from '@angular/core';
import { QaIssueCommentRepository } from '@app/shared/repositories/qa-issue-comment.repository';
import { QaIssueCommentVm } from '@app/shared/models/QaIssueCommentVm';
import * as he from 'he';
import * as commonUtil from '@app/shared/utils/common.util';
import { CommentVmExt } from '@app/shared/models/CommentVmExt';

@Component({
  selector: 'qa-issue-comments',
  templateUrl: './qa-issue-comments.component.html',
  styleUrls: ['./qa-issue-comments.component.scss'],
})
export class QaIssueCommentsComponent implements OnInit {
  @Input() translationId: number;
  @Input() memoQErrorId: string;
  @Input() qaIssueId?: number;

  areCommentsVisible: boolean;
  isBusy: boolean;
  comments: CommentVmExt[] = [];
  newComment: string;

  constructor(
    private qaIssueCommentRepo: QaIssueCommentRepository,
  ) {
  }

  async ngOnInit(): Promise<void> {
    await this.loadCommments();
  }

  async addComment(): Promise<void> {
    this.isBusy = true;

    const comment = he.escape(this.newComment);

    const model = new QaIssueCommentVm({
      comment,
      qaIssueId: this.qaIssueId,
    });

    await this.qaIssueCommentRepo.create(model);

    this.newComment = undefined;
    this.isBusy = false;
    this.loadCommments();
  }

  async loadCommments(): Promise<void> {
    this.isBusy = true;
    this.comments = await this.qaIssueCommentRepo
      .getByQaIssueId(this.qaIssueId)
      .then(commonUtil.convertArrayTo(CommentVmExt))
      .then(items => items.filter(x => !x.qaIssueId || x.qaIssueId == this.qaIssueId));

    this.isBusy = false;
  }
}

