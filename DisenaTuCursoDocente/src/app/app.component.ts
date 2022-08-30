import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';


declare function createGraph(graph : any): any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})


export class AppComponent {
    title = 'DisenaTuCursoDocente';
    nombreArchivo:string='';
    constructor(private router: Router, public initialSchemaService : InitialSchemaLoaderService) {}

    ngOnInit(): void {
        this.initialSchemaService.loadAllDataFile('m.json');
    }
    
    gotoHome(){
        this.router.navigate(['/dashboard']);  // define your component where you want to go
    }

    cardClick(idCurso: any){
        
        var cursos = this.initialSchemaService.allData;
        if (cursos)
            for (var i=0; i < cursos.length; i++) {
                if (cursos[i].id == idCurso)
                    this.initialSchemaService.loadedData = cursos[i];
                    this.router.navigate(['/dashboard']);
            }
    }

    cargarArchivo(event: any){
        let files = event.srcElement.files;
        let file: File;
        event= null;
        file = files[0]
        var reader = new FileReader();
        reader.onload = () => {
            if (reader.result)
                var nuevoCurso = JSON.parse(reader.result.toString());
                this.initialSchemaService.allData?.push(nuevoCurso)
        };
        reader.readAsText(file);
    }

    descargarArchivo(){
        let a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.initialSchemaService.loadedData, null, 4)));
        a.setAttribute('download', "file.json");
        a.click();
    }
}


