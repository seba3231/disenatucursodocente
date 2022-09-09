import { Component, OnInit, Input } from '@angular/core';
import { RegistrarDependencia } from '../atributo/atributo.component';
import { Grupo, Ubicacion } from '../modelos/schema.model';
import { SchemaSavedData } from '../modelos/schemaData.model';

@Component({
  selector: 'app-grupo',
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css'],
})
export class GrupoComponent implements OnInit {
    @Input() grupo!: Grupo;

    mapObservadorCambios : Map<string,RegistrarDependencia[]> = new Map();

    constructor() {}

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
}
