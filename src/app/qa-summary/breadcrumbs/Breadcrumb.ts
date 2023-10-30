export class Breadcrumb {
  isLink: boolean = true;

  readonly title: string;
  readonly params: { [k: string]: any };
  readonly name: string;
  readonly link: string;
  readonly isFailed: boolean;
  readonly isBenchmarkFailed: boolean;

  readonly fullLink: string;

  constructor(init: Partial<Breadcrumb>) {
    Object.assign(this, init);
    this.fullLink = '/qa-summary/' + this.link;
  }
}
