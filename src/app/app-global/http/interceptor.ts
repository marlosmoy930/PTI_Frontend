import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable, empty } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LocalStorageService } from "@app/shared/services/local-storage.service";
import { ReduceStore } from "reduce-store";
import * as httpError from '@app/app-global/http/error.state';
import { jsonSafeParse } from "@app/shared/utils/common.util";

@Injectable()
export class QiqSystemHttpInterceptor implements HttpInterceptor {
  private correlationIdKey = 'x-correlation-id';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private localStorage: LocalStorageService,
    private store: ReduceStore,
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.headers.get('No-Auth') == "True") {
      return next.handle(request.clone());
    }

    if (this.localStorage.authToken.isExpired) {
      this.router.navigateByUrl('/sign-in');
      return empty();
    }

    const requestClone = request.clone({
      headers: request.headers.set("Authorization", "Bearer " + this.localStorage.authToken.token)
    });

    return next.handle(requestClone)
      .pipe(
        tap(this.processSuccess.bind(this), this.processError.bind(this)
        ));
  }

  private processSuccess(x: HttpEvent<any>): void {
  }

  private processError(response: HttpErrorResponse): void {
    const status = this.getExceptionStatus(response);

    if (status === 401) {
      this.navigateToSignInUrl();
      return;
    }

    const message = this.getExceptionMessage(response);
    const errorId = this.getCorrelationId(response);
    this.store.reduce(httpError.AddErrorReducer, message, errorId, status);
  }

  private navigateToSignInUrl(): void {
    const isSignInUrl = this.route.snapshot.url.any(x => x.path.indexOf('sign-in') > -1);
    if (!isSignInUrl) {
      let routerStateSnapshot = this.router.routerState.snapshot;
      this.router.navigate(['/sign-in'], { queryParams: { returnUrl: routerStateSnapshot.url } });
    }
  }

  private getExceptionStatus(response: HttpErrorResponse): number {
    if (!!response && !!response.status)
      return response.status;

    return 500;
  }

  private getExceptionMessage(response: HttpErrorResponse) {
    const errorObj = this.getResponseError(response);
    const errMsg =
      errorObj && errorObj.exceptionMessage ? errorObj.exceptionMessage
        : response.status ? `${response.status} - ${response.statusText}`
          : 'Server error';
    return errMsg;
  }

  private getResponseError(response: HttpErrorResponse): any {
    if (response
      && (<any>response)._body instanceof ArrayBuffer
      && (<any>response)._body.byteLength !== undefined) {

      var body = (<any>response)._body;
      return jsonSafeParse(new TextDecoder("utf-8").decode(body));
    }

    if (typeof (response) == 'object') return response.error;

    if (typeof (response) == 'string') return jsonSafeParse(response);

    return ((response as string) || '').toString();
  }

  private getExceptionMessageAsync(response: HttpErrorResponse): Promise<string> {
    return new Promise<string>(resolve => {
      if (!response || !response.error) {
        resolve('Server error');
        return;
      }

      if (this.tryResolveError(response.error, resolve))
        return;

      const reader = new FileReader();
      reader.addEventListener('loadend', (e: any) => {
        const errorText = e.srcElement.result;
        const errorObj = JSON.parse(errorText);

        if (!this.tryResolveError(errorObj, resolve))
          resolve('Server error');
      });

      try {
        reader.readAsText(response.error);
      }
      catch {
        resolve('Server error');
      }

    });
  }

  private tryResolveError(errorObj: any, resolve: (v: string) => void): boolean {
    if (errorObj.ExceptionMessage) {
      resolve(errorObj.ExceptionMessage);
      return true;
    }
    else if (errorObj.Message) {
      resolve(errorObj.Message);
      return true;
    }
    else
      return false;
  }

  private getCorrelationId(response: HttpErrorResponse) {
    return !!response.headers ? response.headers.get(this.correlationIdKey) : null;
  }

}
