import { NgModule } from '@angular/core';
import { CoreModule } from 'core';

import { DemoComponent } from './demo.component';

@NgModule({
  declarations: [DemoComponent],
  imports: [CoreModule],
  exports: [DemoComponent],
})
export class DemoModule {}
