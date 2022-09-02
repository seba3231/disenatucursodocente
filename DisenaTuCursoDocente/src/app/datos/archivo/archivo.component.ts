import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TipoInput } from "src/app/enumerados/enums";
import { Ubicacion } from "src/app/modelos/schema.model";
import { DatoArchivo } from "src/app/modelos/schemaData.model";

export interface IntercambioArchivoComponent{
    datosGuardados:DatoArchivo | null;
    ubicacion:Ubicacion;
    indiceInstancia:number;
    tipoInput:TipoInput;
}


@Component({
    selector: 'app-archivo',
    templateUrl: './archivo.component.html',
})
export class ArchivoComponent {
    @Input() entrada!: IntercambioArchivoComponent;
    @Output() changeDetected = new EventEmitter<IntercambioArchivoComponent>();

    texto : string = '';

    constructor() { }

    ngOnInit(){
        if(this.entrada.datosGuardados?.texto){
            this.texto = this.entrada.datosGuardados?.texto;
        }
    }

    onFileSelected(event:any){
        //https://blog.angular-university.io/angular-file-upload/
        const file:File = event.target.files[0];

        if (file) {
            let fileName = file.name;
            if(!this.entrada.datosGuardados){
                let nuevoDato : DatoArchivo = {
                    texto : null,
                    fileName : fileName,
                    ruta : 'una_ruta'
                }
                this.entrada.datosGuardados = nuevoDato;
            }
            else{
                this.entrada.datosGuardados.fileName = fileName;
                this.entrada.datosGuardados.ruta = 'una_ruta';
            }
            this.changeDetected.emit(this.entrada)
        }
    }

    downloadFile(){
        console.log("TODO: Download File");
    }

    cambioEnTexto(inputElement:any){
        if(!this.entrada.datosGuardados){
            let nuevoDato : DatoArchivo = {
                texto : inputElement.value,
                fileName : null,
                ruta : null
            }
            this.entrada.datosGuardados = nuevoDato;
        }
        else{
            this.entrada.datosGuardados.texto = inputElement.value;
        }

        this.changeDetected.emit(this.entrada)
    }
}