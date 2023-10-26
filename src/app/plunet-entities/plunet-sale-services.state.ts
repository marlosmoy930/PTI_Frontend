import { PlunetSaleServiceVm } from "src/app/shared/models/PlunetSaleServiceVm";
import { IReducer, Clone } from 'reduce-store';
import { Injectable } from "@angular/core";
import { PlunetSaleServiceRepository } from "@app/shared/repositories/plunet-sale-service.repository";

export class PlunetSaleServicesState extends Clone<PlunetSaleServicesState>{
  items: PlunetSaleServiceVm[];
}

@Injectable({ providedIn: 'root' })
export class PlunetSaleServiceCollectionInitReducer implements IReducer<PlunetSaleServicesState>  {
  stateCtor = PlunetSaleServicesState;

  constructor(
    private plunetSaleServiceRepo: PlunetSaleServiceRepository,
  ) { }

  async reduceAsync(s: PlunetSaleServicesState): Promise<PlunetSaleServicesState> {
    const items = await this.plunetSaleServiceRepo.getAll();
    return new PlunetSaleServicesState({ items });
  }
}

