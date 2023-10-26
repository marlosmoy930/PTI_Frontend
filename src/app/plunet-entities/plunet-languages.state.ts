import { PlunetLanguageVm } from "src/app/shared/models/PlunetLanguageVm";
import { Clone, IReducer } from 'reduce-store';
import { PlunetLanguageRepository } from "@app/shared/repositories/plunet-language.repository";
import { Injectable } from "@angular/core";

export class PlunetLanguagesState extends Clone<PlunetLanguagesState> {
  items: PlunetLanguageVm[];
}

@Injectable({ providedIn: 'root' })
export class PlunetLanguageCollectionInitReducer implements IReducer<PlunetLanguagesState>  {
  stateCtor = PlunetLanguagesState;

  constructor(
    private plunetLanguageRepo: PlunetLanguageRepository,
  ) { }

  async reduceAsync(s: PlunetLanguagesState): Promise<PlunetLanguagesState> {
    const items = await this.plunetLanguageRepo.getAll();
    return new PlunetLanguagesState({ items });
  }
}

