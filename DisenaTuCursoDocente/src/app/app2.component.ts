// import { Component, HostListener } from '@angular/core';
// import { Router } from '@angular/router';
// import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';
// import {ExportpdfComponent} from   './exportpdf/exportpdf.component'
// import { GrupoDatoFijo } from './modelos/schema.model';

// const pdfMakeX = require('pdfmake/build/pdfmake.js');
// const pdfFontsX = require('pdfmake-unicode/dist/pdfmake-unicode.js');
// pdfMakeX.vfs = pdfFontsX.pdfMake.vfs;
// import * as pdfMake from 'pdfmake/build/pdfmake';
// import { __values } from 'tslib';


// @Component({
//     templateUrl: './app.component.html',
//     styleUrls: ['./app.component.css'],
//     selector: 'app-root',
//     host: {
//         '(document:click)': 'onClick($event)',
//     },
// })



// export class AppComponent {
//     pdf: any;
//     title = 'DisenaTuCursoDocente';
//     nombreArchivo:string='';
//     datosFijos: GrupoDatoFijo[] | undefined;

//     constructor(private router: Router, public initialSchemaService : InitialSchemaLoaderService) {}

//     ngOnInit(): void {
//         this.initialSchemaService.loadAllDataFile('m.json');
//         this.datosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;
//     }
    
//     gotoHome(){
//         this.router.navigate(['/dashboard']);  // define your component where you want to go
//     }

//     cardClick(idCurso: any){
        
//         var cursos = this.initialSchemaService.allData;
//         if (cursos)
//             for (var i=0; i < cursos.length; i++) {
//                 if (cursos[i].id == idCurso)
//                     this.initialSchemaService.loadedData = cursos[i];
//                     this.router.navigate(['/dashboard']);
//             }
//     }

//     cargarArchivo(event: any){
//         let files = event.srcElement.files;
//         let file: File;
//         event= null;
//         file = files[0]
//         var reader = new FileReader();
//         reader.onload = () => {
//             if (reader.result)
//                 var nuevoCurso = JSON.parse(reader.result.toString());
//                 this.initialSchemaService.allData?.push(nuevoCurso)
//         };
//         reader.readAsText(file);
//     }

//     @HostListener("click", ["$event"])
//     public onClick(event: any): void
//     {
//         event.stopPropagation();
//         var target = event.target;
//         if (!target.closest(".dropdown-menu") && !target.closest(".dropdown-toggle")) { 
//             // do whatever you want here
//             let dropdown = document.querySelectorAll(".dropdown-menu")
//             dropdown.forEach(div => {
//                 if (div.classList.contains("show"))
//                     div.classList.remove('show'); 

//             });
//         }
        
//     }
//     public descargarCurso(event: any, cursoId: number):void{
//         event.stopPropagation();
//         let a = document.createElement('a');
//         if (cursoId && this.initialSchemaService.allData)
//             for (var i=0; i < this.initialSchemaService.allData.length; i++) {
//                 if (this.initialSchemaService.allData[i].id == cursoId)
//                     a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.initialSchemaService.allData[i], null, 4)));
//                     a.setAttribute('download', this.initialSchemaService.allData[i].nombreCurso + ".json");
//                     a.click();
//             }
        
//     }

    

//     public descargarPDF(event: any, cursoId: number):void{
//         event.stopPropagation();
//         const exportPdf = new ExportpdfComponent(this.initialSchemaService);
//         const pdf = exportPdf.generatePdf(cursoId)
//         pdf.open();
//     }
                       
// }
