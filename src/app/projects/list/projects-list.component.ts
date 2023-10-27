import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { ProjectFilter } from '@app/shared/models/ProjectFilter';

@Component({
  selector: 'projects-list',
  templateUrl: './projects-list.component.html',
})
export class ProjectListComponent implements OnInit {
  private shouldLoadTotalRows: boolean = true;

  rows: ProjectVm[];
  totalRows: number;
  pageIndex = 1;
  itemsPerPage = 10;
  projectName: string;
  documentName: string;
  isBusy: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectRepo: ProjectRepository,
  ) {
  }

  async ngOnInit(): Promise<void> {
    this.loadRows();
  }

  async loadRows(): Promise<void> {
    const filter = this.getFilter();

    this.projectRepo
      .getCurrentUserProjectsFiltered(filter)
      .then(rows => this.rows = rows);

    if (this.shouldLoadTotalRows) {
      this.shouldLoadTotalRows = false;
      this.projectRepo
        .getCurrentUserProjectsTotalRows(filter)
        .then(total => this.totalRows = total);
    }
  }

  async gotoPage(pageIndex: number): Promise<void> {
    this.pageIndex = pageIndex;
    this.isBusy = true;
    await this.loadRows();
    this.isBusy = false;
  }

  async searchProjects(): Promise<void> {
    this.shouldLoadTotalRows = true;
    this.gotoPage(1);
  }

  navigateToEdit(id: number): void {
    this.router.navigate([`${id}`], { relativeTo: this.route });
  }

  private getFilter(): ProjectFilter {
    const filter = new ProjectFilter({
      projectName: this.projectName,
      documentName: this.documentName,
      pageIndex: this.pageIndex,
      pageSize: this.itemsPerPage
    });
    return filter;
  }
}
