import { IReducer, Clone } from "reduce-store";
import { LanguageVm } from "src/app/shared/models/LanguageVm";
import { LanguageRepository } from "@app/shared/repositories/language.repository";
import { Injectable } from "@angular/core";

export class State extends Clone<State>{
  items: LanguageVm[];

  clone(): State {
    const items = this.items.mapCtor(LanguageVm);
    const copy = new State({ items });
    return copy;
  }
}

@Injectable({ providedIn: 'root' })
export class LanguageCollectionInitReducer implements IReducer<State>  {
  stateCtor = State;

  constructor(
    private languageRepo: LanguageRepository,
  ) { }

  async reduceAsync(s: State): Promise<State> {
    const items = await this.languageRepo.getAll();
    return new State({ items });
  }
}

