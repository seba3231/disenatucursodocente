import { Component, Input } from '@angular/core';
import { Atributo, Dato, Ubicacion } from '../modelos/schema.model';
import { DatosFijosService } from '../datos-fijos.service';
import { MapTipoInput, TipoInput, TwoWayMap } from '../enumerados/enums';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { ValoresAtributo, ValoresDato } from '../modelos/schemaData.model';

@Component({
  selector: 'app-atributo',
  templateUrl: './atributo.component.html',
  styleUrls: ['./atributo.component.css'],
})
export class AtributoComponent {
    @Input() atributo!: Atributo;
    mapTipoInput : TwoWayMap<TipoInput, string>;
    enumTiposInput = TipoInput;

    cantidadInstancias:number = 1;
    valoresAtributo:ValoresAtributo[] | undefined;
    
    mapOpcionesSelect : Map<Ubicacion,any> = new Map();

    constructor(private datosFijos: DatosFijosService,
        private initialSchemaService : InitialSchemaLoaderService) {

        this.mapTipoInput = MapTipoInput;
    }

    ngOnInit(){
        //Veo cuantas instancias de este atributo hay y cargo los Datos de este Atributo
        if(this.initialSchemaService.loadedData && this.initialSchemaService.loadedData.datosGuardados){
            for(let datoGuardado of this.initialSchemaService.loadedData.datosGuardados){
                
                if (datoGuardado.ubicacionAtributo.idEtapa === this.atributo.ubicacion.idEtapa
                    && datoGuardado.ubicacionAtributo.idGrupo === this.atributo.ubicacion.idGrupo
                    && datoGuardado.ubicacionAtributo.idAtributo === this.atributo.id
                ){
                    this.cantidadInstancias = datoGuardado.cantidadInstancias;
                    this.valoresAtributo = datoGuardado.valoresAtributo;
                }
            }
        }

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
                            let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
                            let hasKey = false;
                            for (const [key, value] of this.mapOpcionesSelect) {
                                if (key.idEtapa === ubicacionAbsoluta.idEtapa
                                    && key.idGrupo === ubicacionAbsoluta.idGrupo
                                    && key.idAtributo === ubicacionAbsoluta.idAtributo
                                    && key.idDato.length === ubicacionAbsoluta.idDato.length && key.idDato.every(function(value, index) { return value === ubicacionAbsoluta.idDato[index]})
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
                                        idEtapa:ubicacionAbsoluta.idEtapa,
                                        idGrupo:ubicacionAbsoluta.idGrupo,
                                        idAtributo:ubicacionAbsoluta.idAtributo,
                                        idDato:ubicacionAbsoluta.idDato
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
    }

    agregarInstanciaAtributo() {        
        for(let datoDentroAtributo of this.valoresAtributo!){
            let nuevoValorDato : ValoresDato = {
                string:null,
                number:null,
                selectFijo:null,
                selectUsuario:null,
                archivo:null,
                date:null
            }
            datoDentroAtributo.valoresDato.push(nuevoValorDato);
        }
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
        let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
        for (const [key, value] of this.mapOpcionesSelect) {
            if (key.idEtapa === ubicacionAbsoluta.idEtapa
                && key.idGrupo === ubicacionAbsoluta.idGrupo
                && key.idAtributo === ubicacionAbsoluta.idAtributo
                && key.idDato.length === ubicacionAbsoluta.idDato.length && key.idDato.every(function(value, index) { return value === ubicacionAbsoluta.idDato[index]})
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

    cargarInfoPrevia(ubicacion:Ubicacion, indice:number, tipoInput: TipoInput){
        if(this.valoresAtributo){
            for(let valoresDato of this.valoresAtributo){

                if(valoresDato.idDato.length === ubicacion.idDato.length && valoresDato.idDato.every(function(value, index) { return value === ubicacion.idDato[index]})){
                    switch (tipoInput) {
                        case TipoInput.text:
                            return valoresDato.valoresDato[indice].string;
                        case TipoInput.number:
                            return valoresDato.valoresDato[indice].number;
                        case TipoInput.selectFijoUnico:
                            if(valoresDato.valoresDato[indice].selectFijo){
                                return valoresDato.valoresDato[indice].selectFijo![0].idOpcion-1;
                            }
                            else{
                                return 0;
                            }
                        default:
                            return "null";
                    }
                }
            }
        }
        /*if(this.initialSchemaService.loadedData && this.initialSchemaService.loadedData.datosGuardados){
            for(let datoGuardado of this.initialSchemaService.loadedData.datosGuardados){
                
                if (datoGuardado.ubicacionAtributo.idEtapa === ubicacion.idEtapa
                    && datoGuardado.ubicacionAtributo.idGrupo === ubicacion.idGrupo
                    && datoGuardado.ubicacionAtributo.idAtributo === ubicacion.idAtributo
                ){
                    for(let valoresDato of datoGuardado.valoresAtributo){

                        if(valoresDato.idDato.length === ubicacion.idDato.length && valoresDato.idDato.every(function(value, index) { return value === ubicacion.idDato[index]})){
                            switch (tipoInput) {
                                case TipoInput.text:
                                    return valoresDato.valoresDato[indice].string;
                                case TipoInput.number:
                                    return valoresDato.valoresDato[indice].number;
                                case TipoInput.selectFijoUnico:
                                    if(valoresDato.valoresDato[indice].selectFijo){
                                        return valoresDato.valoresDato[indice].selectFijo[0].idOpcion-1;
                                    }
                                    else{
                                        return 0;
                                    }
                                default:
                                    return "null";
                            }
                        }
                    }
                }
            }
        }*/
        return "null_fin";
    }

    computoUbicacionAbsoluta(ubicacion:Ubicacion,id:number) : Ubicacion {
        let idDatoAbsoluto:number[] = [];
        if(ubicacion.idDato){
            idDatoAbsoluto = [...ubicacion.idDato];
        }
        idDatoAbsoluto.push(id);
        return {
            idEtapa : ubicacion.idEtapa,
            idGrupo : ubicacion.idGrupo,
            idAtributo : ubicacion.idAtributo,
            idDato : idDatoAbsoluto
        }
    }
}
