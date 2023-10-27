import { Component, OnInit } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { DialogService } from '@app/shared/dialogs/dialog.service';
import { TranslationProviderRepository } from '@app/shared/repositories/translation-provider.repository';
import { UserRole } from '@app/shared/models/UserRole';
import { EnumUtil } from '@app/shared/utils/enum.util';
import { UserVmExt } from '@app/users/user-vm-ext';
import { SelectOption } from '@app/shared/models/select-option';
import { UserRepository } from '@app/shared/repositories/user.repository';
import { TranslationProviderUserVm } from '@app/shared/models/TranslationProviderUserVm';
import { TranslationProviderUserRepository } from '@app/shared/repositories/translation-provider-user.repository';
import { TranslationProviderVm } from '@app/shared/models/TranslationProviderVm';
import { TranslationProviderMoveVm } from '@app/shared/models/TranslationProviderMoveVm';
import { ProjectTranslationProviderRepository } from '@app/shared/repositories/project-translation-provider.repository';
import { ProjectTranslationProviderVm } from '@app/shared/models/ProjectTranslationProviderVm';
import { ProjectRepository } from '@app/shared/repositories/project.repository';
import { ProjectVm } from '@app/shared/models/ProjectVm';
import { LanguageVm } from '@app/shared/models/LanguageVm';
import { ReduceStore } from 'reduce-store';
import * as languages from '@app/languages/state';

@Component({
  selector: 'project-translation-providers',
  templateUrl: './translation-providers.component.html',
})
export class ProjectTranslationProviderComponent implements OnInit {
  isBusy: boolean;
  newProjectProvider: ProjectTranslationProviderVm;
  projectProviders: ProjectTranslationProviderVm[];
  project: ProjectVm;
  availableProviders: TranslationProviderVm[];
  languages: LanguageVm[];

  constructor(
    private store: ReduceStore,
    private route: ActivatedRoute,
    private projectProviderRepo: ProjectTranslationProviderRepository,
    private projectRepo: ProjectRepository,
    private dialogService: DialogService,
    private providerRepo: TranslationProviderRepository,
  ) { }

  get isAddButtonEnabled(): boolean {
    return !!this.newProjectProvider
      && !!this.newProjectProvider.projectId
      && !!this.newProjectProvider.translationProviderId
      && !!this.newProjectProvider.sourceLanguageId
      && !!this.newProjectProvider.targetLanguageId
      && this.newProjectProvider.sourceLanguageId != this.newProjectProvider.targetLanguageId;
  }

  async ngOnInit(): Promise<void> {
    this.isBusy = true;

    const projectId = <number>this.route.snapshot.params.id;

    [this.project, this.languages] = await Promise.all([
      this.projectRepo.getById(projectId),
      this.store.getState(languages.State).then(x => x.items),
    ]);

    await this.loadProvidersData();

    this.isBusy = false;
  }

  async addProjectProvider(): Promise<void> {
    this.isBusy = true;

    if (!this.canAdd()) {
      this.dialogService.alert({ messageKey: 'Projects.ProjectTranslationProvider.ProviderExist' });
      return;
    }

    await this.projectProviderRepo.create(this.newProjectProvider);

    await this.loadProvidersData();

    this.isBusy = false;
  }

  async deleteProjectProvider(projectProvider: ProjectTranslationProviderVm): Promise<void> {
    const dialogResult = await this.dialogService.confirm({ messageKey: 'Confirm.Operation' });
    if (!dialogResult.isConfirmed) return;

    this.isBusy = true;

    await this.projectProviderRepo.delete(projectProvider);

    await this.loadProvidersData();

    this.isBusy = false;
  }

  private canAdd(): boolean {
    return !this.projectProviders.any(
      x => x.translationProviderId == this.newProjectProvider.translationProviderId
        && x.sourceLanguageId == this.newProjectProvider.sourceLanguageId
        && x.targetLanguageId == this.newProjectProvider.targetLanguageId
    );
  }

  private async loadProvidersData(): Promise<void> {
    [this.projectProviders, this.availableProviders] = await Promise.all([
      this.projectProviderRepo.getByProjectId(this.project.id),
      this.providerRepo.getAll(),
    ]);

    this.setNewProvider();
  }

  private setNewProvider(): void {
    this.newProjectProvider = new ProjectTranslationProviderVm({ projectId: this.project.id });
  }
}
