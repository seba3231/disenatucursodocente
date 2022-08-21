import { Component, OnInit } from '@angular/core';
import { Etapa, Grupo } from './modelos/schema.model';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';

declare function createGraph(): any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'DisenaTuCursoDocente';
    constructor(public initialSchemaService : InitialSchemaLoaderService){ }

    gruposDeEtapa : Grupo[] | undefined = undefined;
    grupoCargado : Grupo | undefined = undefined;

    ngOnInit() {
        createGraph(); // function en script.js
    }

    mostrarGruposDeEtapa(etapa: Etapa){
        console.log(etapa.grupos)
        this.gruposDeEtapa = etapa.grupos;
    }

    cargarGrupo(grupo:Grupo){
        console.log(grupo)
        this.grupoCargado = grupo;
    }
}
