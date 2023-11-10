import { PlunetEmployeeVm } from "src/app/shared/models/PlunetEmployeeVm";
import { PlunetProjectVm } from "src/app/shared/models/PlunetProjectVm";
import { Clone, IReducer } from 'reduce-store';
import { Injectable } from "@angular/core";

export class TesterHoursByLeadState extends Clone<TesterHoursByLeadState> {
  startDate: Date;
  endDate: Date;
  lead: PlunetEmployeeVm;
  projects: PlunetProjectVm[];
}

@Injectable({ providedIn: 'root' })
export class TesterHoursByLeadStateInitialReducer implements IReducer<TesterHoursByLeadState>  {
  stateCtor = TesterHoursByLeadState;

  reduceAsync(s: TesterHoursByLeadState, getter): Promise<TesterHoursByLeadState> {
    const endDate = new Date().getLastSunday().addDays(-1);
    const startDate = endDate.getLastSunday();
    return Promise.resolve(new TesterHoursByLeadState({ endDate, startDate }));
  }
}

@Injectable({ providedIn: 'root' })
export class TesterHoursByLeadStateSetStateReducer implements IReducer<TesterHoursByLeadState> {
  readonly stateCtor = TesterHoursByLeadState;

  reduceAsync(s: TesterHoursByLeadState, newState: TesterHoursByLeadState): Promise<TesterHoursByLeadState> {
    return Promise.resolve(newState);
  }
}
