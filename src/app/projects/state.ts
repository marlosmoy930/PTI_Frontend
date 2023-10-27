import { Clone, IReducer } from "reduce-store";
import { Injectable } from "@angular/core";
import { ProjectVm } from "@app/shared/models/ProjectVm";
import { ProjectRepository } from "@app/shared/repositories/project.repository";

export class State extends Clone<State>{
  items: ProjectVm[];
}

@Injectable({ providedIn: 'root' })
export class CurrentUserProjectReducer implements IReducer<State>  {
  stateCtor = State;

  constructor(
    private projectRepo: ProjectRepository,
  ) { }

  async reduceAsync(s: State): Promise<State> {
    const items = await this.projectRepo.getCurrentUserProjects();
    return new State({ items });
  }
}

