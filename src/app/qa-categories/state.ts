import { IReducer, Clone } from "reduce-store";
import { Injectable } from "@angular/core";
import { QaCategoryVm } from "@app/shared/models/QaCategoryVm";
import { QaCategoryRepository } from "@app/shared/repositories/qa-category.repository";

export class State extends Clone<State>{
  items: QaCategoryVm[];
}

@Injectable({ providedIn: 'root' })
export class GetAllReducer implements IReducer<State>  {
  stateCtor = State;

  constructor(
    private categoryRepo: QaCategoryRepository,
  ) { }

  async reduceAsync(s: State): Promise<State> {
    const items = await this.categoryRepo.getAll();
    return new State({ items });
  }
}

