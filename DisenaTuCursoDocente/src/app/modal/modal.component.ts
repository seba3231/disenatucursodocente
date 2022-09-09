import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {
    @Input() tittle: string='';
    @Input() body: string='';
    
    constructor(public activeModal: NgbActiveModal) { }

    ngOnInit(): void { }

    resolve() {
        this.activeModal.close('Text Resolve');
    }
    
    reject() {
        this.activeModal.dismiss('Text Reject');
    }
}
