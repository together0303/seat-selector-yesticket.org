import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';

import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { ViewComponent } from './components/view/view.component';
import { PreviewFurnitureComponent } from './components/preview-furniture/preview-furniture.component';
import { ChairsLayoutComponent } from './components/chairs-layout/chairs-layout.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CustomRoomComponent } from './components/custom-room/custom-room.component';
import { EditInfoComponent } from './components/edit-info/edit-info.component';
import { HttpClientModule } from '@angular/common/http';
import { NotifierModule } from 'angular-notifier';
import {RouterModule } from '@angular/router';
@NgModule({
  declarations: [
    AppComponent,
    ViewComponent,
    PreviewFurnitureComponent,
    ChairsLayoutComponent,
    CustomRoomComponent,
    EditInfoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatGridListModule,
    MatCardModule,
    HttpClientModule,
    NotifierModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [ChairsLayoutComponent, CustomRoomComponent, EditInfoComponent]
})
export class AppModule { }
