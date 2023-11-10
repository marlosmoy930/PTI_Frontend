import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormUtil } from '@app/shared/utils/form.util';
import { PlunetLanguagesState } from '@app/plunet-entities/plunet-languages.state';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { PlunetLanguageVm } from '@app/shared/models/PlunetLanguageVm';
import { PlunetSaleServiceVm } from '@app/shared/models/PlunetSaleServiceVm';
import { PlunetSaleServicesState } from '@app/plunet-entities/plunet-sale-services.state';
import { VendorSearchState, VendorSearchStateSetStateReducer } from '@app/reports/vendor-search/vendor-search.state';
import { PlunetReportVendorSearchParamsVm } from '@app/shared/models/PlunetReportVendorSearchParamsVm';
import { PlunetReportRepository } from '@app/shared/repositories/plunet-report.repository';
import { ReduceStore } from 'reduce-store';
import { IModalSubscription } from '@app/shared/dialogs/imodal-subscription';

@Component({
  selector: 'report-vendor-search',
  templateUrl: './vendor-search.component.html',
})
export class ReportVendorSearchComponent implements OnInit {
  @ViewChild('form') form: FormGroup;

  saleServices: PlunetSaleServiceVm[] = [];
  languages: PlunetLanguageVm[] = [];
  state: VendorSearchState;

  isEndDateInvalid: boolean;
  _isBusy: boolean = false;

  private subscription: IModalSubscription;

  constructor(
    public bsModalRef: BsModalRef,
    private reportRepo: PlunetReportRepository,
    private modalService: BsModalService,
    private store: ReduceStore,
  ) { }

  async ngOnInit(): Promise<void> {
    this.subscription = this.modalService.onHidden.subscribe(this.onHidden.bind(this));
    [this.languages, this.saleServices, this.state] = await Promise.all([
      this.store.getState(PlunetLanguagesState).then(x => x.items),
      this.store.getState(PlunetSaleServicesState).then(x => x.items),
      this.store.getState(VendorSearchState),
    ]);
  }

  get isBusy(): boolean {
    return this._isBusy;
  }

  set isBusy(value: boolean) {
    this._isBusy = value;
    FormUtil.updateFormAccess(this.form, !value);
  }

  onHidden(reason: string): void {
    this.subscription.unsubscribe();
    this.subscription = null;

    this.store.reduce(VendorSearchStateSetStateReducer, this.state);
  }

  async generateReport(): Promise<void> {
    if (this.isBusy) return;

    this.isBusy = true;

    FormUtil.markAsTouched(this.form);

    if (this.form.invalid) {
      this.isBusy = false;
      return;
    }

    const model = new PlunetReportVendorSearchParamsVm({
      languageId: this.state.language.id,
      saleServiceId: this.state.saleService.id,
    });

    await this.reportRepo.getVendorSearch(model);

    this.isBusy = false;

    this.bsModalRef.hide();
  }
}
