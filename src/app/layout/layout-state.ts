import { IReducer } from 'reduce-store';
import { Injectable } from '@angular/core';

export class State {
  isMainContenOnly: boolean;
  isSidebarVisible: boolean;
  isNotificationbarVisible: boolean;

  constructor(init?: Partial<State>) {
    Object.assign(this, init);
  }

  clone() {
    return new State(this);
  }
}

@Injectable({ providedIn: 'root' })
export class MainContentVisibilityReducer implements IReducer<State>  {
  stateCtor = State;

  reduceAsync(s: State = new State(), isMainContenOnly: boolean): Promise<State> {
    s.isMainContenOnly = isMainContenOnly;
    return Promise.resolve(s);
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationbarToggleReducer implements IReducer<State>  {
  stateCtor = State;

  reduceAsync(s: State = new State(), isVisible?: boolean): Promise<State> {
    if (isVisible === undefined)
      s.isNotificationbarVisible = !s.isNotificationbarVisible;
    else
      s.isNotificationbarVisible = isVisible;
    return Promise.resolve(s);
  }
}

@Injectable({ providedIn: 'root' })
export class SidebarToggleReducer implements IReducer<State>  {
  stateCtor = State;

  reduceAsync(s: State = new State()): Promise<State> {
    s.isSidebarVisible = !s.isSidebarVisible;
    return Promise.resolve(s);
  }
}

@Injectable({ providedIn: 'root' })
export class SidebarHideReducer implements IReducer<State>  {
  stateCtor = State;

  reduceAsync(s: State = new State()): Promise<State> {
    s.isSidebarVisible = false;
    return Promise.resolve(s);
  }
}

