import { NgModule } from '@angular/core';
import { CoreModule } from 'core';
import { Feature1Module } from 'feature1';

import { Feature4Component } from './feature4.component';

@NgModule({
  declarations: [Feature4Component],
  imports: [CoreModule, Feature1Module],
  exports: [Feature4Component],
})
export class Feature4Module {}
