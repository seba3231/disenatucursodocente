import { Component, Input, OnInit, Output} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {ComentarioPrivado } from '../../modelos/schema.model'


@Component({
    selector: 'app-modal-comentarios',
    templateUrl: './modal-comentarios.component.html',
    styleUrls: ['./modal-comentarios.component.css']
})
export class ModalComentariosComponent implements OnInit {
    @Input() tittle: string='';
    @Input() body: string='';
    @Input() inputDisclaimer: string='';
    @Input() comentariosPrivados!: [ComentarioPrivado];
    //@Input() resolveFunction: ((args: any) => void) | undefined;

    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit(): void { 
        if(this.comentariosPrivados.length > 0){
            console.log(this.comentariosPrivados)
        }
    }

    resolve() {
        /*if(this.resolveFunction){
            this.resolveFunction(null);
        }*/
        var inputValue = (<HTMLInputElement>document.getElementById("input-content")).value;
        console.log(inputValue);
        if (inputValue){
            this.activeModal.close(inputValue);
        }
        else{
            this.activeModal.close('');
        }
    }
    
    reject() {
        this.activeModal.dismiss('Cancelar');
    }

    quitarComentario(comentario: ComentarioPrivado){
        var index = this.comentariosPrivados.indexOf(comentario)
        // delete this.comentariosPrivados[index]
        this.comentariosPrivados.splice(index,  1);
    }
}
