import { PlunetProjectVm } from "src/app/shared/models/PlunetProjectVm";
import { Clone, IReducer } from 'reduce-store';
import { Injectable } from "@angular/core";
import { PlunetProjectRepository } from "@app/shared/repositories/plunet-project.repository";

export class PlunetMasterProjectState extends Clone<PlunetMasterProjectState> {
  items: PlunetProjectVm[];
}

@Injectable({ providedIn: 'root' })
export class PlunetMasterProjectCollectionInitReducer implements IReducer<PlunetMasterProjectState>  {
  stateCtor = PlunetMasterProjectState;

  constructor(
    private plunetProjectRepo: PlunetProjectRepository,
  ) { }

  async reduceAsync(s: PlunetMasterProjectState): Promise<PlunetMasterProjectState> {
    const items = await this.plunetProjectRepo.getMasterProjects();
    return new PlunetMasterProjectState({ items });
  }
}

