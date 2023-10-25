import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { LanguageRepository } from '@app/shared/repositories/language.repository';

@Component({
  selector: 'language-list',
  templateUrl: './language-list.component.html',
})
export class LanguageListComponent implements OnInit {
  private allRows: LanguageVm[] = [];

  rows: LanguageVm[];
  pageIndex = 1;
  itemsPerPage = 10;
  isBusy: boolean = false;

  get totalRows(): number {
    return this.allRows.length;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private languageRepo: LanguageRepository,
  ) {
  }

  async ngOnInit(): Promise<void> {
    this.allRows = await this.languageRepo.getAll();
    this.filterRows();
  }

  filterRows(): void {
    const skip = (this.pageIndex - 1) * this.itemsPerPage;
    this.rows = this.allRows.skip(skip).take(this.itemsPerPage);
  }

  async gotoPage(pageIndex: number): Promise<void> {
    this.pageIndex = pageIndex;
    await this.filterRows();
  }

  navigateToEdit(id: number): void {
    this.router.navigate([`${id}`], { relativeTo: this.route });
  }
}
