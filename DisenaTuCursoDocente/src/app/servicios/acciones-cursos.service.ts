import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { SchemaSavedData } from '../modelos/schemaData.model';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AccionesCursosService {
    impactarCambios:boolean = false;

    constructor(private modalService: NgbModal, private router: Router, 
        public initialSchemaService : InitialSchemaLoaderService) {}
    
    setImpactarCambios(value: boolean){
      this.impactarCambios = value;
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
    
    async obtenerCurso(id: number) {
        let headers = new Headers();
        headers.append('Accept', 'application/json');
    
        try {
          const response = await fetch(`http://localhost:`+this.initialSchemaService.puertoBackend+`/cursos/${id}`, {
            method: 'GET',
            headers: headers,
            mode: 'cors',
          });
          const curso = await response.json();
          if (response.status === 200)
            console.log('Curso obtenido exitosamente', curso);
          else console.log('Ha ocurrido un error, ', response.status);
        } catch (e) {
          const alert = document.querySelector('ngb-alert')
          if(alert)
            alert.classList.add('show')
          console.error(e);
        }
    }
    
    async modificarCurso() {
        const curso : SchemaSavedData | undefined = this.initialSchemaService.loadedData;
        let headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        try {
          // no hay convencion sobre los nombres aun asi que paso id para que busque archivo curso_id 
          const response = await fetch(`http://localhost:`+this.initialSchemaService.puertoBackend+`/cursos/${curso?.id}`, {
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
}
