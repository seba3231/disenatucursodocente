import { Component } from '@angular/core';
import { Etapa, Grupo } from './modelos/schema.model';
import { SchemaSavedData } from './modelos/schemaData.model';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'DisenaTuCursoDocente';
    nombreCurso:string='';
    constructor(public initialSchemaService : InitialSchemaLoaderService){ }

    gruposDeEtapa : Grupo[] | undefined = undefined;
    grupoCargado : Grupo | undefined = undefined;
    savedData : SchemaSavedData | undefined = undefined;

    mostrarGruposDeEtapa(etapa: Etapa){
        this.gruposDeEtapa = etapa.grupos;
    }

    cargarGrupo(grupo:Grupo){
        this.grupoCargado = grupo;
    }

    crearArchivo(){
        /*const {dialog} = require('electron').remote;
        var fs = require('fs');

        var options = {
            title: "Save file",
            defaultPath : "my_filename",
            buttonLabel : "Save",

            filters :[
                {name: 'txt', extensions: ['txt']},
                {name: 'All Files', extensions: ['*']}
            ]
        };

        dialog.showSaveDialog(null, options).then(
            () => {
                console.log(require('path').join(process.cwd(), "my/relative/path.txt"));
                //fs.writeFileSync(filePath, "hello world", 'utf-8');
            }
        );*/
        /*let nuevoArchivo:SchemaSavedData = {
            schemaVersion:1,
            intitucion:null,
            nombreCurso:this.nombreCurso,
            version:0,
            datosGuardados:null
        };
        let a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(nuevoArchivo)));
        a.setAttribute('download', this.nombreCurso+".json");
        a.click();
        this.savedData = nuevoArchivo;*/
    }
}
