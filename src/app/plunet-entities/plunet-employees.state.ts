import { PlunetEmployeeVm } from "src/app/shared/models/PlunetEmployeeVm";
import { Clone, IReducer } from 'reduce-store';
import { Injectable } from "@angular/core";
import { PlunetEmployeeRepository } from "@app/shared/repositories/plunet-employee.repository";

export class PlunetEmployeesState extends Clone<PlunetEmployeesState> {
  items: PlunetEmployeeVm[];
}

@Injectable({ providedIn: 'root' })
export class PlunetEmployeeCollectionInitReducer implements IReducer<PlunetEmployeesState>  {
  stateCtor = PlunetEmployeesState;

  constructor(
    private plunetEmployeeRepo: PlunetEmployeeRepository,
  ) { }

  async reduceAsync(s: PlunetEmployeesState): Promise<PlunetEmployeesState> {
    const items = await this.plunetEmployeeRepo.getAll();
    return new PlunetEmployeesState({ items });
  }
}

