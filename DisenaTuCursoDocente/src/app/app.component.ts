import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { Etapa, Grupo,Esquema } from './modelos/schema.model';
import { SchemaSavedData } from './modelos/schemaData.model';
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
}


