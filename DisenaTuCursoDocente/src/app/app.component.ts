import { Component } from '@angular/core';
import { Etapa, Grupo } from './modelos/schema.model';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'DisenaTuCursoDocente';
    constructor(public initialSchemaService : InitialSchemaLoaderService){ }

    gruposDeEtapa : Grupo[] | undefined = undefined;
    grupoCargado : Grupo | undefined = undefined;

    mostrarGruposDeEtapa(etapa: Etapa){
        this.gruposDeEtapa = etapa.grupos;
    }

    cargarGrupo(grupo:Grupo){
        this.grupoCargado = grupo;
    }
}
