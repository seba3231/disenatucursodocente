import { Component, EventEmitter, Input } from '@angular/core';
import { Atributo, Dato, DependenciaDeDatos, Ubicacion } from '../modelos/schema.model';
import { DatosFijosService } from '../datos-fijos.service';
import { MapTipoInput, MapTipoInputHTML, TipoInput, TwoWayMap } from '../enumerados/enums';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { ValoresAtributo, ValoresDato } from '../modelos/schemaData.model';
import { AnonymousSubject } from 'rxjs/internal/Subject';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-atributo',
  templateUrl: './atributo.component.html',
  styleUrls: ['./atributo.component.css'],
})
export class AtributoComponent {
    @Input() atributo!: Atributo;
    
    mapTipoInput : TwoWayMap<TipoInput, string>;
    mapTipoInputHTML : Map<TipoInput, string>;
    enumTiposInput = TipoInput;
    cantidadInstancias:number = 1;

    selectedObject:any;

    valoresAtributo:ValoresAtributo[] | undefined;
    
    mapOpcionesSelect : Map<string,any> = new Map();
    mapOpcionSeleccionada : Map<string,number> = new Map();
    mapControlesCampos : Map<string,FormControl> = new Map();

    constructor(private datosFijos: DatosFijosService,
        private initialSchemaService : InitialSchemaLoaderService) {
        
        this.mapTipoInput = MapTipoInput;
        this.mapTipoInputHTML = MapTipoInputHTML;
    }

