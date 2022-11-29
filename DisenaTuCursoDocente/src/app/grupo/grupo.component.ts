import { Component, OnInit, Input } from '@angular/core';
import { RegistrarDependencia } from '../atributo/atributo.component';
import { Atributo, Grupo, Ubicacion } from '../modelos/schema.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ComentarioPrivado } from '../modelos/schema.model'
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { AccionesCursosService } from '../servicios/acciones-cursos.service';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';
import { Version } from '../modelos/schemaData.model'

@Component({
  selector: 'app-grupo',
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css'],
})
export class GrupoComponent implements OnInit {
    @Input() grupo!: Grupo;
    @Input() versionSeleccionada!: Version | undefined;

    comentariosPrivados: ComentarioPrivado[] = [];
    mapObservadorCambios : Map<string,RegistrarDependencia[]> = new Map();

    constructor(private modalService: NgbModal,
        public initialSchemaService : InitialSchemaLoaderService,
        public accionesCursosService: AccionesCursosService
    ) {}

    ngOnInit(): void {}

    registrarDependencia(registroDependencia:RegistrarDependencia){
        const ordered = Object.keys(registroDependencia.observado).sort().reduce(
            (obj, key) => { 
              obj[key] = registroDependencia.observado[key]; 
              return obj;
            }, 
            {}
          );
        registroDependencia.observado = ordered as Ubicacion;
        let claveMap = this.objectToString(registroDependencia.observado);
        let depdendencias = this.mapObservadorCambios.get(claveMap);
        if(depdendencias === undefined){
            let array : RegistrarDependencia[] = [];
            array.push(registroDependencia);
            this.mapObservadorCambios.set(claveMap,array);
        }
        else{
            depdendencias.push(registroDependencia);
        }
    }

    eliminarDependencia(interesado:string){
        for(let value of this.mapObservadorCambios.values()){
            let dependenciaAEliminar : number[]=[];
            for(let [indice,regDep] of value.entries()){
                if(regDep.claveInteresado===interesado){
                    dependenciaAEliminar.push(indice);
                }
            }
            for (var i = dependenciaAEliminar.length -1; i >= 0; i--){
                value.splice(dependenciaAEliminar[i],1);
            }
        }
    }

    informarCambio(cambioEnUbicacion:Ubicacion){
        const ordered = Object.keys(cambioEnUbicacion).sort().reduce(
            (obj, key) => { 
              obj[key] = cambioEnUbicacion[key]; 
              return obj;
            }, 
            {}
          );
        let claveMap = this.objectToString(ordered);
        let depdendencias : RegistrarDependencia[] | undefined= this.mapObservadorCambios.get(claveMap);
        if(depdendencias !== undefined){
            for(let dependencia of depdendencias){
                let claveObservado = this.objectToString(dependencia.observado);
                if(claveMap === claveObservado){
                    dependencia.interesadoEscucha.emit(dependencia);
                }
            }
        }
    }

    objectToString(obj:any){
        return JSON.stringify(obj);
    }

    stringToObject(string:string){
        return JSON.parse(string);
    }

    openModal(atributo: Atributo){
        // MODAL PARA AGREGAR COMENTARIOS
        console.log(atributo)
        const InformacionGuardada = this.initialSchemaService.loadedData?.versiones.at(-1)?.datosGuardados
        console.log(InformacionGuardada)
        this.comentariosPrivados = []
        if (InformacionGuardada)
            for(let dato of InformacionGuardada){
                if(dato.ubicacionAtributo.idEtapa == atributo.ubicacion.idEtapa &&
                    dato.ubicacionAtributo.idGrupo == atributo.ubicacion.idGrupo &&
                    dato.ubicacionAtributo.idAtributo == atributo.id){
                        if (dato.comentariosPrivados)
                            for(let comentario of dato.comentariosPrivados){
                                this.comentariosPrivados.push(comentario)
                            }
                        
                }
            }
        const ubiAtrr = atributo.ubicacion
        const modalRef = this.modalService.open(ModalComentariosComponent, {
            scrollable: false,
        });
        modalRef.componentInstance.tittle = 'Agregar comentario';
        modalRef.componentInstance.inputDisclaimer[0] = '*Los comentarios que ingreses aquí solo tú los veras';
        modalRef.componentInstance.comentariosPrivados = this.comentariosPrivados;
        //modalRef.componentInstance.resolveFunction = this.resolveModal;

        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: (resp) => {
                console.log(this.comentariosPrivados);
                console.log('comentario: ' + resp);
                console.log(modalRef.componentInstance);
                if (resp.length > 0 && resp[0].length > 0){
                    var today = new Date();
                    let autor = this.initialSchemaService.loadedData?.versiones.at(-1)?.autor;
                    let comentario : ComentarioPrivado = {
                        // autor : this.initialSchemaService.loadedData?.autor;
                        autor : autor,
                        fecha : today.getTime(),
                        valor : resp[0]
                    }
                    const InformacionGuardada = this.initialSchemaService.loadedData?.versiones.at(-1)?.datosGuardados
                    if (InformacionGuardada)
                        for(let dato of InformacionGuardada){
                            if(dato.ubicacionAtributo.idEtapa == atributo.ubicacion.idEtapa &&
                                dato.ubicacionAtributo.idGrupo == atributo.ubicacion.idGrupo &&
                                dato.ubicacionAtributo.idAtributo == atributo.id){
                                    if (dato.comentariosPrivados == undefined){
                                        dato.comentariosPrivados = []
                                    }
                                    dato.comentariosPrivados.push(comentario)
                                    this.comentariosPrivados.push(comentario)
                            
                            }
                        }
                        
                }
                if (modalRef.componentInstance.comentariosPrivados){
                    // this.comentariosPrivados = modalRef.componentInstance.comentariosPrivados
                    const InformacionGuardada = this.initialSchemaService.loadedData?.versiones.at(-1)?.datosGuardados
                    if (InformacionGuardada)
                        for(let dato of InformacionGuardada){
                            if(dato.ubicacionAtributo.idEtapa == atributo.ubicacion.idEtapa &&
                                dato.ubicacionAtributo.idGrupo == atributo.ubicacion.idGrupo &&
                                dato.ubicacionAtributo.idAtributo == atributo.id){
                                    dato.comentariosPrivados = this.comentariosPrivados
                                    
                            }
                        }
                }
            },
            error: () => {
                //Nunca se llama aca
            },
        });
    }

    async modificarCurso() {
        const curso = this.initialSchemaService.loadedData
        // busco version actualizada y la agrego como nueva cuando es el 1er cambio, falta definir esa logica
        // const nuevaVersion = curso?.versiones.at(-1); 
        // if (nuevaVersion !== undefined) curso?.versiones?.push(nuevaVersion);
        let headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Content-Type', 'application/json');
        try {
          // no hay convencion sobre los nombres aun asi que paso id para que busque archivo curso_id 
          const response = await fetch(`http://localhost:${this.initialSchemaService.puertoBackend}/cursos/${curso?.id}`, {
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

    /*resolveModal = (args: any): void => {
        var inputValue = (<HTMLInputElement>document.getElementById("input-content")).value;
        console.log(inputValue);
        if (inputValue){
            this.activeModal.close(inputValue);
        }
        else{
            this.activeModal.close('');
        }
    }*/

    onModify(){
        console.log(this.grupo.atributos);
    }
}
