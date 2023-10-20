import { InitializeService } from '@app/shared/services/initialize.service';
import { APP_INITIALIZER, Injector } from '@angular/core';
import { Store, AllLogEventTypes } from 'reduce-store';

export const AppInitializer = {
  provide: APP_INITIALIZER,
  useFactory: initializeFactory,
  deps: [Injector],
  multi: true
}

export function initializeFactory(injector: Injector) {
  return () => {
    Store.config.set({
      cloneMethodName: 'clone',
      disposeMethodName: 'ngOnDestroy',
      resolver: injector
    });

    //Store.logging.setConfiguration([]);
    //Store.logging.turnOn();

    const initService = injector.get(InitializeService);
    initService.init();
  }
}
