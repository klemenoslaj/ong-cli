import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ComponentsModule } from 'components';
import { CoreModule } from 'core';
import { Feature1Module } from 'feature1';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CoreModule, ComponentsModule, Feature1Module],
  bootstrap: [AppComponent],
})
export class AppModule {}
