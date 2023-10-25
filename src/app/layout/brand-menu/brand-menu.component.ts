import { Component, OnInit, OnDestroy } from '@angular/core';

import { Store } from 'reduce-store';

@Component({
  selector: 'brand-menu',
  templateUrl: './brand-menu.component.html',
  styleUrls: ['./brand-menu.component.scss'],
})
export class BrandMenuComponent implements OnInit, OnDestroy {

  constructor(
  ) {
  }

  async ngOnInit(): Promise<void> {
  }

  ngOnDestroy() {}
}

