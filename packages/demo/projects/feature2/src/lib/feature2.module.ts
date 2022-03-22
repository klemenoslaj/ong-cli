import { NgModule } from '@angular/core';
import { CoreModule } from 'core';
import { ComponentsModule } from 'components';

import { Feature2Component } from './feature2.component';

@NgModule({
  declarations: [Feature2Component],
  imports: [CoreModule, ComponentsModule],
  exports: [Feature2Component],
})
export class Feature2Module {}
