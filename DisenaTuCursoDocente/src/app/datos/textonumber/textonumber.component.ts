import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { TipoInput } from "src/app/enumerados/enums";
import { Dato, Ubicacion } from "src/app/modelos/schema.model";

export interface IntercambioTextNumberComponent{
    datoGuardado: string | null;
    ubicacion:Ubicacion;
    indiceInstancia:number;
    tipoInput:TipoInput;
    deshabilitado:boolean;
    dato:Dato;
}

@Component({
    selector: 'app-textonumber',
    templateUrl: './textonumber.component.html',
})
export class TextoNumberComponent {
    @Input() entrada!: IntercambioTextNumberComponent;
    @Output() changeDetected = new EventEmitter<IntercambioTextNumberComponent>();
    
    valorDato : string = '';

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {
        if(changes?.['entrada'].currentValue.datoGuardado !== null){
            this.valorDato = changes?.['entrada'].currentValue.datoGuardado;
            this.changeDetected.emit(this.entrada);
        }
        else{
            this.valorDato = '';
        }
        
    }

    cambioEnValor(nuevoValor:any){
        this.entrada.datoGuardado = nuevoValor.value;
        if(nuevoValor.value.length === 0){
            this.entrada.datoGuardado = null;
        }
        this.changeDetected.emit(this.entrada);
    }
}