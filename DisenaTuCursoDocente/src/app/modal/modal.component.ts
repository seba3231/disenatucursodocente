import { Component, Input, OnInit, Output} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {ComentarioPrivado } from '../modelos/schema.model'


@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {
    @Input() tittle: string='';
    @Input() body: string='';
    @Input() inputDisclaimer: string='';
    @Input() comentariosPrivados!: [ComentarioPrivado];
    @Output() output: string='';
    
    list : any;
    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit(): void { 
        if(this.comentariosPrivados.length > 0){

        }
        
    }

    resolve() {
        var inputValue = (<HTMLInputElement>document.getElementById("input-content")).value;
        if (inputValue)
            this.output = inputValue;
        this.activeModal.close('Confirmar');
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
