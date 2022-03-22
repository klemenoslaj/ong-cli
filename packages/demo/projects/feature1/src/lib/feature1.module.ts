import { NgModule } from '@angular/core';
import { SharedModule } from 'shared';
import { ComponentsModule } from 'components';

import { Feature1Component } from './feature1.component';

@NgModule({
  declarations: [Feature1Component],
  imports: [SharedModule],
  exports: [Feature1Component],
})
export class Feature1Module {}
