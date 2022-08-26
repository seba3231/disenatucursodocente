import { Component, OnInit } from '@angular/core';
import { Etapa, Grupo } from './modelos/schema.model';
import { SchemaSavedData } from './modelos/schemaData.model';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';

declare function createGraph(): any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'DisenaTuCursoDocente';
    nombreArchivo:string='';
    constructor(public initialSchemaService : InitialSchemaLoaderService){ }

    gruposDeEtapa : Grupo[] | undefined = undefined;
    grupoCargado : Grupo | undefined = undefined;
    savedData : SchemaSavedData | undefined = undefined;

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

    cargarArchivo(){
        this.initialSchemaService.loadDataFile(this.nombreArchivo);
    }

    descargarArchivo(){
        let a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.initialSchemaService.loadedData, null, 4)));
        a.setAttribute('download', "file.json");
        a.click();
    }
}
