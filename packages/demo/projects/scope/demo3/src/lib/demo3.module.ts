import { NgModule } from '@angular/core';
import { DemoModule } from '@scope/demo';

import { Demo3Component } from './demo3.component';

@NgModule({
  declarations: [Demo3Component],
  imports: [DemoModule],
  exports: [Demo3Component],
})
export class Demo3Module {}
