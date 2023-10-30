import { IReducer, Clone } from "reduce-store";
import { Injectable } from "@angular/core";
import { QaSeverityRepository } from "@app/shared/repositories/qa-severity.repository";
import { QaSeverityVm } from '@app/shared/models/QaSeverityVm';

export class State extends Clone<State>{
  items: QaSeverityVm[];
}

@Injectable({ providedIn: 'root' })
export class GetAllReducer implements IReducer<State>  {
  stateCtor = State;

  constructor(
    private severityRepo: QaSeverityRepository,
  ) { }

  async reduceAsync(s: State): Promise<State> {
    const items = await this.severityRepo.getAll();
    return new State({ items });
  }
}

