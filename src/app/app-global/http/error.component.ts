import { Component, OnDestroy, ViewChild } from '@angular/core';

import * as httpError from '@app/app-global/http/error.state';
import { Store } from 'reduce-store';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-http-error',
  templateUrl: './error.component.html'
})
export class AppHttpErrorComponent implements OnDestroy {
  @ViewChild('modal') modal: ModalDirective;
  isModalVisible: boolean;
  errors: httpError.HttpError[];

  constructor(
  ) {
    Store.state.subscribe(httpError.State, this, this.onHttpErrorStateChange);
  }

  ngOnDestroy() { }

  private onHttpErrorStateChange(s: httpError.State): void {
    if (!s) return;

    this.errors = s.errors.map(x => new httpError.HttpError(x));
    this.isModalVisible = true;
  }

  close(): void {
    this.modal.hide();
  }

  onHidden(): void {
    this.isModalVisible = false;
    Store.reduce.byDelegate(httpError.State, httpError.removeAllErrorsReducer());
  }

}
