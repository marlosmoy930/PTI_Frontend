import { Clone, IReducer } from "reduce-store";
import { Injectable } from "@angular/core";

export class HttpError {
  message: string;
  status: number;
  errorId: string;

  constructor(init: Partial<HttpError>) {
    Object.assign(this, init);
  }
}

export class State extends Clone<State>{
  errors: HttpError[];
}

@Injectable({ providedIn: 'root' })
export class AddErrorReducer implements IReducer<State>{
  stateCtor = State;

  reduceAsync(s: State = new State({ errors: [] }), message: string, errorId: string, status: number): Promise<State> {
    s.errors.push(new HttpError({ message, status, errorId }))
    return Promise.resolve(s);
  }
}

export function removeAllErrorsReducer(): (s: State) => Promise<State> {
  return s => Promise.resolve(new State({ errors: [] }));
}
