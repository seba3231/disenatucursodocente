import { Component, OnInit, Input } from '@angular/core';
import { RegistrarDependencia } from '../atributo/atributo.component';
import { Grupo, Ubicacion } from '../modelos/schema.model';
import { SchemaSavedData } from '../modelos/schemaData.model';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-grupo',
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css'],
})
export class GrupoComponent implements OnInit {
    @Input() grupo!: Grupo;

    mapObservadorCambios : Map<string,RegistrarDependencia[]> = new Map();

    constructor(private modalService: NgbModal) {}

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

    openModal(){
        console.log("click")
        const modalRef = this.modalService.open(ModalComponent, {
            scrollable: false,
        });
        modalRef.componentInstance.tittle = 'Titulo';
        modalRef.componentInstance.body = 'Body';
        //Whenever modal is closed (Reject or Resolve), this Observable gets written
        modalRef.hidden.subscribe({
            next: () => {
                console.log('Hiden NEXT');
            },
            error: () => {
                //Nunca se llama aca
            },
        });
        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: (resp) => {
                console.log('Closed NEXT');
                console.log('Resolve: ' + resp);
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
