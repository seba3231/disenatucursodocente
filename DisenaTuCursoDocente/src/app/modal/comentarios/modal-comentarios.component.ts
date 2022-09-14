import { Component, Input, OnInit, Output} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {ComentarioPrivado } from '../../modelos/schema.model'


@Component({
    selector: 'app-modal-comentarios',
    templateUrl: './modal-comentarios.component.html',
    styleUrls: ['./modal-comentarios.component.css'],
})
export class ModalComentariosComponent implements OnInit {
    @Input() tittle: string='';
    @Input() body: string='';
    @Input() inputDisclaimer: string[] = [];
    @Input() comentariosPrivados!: ComentarioPrivado[];
    @Output() salida: string[]=[];
    //@Input() resolveFunction: ((args: any) => void) | undefined;

    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit(): void { 
        console.log(this.inputDisclaimer)
    }

    resolve() {
        /*if(this.resolveFunction){
            this.resolveFunction(null);
        }*/
        for(let i = 0; i < this.inputDisclaimer.length; i++){
            let inputValue: HTMLInputElement | null;
            inputValue = document.querySelector("#input-content_"+i);
            if (inputValue)
                this.salida.push(inputValue.value)
        }

        this.activeModal.close(this.salida);
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
