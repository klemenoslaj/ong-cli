import { NgModule } from '@angular/core';
import { CoreModule } from 'core';
import { SharedModule } from 'shared';

import { Demo2Component } from './demo2.component';

@NgModule({
  declarations: [Demo2Component],
  imports: [CoreModule, SharedModule],
  exports: [Demo2Component],
})
export class Demo2Module {}
