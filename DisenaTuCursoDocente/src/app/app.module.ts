import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';
import { GrupoComponent } from './grupo/grupo.component';
import { AtributoComponent } from './atributo/atributo.component';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard/dashboard.component';
import { cursosServidorComponent } from './cursosServidor/cursosServidor';
import { ExportpdfComponent } from './exportpdf/exportpdf.component';
import { ModalComentariosComponent } from './modal/comentarios/modal-comentarios.component';
import { ModalConfirmacionComponent } from './modal/confirmacion/modal-confirmacion.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from './home/home.component';
import { ReporteComponent } from './reporte/reporte.component';
import { ModalLoginComponent } from './modal-login/modal-login.component';


export function initConfig(loaderService : InitialSchemaLoaderService) {
    return function(){
        return new Observable(
            (subscriber) => {
                loaderService.loadInitialSchema();
                console.log("Inicialización completa");
                subscriber.complete();
            }
        );
    }
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GrupoComponent,
    AtributoComponent,
    ModalComentariosComponent,
    ModalConfirmacionComponent,
    DashboardComponent,
    cursosServidorComponent,
    ExportpdfComponent,
    ReporteComponent,
    ModalLoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule
  ],
  providers: [
    {
        provide: APP_INITIALIZER,
        useFactory: initConfig,
        deps: [InitialSchemaLoaderService],
        multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
