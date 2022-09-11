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
            // let list : any = {
            //     // autor : this.initialSchemaService.loadedData?.autor;
            //     autor : null,
            //     fecha : null,
            //     valor : null,

            // }
            
            console.log(this.comentariosPrivados)
        }
        
    }

    resolve() {
        var inputValue = (<HTMLInputElement>document.getElementById("input-content")).value;
        console.log(inputValue)
        if (inputValue)
            this.output = inputValue;
        console.log(this.output)
        this.activeModal.close('Confirmar');
    }
    
    reject() {
        this.activeModal.dismiss('Cancelar');
    }
}
