import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';
import { EtapaComponent } from './etapa/etapa.component';
import { GrupoComponent } from './grupo/grupo.component';
import { AtributoComponent } from './atributo/atributo.component';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ArchivoComponent } from './datos/archivo/archivo.component';
import { ExportpdfComponent } from './exportpdf/exportpdf.component';
import { TextoNumberComponent } from './datos/textonumber/textonumber.component';
import { ModalComentariosComponent } from './modal/comentarios/modal-comentarios.component';
import { ModalConfirmacionComponent } from './modal/confirmacion/modal-confirmacion.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeComponent } from './home/home.component';


export function initConfig(loaderService : InitialSchemaLoaderService) {
    //return () => protesis.obtenerConfiguraciones();
    return function(){
        return new Observable(
            (subscriber) => {
                loaderService.loadInitialSchema();
                console.log("Inicialización completa");
                subscriber.complete();
                // HTTP Get call
                /*this.http.get<ConfiguracionDTO>(url).subscribe(
                    (res) => {
                        this.configuration = res;
                        subscriber.complete();
                    },
                    (error) => {
                        subscriber.error(error);
                    }
                );*/
            }
        );
    }
    /*let observableInicial = () => { return protesis.obtenerConfiguraciones() };
    return observableInicial;*/
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    EtapaComponent,
    GrupoComponent,
    AtributoComponent,
    ModalComentariosComponent,
    ModalConfirmacionComponent,
    DashboardComponent,
    ArchivoComponent,
    TextoNumberComponent,
    ExportpdfComponent
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
