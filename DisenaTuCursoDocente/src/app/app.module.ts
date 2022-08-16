import { ConditionalExpr } from '@angular/compiler';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';
import { EtapaComponent } from './etapa/etapa.component';
import { GrupoComponent } from './grupo/grupo.component';
import { AtributoComponent } from './atributo/atributo.component';

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
    EtapaComponent,
    GrupoComponent,
    AtributoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
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
