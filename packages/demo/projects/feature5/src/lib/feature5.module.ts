import { NgModule } from '@angular/core';
import { SharedModule } from 'shared';
import { ComponentsModule } from 'components';
import { Feature1Module } from 'feature1';

import { Feature5Component } from './feature5.component';

@NgModule({
  declarations: [Feature5Component],
  imports: [SharedModule, ComponentsModule, Feature1Module],
  exports: [Feature5Component],
})
export class Feature5Module {}
