import { Component, OnInit, Input } from '@angular/core';
import { RegistrarDependencia } from '../atributo/atributo.component';
import { Atributo, Grupo, Ubicacion } from '../modelos/schema.model';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modal/modal.component';
import { SchemaSavedData } from '../modelos/schemaData.model';
import {ComentarioPrivado } from '../modelos/schema.model'
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';

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
        const modalRef = this.modalService.open(ModalComponent, {
            scrollable: false,
        });
        modalRef.componentInstance.tittle = 'Agregar comentario';
        modalRef.componentInstance.inputDisclaimer = '*Los comentarios que ingreses aquí solo tú los veras'
        modalRef.componentInstance.comentariosPrivados = atributo.comentariosPrivados
        //Whenever modal is closed (Reject or Resolve), this Observable gets written
        modalRef.hidden.subscribe({
            next: () => {
                console.log('Hiden NEXT ');
            },
            error: () => {
                //Nunca se llama aca
            },
        });
        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: (resp) => {
                if (modalRef.componentInstance.output.length > 0){
                    console.log('comentario: ' + modalRef.componentInstance.output);
                    console.log(this.initialSchemaService.loadedData)
                   var today = new Date();
                    let comentario : ComentarioPrivado = {
                        // autor : this.initialSchemaService.loadedData?.autor;
                        autor : this.initialSchemaService.loadedData?.autor?.toString(),
                        fecha : today.getTime(),
                        valor : modalRef.componentInstance.output
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
        //Control Reject with Observable
        modalRef.dismissed.subscribe({
            next: (resp) => {
                console.log('Dismissed NEXT');
                console.log('Reject: ' + this.getDismissReason(resp));
            },
            error: () => {
                //Nunca se llama aca
            },
        });
    }

    private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return 'by pressing ESC';
        }
        else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return 'by clicking on a backdrop';
        }
        else {
            return `by custom reason, ${reason}`;
        }
    }
}
