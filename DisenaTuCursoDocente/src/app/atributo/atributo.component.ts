import { Component, Input } from '@angular/core';
import { Atributo, Dato, Opciones, Ubicacion } from '../modelos/schema.model';
import { DatosFijosService } from '../datos-fijos.service';
import { MapTipoInput, TipoInput } from '../enumerados/enums';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-atributo',
  templateUrl: './atributo.component.html',
  styleUrls: ['./atributo.component.css'],
})
export class AtributoComponent {
    @Input() atributo!: Atributo;
    mapTipoInput : Map<TipoInput, string>;
    enumTiposInput = TipoInput;
    cantidadInstancias:number = 1;
    
    mapOpcionesSelect : Map<Ubicacion,any> = new Map();

    constructor(private datosFijos: DatosFijosService) {

        this.mapTipoInput = MapTipoInput;
    }

    ngOnInit(){
        //Computo opciones de los Select del Atributo.
        for(let filaDatos of this.atributo.filasDatos){
            for(let dato of filaDatos.datos){
                if(dato.opciones){
                    if(dato.opciones.referencia){
                        //TODO: Proceso Datos de Usuario

                    }
                    else{
                        //Proceso Datos Fijos
                        const datosFijos = this.datosFijos.getDatosFijos();
                        const datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === dato.opciones.idGrupoDatoFijo);
                        for (const opcion of datoFijo?.opciones!) {
                            //TODO: Procesar muestroSi
                            let idDatoAbsoluto:number[] = [];
                            if(dato.ubicacion.idDato){
                                idDatoAbsoluto = [...dato.ubicacion.idDato];
                            }
                            idDatoAbsoluto.push(dato.id);
                            let hasKey = false;
                            for (const [key, value] of this.mapOpcionesSelect) {
                                if (key.idEtapa === dato.ubicacion.idEtapa
                                    && key.idGrupo === dato.ubicacion.idGrupo
                                    && key.idAtributo === dato.ubicacion.idAtributo
                                    && key.idDato.length === idDatoAbsoluto.length && key.idDato.every(function(value, index) { return value === idDatoAbsoluto[index]})
                                ){
                                    value.push (
                                        {
                                            string:opcion.valor,
                                            valor:{
                                                valorUsuario:null,
                                                valorFijo:{
                                                    idGrupo:datoFijo?.id,
                                                    idOpcion:opcion.id
                                                }
                                            }
                                        }
                                    )
                                    hasKey = true;
                                    break;
                                }
                            }
                            if(!hasKey){
                                this.mapOpcionesSelect.set(
                                    {
                                        idEtapa:dato.ubicacion.idEtapa,
                                        idGrupo:dato.ubicacion.idGrupo,
                                        idAtributo:dato.ubicacion.idAtributo,
                                        idDato:idDatoAbsoluto
                                    },
                                    [
                                        {
                                            string:opcion.valor,
                                            valor:{
                                                valorUsuario:null,
                                                valorFijo:{
                                                    idGrupo:datoFijo?.id,
                                                    idOpcion:opcion.id
                                                }
                                            }
                                        }
                                    ]
                                );
                            }
                        }
                    }
                }
            }
        }

        /*if(opciones.referencia){
            //Proceso Datos de Usuario
        }
        else{
            //Proceso Datos Fijos
            const datosFijos = this.datosFijos.getDatosFijos();
            const datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === opciones.idGrupoDatoFijo);
            for (const opcion of datoFijo?.opciones!) {
                //TODO: Procesar muestroSi
                retorno.push(
                    {
                        string:opcion.valor,
                        valor:{
                            valorUsuario:null,
                            valorFijo:{
                                idGrupo:datoFijo?.id,
                                idOpcion:opcion.id
                            }
                        }
                    }
                )
            }
        }*/
    }

    agregarInstanciaAtributo() {
        this.cantidadInstancias++;
    }

  parsearTipo(tipo: string) {
    //0: normal
    //1: select fijo
    //2: radio
    //3: select no fijo
    //poner todos los que hagan diferencia en el rendereo
    switch (tipo) {
      case 'selectFijoUnico':
        return [1, 'unico'];
        break;
      case 'selectFijoMultiple':
        return [1, 'multiple'];
        break;
      case 'radio':
        return [2, null];
      default:
        return [0, null];
        break;
    }
  }

    obtenerOpcionesFijas(idDatoFijo: number) {
        const datosFijos = this.datosFijos.getDatosFijos();
        const datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === idDatoFijo);
        const opciones = datoFijo?.opciones.map((opcion) => opcion.valor);
        return opciones;
    }

    addLinkHTML(string: string){
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return string.replace(urlRegex, function(url) {
            return '<a href="javascript:void">' + url + '</a>';
        })
    }
    
    obtenerOpciones(dato:Dato){
        let idDatoAbsoluto:number[] = [];
        if(dato.ubicacion.idDato){
            idDatoAbsoluto = [...dato.ubicacion.idDato];
        }
        idDatoAbsoluto.push(dato.id);
        for (const [key, value] of this.mapOpcionesSelect) {
            if (key.idEtapa === dato.ubicacion.idEtapa
                && key.idGrupo === dato.ubicacion.idGrupo
                && key.idAtributo === dato.ubicacion.idAtributo
                && key.idDato.length === idDatoAbsoluto.length && key.idDato.every(function(value, index) { return value === idDatoAbsoluto[index]})
            ){
                return value;
            }
        }
        console.log("No se enecontro array de opciones");
        return [];
    }

    a(ubicacion:Ubicacion,id:number){
        console.log(ubicacion,id);
        //console.log("opa");
    }
}
