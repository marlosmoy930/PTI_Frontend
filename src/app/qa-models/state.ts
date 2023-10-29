import { IReducer, Clone } from "reduce-store";
import { Injectable } from "@angular/core";
import { QaModelVm } from '@app/shared/models/QaModelVm';
import { QaModelRepository } from '@app/shared/repositories/qa-model.repository';

export class State extends Clone<State>{
  items: QaModelVm[];
}

@Injectable({ providedIn: 'root' })
export class GetAllReducer implements IReducer<State>  {
  stateCtor = State;

  constructor(
    private qaModelRepo: QaModelRepository,
  ) { }

  async reduceAsync(s: State): Promise<State> {
    const items = await this.qaModelRepo.getList();
    return new State({ items });
  }
}

