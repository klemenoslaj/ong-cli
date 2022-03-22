import { NgModule } from '@angular/core';
import { CoreModule } from 'core';
import { ComponentsModule } from 'components';
import { Feature1Module } from 'feature1';

import { Feature3Component } from './feature3.component';

@NgModule({
  declarations: [Feature3Component],
  imports: [CoreModule, ComponentsModule, Feature1Module],
  exports: [Feature3Component],
})
export class Feature3Module {}
