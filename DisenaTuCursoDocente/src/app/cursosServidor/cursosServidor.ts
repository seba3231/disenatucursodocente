import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
imports: [
  NgbModule
]
const pdfMakeX = require('pdfmake/build/pdfmake.js');
const pdfFontsX = require('pdfmake-unicode/dist/pdfmake-unicode.js');
pdfMakeX.vfs = pdfFontsX.pdfMake.vfs;
import * as pdfMake from 'pdfmake/build/pdfmake';
import { __values } from 'tslib';
import { ExportpdfComponent } from '../exportpdf/exportpdf.component';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';
import { GrupoDatoFijo } from '../modelos/schema.model';
import { InformacionGuardada, SchemaSavedData, Version } from '../modelos/schemaData.model';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';


@Component({
    selector: 'app-cursosServidor',
    templateUrl: './cursosServidor.html',
    styleUrls: ['./cursosServidor.css'],
})
export class cursosServidorComponent {
    pdf: any;
    title = 'DisenaTuCursoDocente';
    nombreArchivo:string='';
    autor:string='';
    datosFijos: GrupoDatoFijo[] | undefined;

    constructor(private modalService: NgbModal, private router: Router,
      public initialSchemaService : InitialSchemaLoaderService) {}

    ngOnInit(): void {
      const alert = document.querySelector('ngb-alert')
      if(alert)
        alert.classList.remove('show')
    }



    cardClick(idCurso: any) {
      var cursos = this.initialSchemaService.allData;
      if (cursos)
        for (var i = 0; i < cursos.length; i++) {
          if (cursos[i].id == idCurso)
            this.initialSchemaService.loadedData = cursos[i];
          this.router.navigate(['/dashboard']);
        }
    }

    goHome(){
      this.initialSchemaService.loadedData = undefined
      this.router.navigate(['/']);
  }


    async listarCursos() {
      let headers = new Headers();
      headers.append('Accept', 'application/json');

      try {
        const response = await fetch('http://localhost:'+this.initialSchemaService.puertoBackend+'/cursos', {
          method: 'GET',
          headers: headers,
          mode: 'cors',
        });
        const cursos = await response.json();
        if (response.status === 200)
          console.log('Cursos obtenidos exitosamente', cursos);
        else console.log('Ha ocurrido un error, ', response.status);
      } catch (e) {
        const alert = document.querySelector('ngb-alert')
        if(alert)
          alert.classList.add('show')
        console.error(e);
      }
    }

      @HostListener("click", ["$event"])
      public onClick(event: any): void
      {
          event.stopPropagation();
          var target = event.target;
          if (!target.closest(".dropdown-menu") && !target.closest(".dropdown-toggle")) {
              // do whatever you want here
              let dropdown = document.querySelectorAll(".dropdown-menu")
              dropdown.forEach(div => {
                  if (div.classList.contains("show"))
                      div.classList.remove('show');

              });
          }

      }


    muestroHeader(){
        let vuelta = this.initialSchemaService.loadedData !== undefined;
        console.log("muestroHeader: "+vuelta);
        return vuelta;
    }

    muestroMisCursos(){
        let vuelta = this.initialSchemaService.allData === undefined && this.initialSchemaService.loadedData !== undefined;
        console.log("muestroMisCursos: "+vuelta);
        return vuelta;
    }

    muestroCursosCompartidosConmigo(){
        let vuelta = this.initialSchemaService.allData && !this.initialSchemaService.loadedData;
        console.log("muestroCursosCompartidosConmigo: "+vuelta);
        return vuelta;
    }

    muestroNoExistenCursos(){
        let vuelta = !this.initialSchemaService.allData;
        console.log("muestroNoExistenCursos: "+vuelta);
        return vuelta;
    }
}
