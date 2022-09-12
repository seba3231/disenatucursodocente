import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import {
  InformacionGuardada,
  SchemaSavedData,
  Version,
} from './modelos/schemaData.model';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';
import {ExportpdfComponent} from   './exportpdf/exportpdf.component'
import { GrupoDatoFijo } from './modelos/schema.model';

const pdfMakeX = require('pdfmake/build/pdfmake.js');
const pdfFontsX = require('pdfmake-unicode/dist/pdfmake-unicode.js');
pdfMakeX.vfs = pdfFontsX.pdfMake.vfs;
import * as pdfMake from 'pdfmake/build/pdfmake';
import { __values } from 'tslib';


@Component({
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    selector: 'app-root',
    host: {
        '(document:click)': 'onClick($event)',
    },
})
export class AppComponent {
  pdf: any;
  title = 'DisenaTuCursoDocente';
  nombreArchivo:string='';
  datosFijos: GrupoDatoFijo[] | undefined;

  constructor(private router: Router, public initialSchemaService : InitialSchemaLoaderService) {}

  ngOnInit(): void {
    this.initialSchemaService.loadAllDataFile2();
    this.datosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;
  }

  gotoHome() {
    this.router.navigate(['/dashboard']); // define your component where you want to go
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

  cargarArchivo(event: any) {
    let files = event.srcElement.files;
    let file: File;
    event = null;
    file = files[0];
    var reader = new FileReader();
    reader.onload = async () => {
      if (reader.result) var nuevoCurso = JSON.parse(reader.result.toString());
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');
      try {
        const response = await fetch('http://localhost:8081/cursos', {
          method: 'POST',
          headers: headers,
          mode: 'cors',
          body: JSON.stringify({
            curso: nuevoCurso,
          }),
        });
        if (response.status === 201) {
          console.log('Curso importado exitosamente');
          this.initialSchemaService.allData?.push(nuevoCurso);
        } else console.log('Ha ocurrido un error, ', response.status);
      } catch (e) {
        console.error(e);
      }
    };
    reader.readAsText(file);
  }

  descargarArchivo() {
    let a = document.createElement('a');
    a.setAttribute(
      'href',
      'data:text/plain;charset=utf-u,' +
        encodeURIComponent(
          JSON.stringify(this.initialSchemaService.loadedData, null, 4)
        )
    );
    a.setAttribute('download', 'file.json');
    a.click();
  }

  initDatosGuardados(): any[] | undefined {
    const datos = this.initialSchemaService.defaultSchema?.etapas[0].grupos
      // .map((etapa) => etapa.grupos)
      // .flat()
      .map((grupo) => grupo.atributos)
      .flat()
      .map((atributo) => atributo.filasDatos)
      .flat()
      .map((fd) => fd?.datos)
      .flat();
    return datos?.map((dato) =>
      dato
        ? new Object({
            ubicacionAtributo: dato.ubicacion,
            cantidadInstancias: 1,
            valoresAtributo: [
              {
                idDato: [dato.id],
                valoresDato: [
                  {
                    string: null,
                    number: null,
                    selectFijo: null,
                    selectUsuario: null,
                    archivo: null,
                    date: null,
                  },
                ],
              },
            ],
          })
        : null
    );
  }

  async crearCurso() {
    const datosGuardados: InformacionGuardada[] | undefined =
      this.initDatosGuardados();
    let curso: SchemaSavedData = {
      id: (this.initialSchemaService.allData?.length || 0) + 1,
      
      nombreCurso: this.nombreArchivo,
      intitucion: '',
      versiones: [
        {
          schemaVersion: 1,
          version: 0,
          datosGuardados,
          autor: '', //tomar el autor del nombre
          fechaModificacion: new Date(),
          fechaCreacion: new Date(),
        },
      ],
    };
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    try {
      const response = await fetch('http://localhost:8081/cursos', {
        method: 'POST',
        headers: headers,
        mode: 'cors',
        body: JSON.stringify({
          curso,
        }),
      });
      if (response.status === 201) {
        console.log('Curso creado exitosamente');
        this.initialSchemaService.allData?.push(curso);
        this.initialSchemaService.loadedData = curso;
        this.router.navigate(['/dashboard']);
      } else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      console.error(e);
    }
  }

  async obtenerCurso(id: number) {
    let headers = new Headers();
    headers.append('Accept', 'application/json');

    try {
      const response = await fetch(`http://localhost:8081/cursos/${id}`, {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      });
      const curso = await response.json();
      if (response.status === 200)
        console.log('Curso obtenido exitosamente', curso);
      else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      console.error(e);
    }
  }

  async listarCursos() {
    let headers = new Headers();
    headers.append('Accept', 'application/json');

    try {
      const response = await fetch('http://localhost:8081/cursos', {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      });
      const cursos = await response.json();
      if (response.status === 200)
        console.log('Cursos obtenidos exitosamente', cursos);
      else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      console.error(e);
    }
  }

  async modificarCurso(id: number, nuevaVersion: Version | undefined) {
    const curso = this.initialSchemaService.allData?.find(
      (curso) => curso.id == id
    );
    if (nuevaVersion !== undefined) curso?.versiones?.push(nuevaVersion);
    let headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    try {
      const response = await fetch(`http://localhost:8081/cursos/${id}`, {
        method: 'PUT',
        headers: headers,
        mode: 'cors',
        body: JSON.stringify({
          curso: { ...curso, fechaModificacion: new Date() },
        }),
      });
      if (response.status === 200)
        console.log('Curso actualizado exitosamente');
      else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
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
    public descargarCurso(event: any, cursoId: number):void{
        event.stopPropagation();
        let a = document.createElement('a');
        if (cursoId && this.initialSchemaService.allData)
            for (var i=0; i < this.initialSchemaService.allData.length; i++) {
                if (this.initialSchemaService.allData[i].id == cursoId)
                    a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.initialSchemaService.allData[i], null, 4)));
                    a.setAttribute('download', this.initialSchemaService.allData[i].nombreCurso + ".json");
                    a.click();
            }
        
    }

    

    public descargarPDF(event: any, cursoId: number):void{
        event.stopPropagation();
        const exportPdf = new ExportpdfComponent(this.initialSchemaService);
        const pdf = exportPdf.generatePdf(cursoId)
        pdf.open();
    }
                       
}
