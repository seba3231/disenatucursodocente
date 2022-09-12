import { Component, OnInit, Input } from '@angular/core';
import { RegistrarDependencia } from '../atributo/atributo.component';
import { Atributo, Grupo, Ubicacion } from '../modelos/schema.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ComentarioPrivado } from '../modelos/schema.model'
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';

@Component({
  selector: 'app-grupo',
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css'],
})
export class GrupoComponent implements OnInit {
    @Input() grupo!: Grupo;

    mapObservadorCambios : Map<string,RegistrarDependencia[]> = new Map();

    constructor(private modalService: NgbModal,
        public initialSchemaService : InitialSchemaLoaderService) {}

    ngOnInit(): void {}

    registrarDependencia(registroDependencia:RegistrarDependencia){
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

    informarCambio(cambioEnUbicacion:Ubicacion){
        let claveMap = this.objectToString(cambioEnUbicacion);
        let depdendencias = this.mapObservadorCambios.get(claveMap);
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
        const modalRef = this.modalService.open(ModalComentariosComponent, {
            scrollable: false,
        });
        modalRef.componentInstance.tittle = 'Agregar comentario';
        modalRef.componentInstance.inputDisclaimer = '*Los comentarios que ingreses aquí solo tú los veras';
        modalRef.componentInstance.comentariosPrivados = atributo.comentariosPrivados;
        //modalRef.componentInstance.resolveFunction = this.resolveModal;

        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: (resp) => {
                if (resp.length > 0){
                    console.log('comentario: ' + resp);
                    console.log(this.initialSchemaService.loadedData);
                    var today = new Date();
                    let autor = this.initialSchemaService.loadedData?.versiones.at(-1)?.autor;
                    let comentario : ComentarioPrivado = {
                        // autor : this.initialSchemaService.loadedData?.autor;
                        autor : autor,
                        fecha : today.getTime(),
                        valor : resp
                    }
                    atributo.comentariosPrivados.push(comentario)
                    console.log(atributo)
                }
                if (modalRef.componentInstance.comentariosPrivados){
                    atributo.comentariosPrivados = modalRef.componentInstance.comentariosPrivados
                    console.log(atributo)
                }
            },
            error: () => {
                //Nunca se llama aca
            },
        });
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
}