    ngOnInit(){

        //Veo cuantas instancias de este atributo hay y cargo los Datos guardados de este Atributo
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
                            let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
                            let retrievedValue = this.mapOpcionesSelect.get(this.objectToString(ubicacionAbsoluta));
                            if(retrievedValue){
                                //Si ya existe la key en el map, agrego una opción al array de opciones
                                retrievedValue.push(
                                    {
                                        string:opcion.valor,
                                        muestroSi:opcion.muestroSi,
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
                            else{
                                //Si no existe la key en el map
                                this.mapOpcionesSelect.set(
                                    this.objectToString(ubicacionAbsoluta),
                                    [
                                        {
                                            string:opcion.valor,
                                            muestroSi:opcion.muestroSi,
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

    muestroOpcion(muestroSi:DependenciaDeDatos){
        if(muestroSi){
            let clave = this.objectToString(muestroSi.referencia);
            let opcionSeleccionada = this.mapOpcionSeleccionada.get(clave);
            if(opcionSeleccionada !== undefined){

                return opcionSeleccionada === muestroSi.valorSeleccionado.idOpcion
            }
        }
        return true;
    }

    estaDeshabilitado(dependencia:DependenciaDeDatos){
        if(dependencia){
            let key = this.objectToString(dependencia.referencia);
            let value = this.mapOpcionSeleccionada.get(key);
            
            //Checkeo que solo se compute una vez este codigo
            if(value !== undefined){
                return dependencia.valorSeleccionado.idOpcion !== value;
            }
            return true;
        }
        return false;
    }

    guardarCambio(ubicacion:Ubicacion,indice:number,tipoInput:TipoInput,nuevoValor:any){
        
        if(this.valoresAtributo){
            for(let valoresDato of this.valoresAtributo){

                if(valoresDato.idDato.length === ubicacion.idDato.length && valoresDato.idDato.every(function(value, index) { return value === ubicacion.idDato[index]})){
                    switch (tipoInput) {
                        case TipoInput.text:{
                            valoresDato.valoresDato[indice].string = nuevoValor.value;
                            break;
                        }
                        case TipoInput.number:{
                            valoresDato.valoresDato[indice].number = Number(nuevoValor.value);
                            break;
                        }
                        case TipoInput.porcentaje:{
                            let control = this.getControl(ubicacion);
                            if(!control?.invalid){
                                valoresDato.valoresDato[indice].number = Number(nuevoValor.value);
                            }
                            else{
                                valoresDato.valoresDato[indice].number = null;
                            }
                            break;
                        }
                        /*case TipoInput.selectFijoUnico | TipoInput.radio:{
                            //Actualizo control interno
                            if(!this.atributo.multiInstanciable){
                                let clave = this.objectToString(ubicacion);
                                let valor = nuevoValor.selectedIndex;
                                this.mapOpcionSeleccionada.set(
                                    clave,
                                    valor
                                );
                                
                            }
                            //Actualizo datos guardados en archivo
                            let valueObject = this.stringToObject(nuevoValor.value);
                            if(valoresDato.valoresDato[indice].selectFijo){
                                valoresDato.valoresDato[indice].selectFijo![0].idOpcion = valueObject.valorFijo.idOpcion;
                            }
                            else{
                                valoresDato.valoresDato[indice].selectFijo = [{
                                    idGrupo:0,
                                    idOpcion:valueObject.valorFijo.idOpcion
                                }]
                            }
                            break;
                        }*/
                        case TipoInput.selectFijoUnico://
                        case TipoInput.radio:{
                            let valueObject = this.stringToObject(nuevoValor.value);
                            //Actualizo control interno
                            if(!this.atributo.multiInstanciable){
                                let clave = this.objectToString(ubicacion);
                                this.mapOpcionSeleccionada.set(
                                    clave,
                                    valueObject.valorFijo.idOpcion
                                );
                            }

                            //Actualizo datos guardados en archivo
                            if(valoresDato.valoresDato[indice].selectFijo){
                                valoresDato.valoresDato[indice].selectFijo![0].idOpcion = valueObject.valorFijo.idOpcion;
                            }
                            else{
                                valoresDato.valoresDato[indice].selectFijo = [{
                                    idGrupo:0,
                                    idOpcion:valueObject.valorFijo.idOpcion
                                }]
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }
            }
        }
        /*console.log("Todos los val");
        console.log(this.initialSchemaService.loadedData);*/
        console.log("Vals de Atrib");
        console.log(this.valoresAtributo);
    }

    cargarInfoPrevia(ubicacion:Ubicacion, indice:number, tipoInput: TipoInput, posibleValor:any) : any{
        if(this.valoresAtributo){
            for(let valoresDato of this.valoresAtributo){

                if(valoresDato.idDato.length === ubicacion.idDato.length && valoresDato.idDato.every(function(value, index) { return value === ubicacion.idDato[index]})){
                    switch (tipoInput) {
                        case TipoInput.text:{
                            return valoresDato.valoresDato[indice].string;
                        }
                        case TipoInput.number:{
                            return valoresDato.valoresDato[indice].number;
                        }
                        case TipoInput.selectFijoUnico:{
                                                 
                            let indiceRetorno=0;

                            if(this.atributo.multiInstanciable){
                                if(valoresDato.valoresDato[indice].selectFijo){
                                    indiceRetorno = valoresDato.valoresDato[indice].selectFijo![0].idOpcion;
                                }
                            }
                            else{
                                let key = this.objectToString({
                                    idEtapa:this.atributo.ubicacion.idEtapa,
                                    idGrupo:this.atributo.ubicacion.idGrupo,
                                    idAtributo:this.atributo.id,
                                    idDato:ubicacion.idDato
                                });
                                let value = this.mapOpcionSeleccionada.get(key);
                                //Checkeo que solo se compute una vez este codigo
                                if(value === undefined){
                                    if(valoresDato.valoresDato[indice].selectFijo){
                                        indiceRetorno = valoresDato.valoresDato[indice].selectFijo![0].idOpcion;
                                    }
                                    this.mapOpcionSeleccionada.set(
                                        key,
                                        indiceRetorno
                                    );
                                }
                                else{
                                    indiceRetorno = value;
                                }
                            }
                            
                            return indiceRetorno;
                        }
                        case TipoInput.radio:{

                            let estaOpcionEstaSeleccionada = false;
                            if(valoresDato.valoresDato[indice].selectFijo){
                                estaOpcionEstaSeleccionada = posibleValor.valorFijo.idOpcion === valoresDato.valoresDato[indice].selectFijo![0].idOpcion;
                            }
                            if(estaOpcionEstaSeleccionada && !this.atributo.multiInstanciable){
                                let key = this.objectToString({
                                    idEtapa:this.atributo.ubicacion.idEtapa,
                                    idGrupo:this.atributo.ubicacion.idGrupo,
                                    idAtributo:this.atributo.id,
                                    idDato:ubicacion.idDato
                                });
                                let value = this.mapOpcionSeleccionada.get(key);
                                if(value === undefined){
                                    this.mapOpcionSeleccionada.set(
                                        key,
                                        posibleValor.valorFijo.idOpcion
                                    );
                                }
                            }
                            return estaOpcionEstaSeleccionada;
                        }
                        
                        case TipoInput.porcentaje:{
                            let key = this.objectToString({
                                idEtapa:this.atributo.ubicacion.idEtapa,
                                idGrupo:this.atributo.ubicacion.idGrupo,
                                idAtributo:this.atributo.id,
                                idDato:ubicacion.idDato
                            });
                            let value = this.mapControlesCampos.get(key);
                            //Checkeo que solo se compute una vez este codigo
                            if(value === undefined){
                                this.mapControlesCampos.set(
                                    key,
                                    new FormControl(
                                        {
                                            value: 0,
                                            disabled: false
                                        },
                                        { 
                                            validators: [
                                                Validators.min(0),
                                                Validators.max(100)
                                            ]
                                        }
                                    )
                                );
                            }
                            return this.mapControlesCampos.get(key);
                        }
                        default:
                            return "null";
                    }
                }
            }
        }
        return "";
    }

    addLinkHTML(string: string){
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return string.replace(urlRegex, function(url) {
            return '<a href="javascript:void">' + url + '</a>';
        })
    }
    
    obtenerOpciones(dato:Dato){
        
        let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
        let opciones = this.mapOpcionesSelect.get(this.objectToString(ubicacionAbsoluta));
        if(opciones !== null){
            return opciones;
        }
        console.log("No se enecontro array de opciones");
        return [];
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

    objectToString(obj:any){
        return JSON.stringify(obj);
    }

    stringToObject(string:string){
        return JSON.parse(string);
    }

    getControl(ubicacion:Ubicacion){
        let value = this.mapControlesCampos.get(this.objectToString(ubicacion));
        return value;
    }
}
