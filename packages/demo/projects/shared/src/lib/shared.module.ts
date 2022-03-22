import { NgModule } from '@angular/core';
import { ComponentsModule } from 'components';

import { SharedComponent } from './shared.component';

@NgModule({
  declarations: [SharedComponent],
  imports: [ComponentsModule],
  exports: [SharedComponent],
})
export class SharedModule {}
