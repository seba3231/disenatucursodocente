import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-modal',
    templateUrl: './modal-confirmacion.component.html',
    styleUrls: ['./modal-confirmacion.component.css']
})
export class ModalConfirmacionComponent implements OnInit {
    @Input() tittle: string='';
    @Input() body: string='';
    
    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit(): void { }

    resolve() {
        this.activeModal.close(null);
    }
    
    reject() {
        this.activeModal.dismiss(null);
    }
}
