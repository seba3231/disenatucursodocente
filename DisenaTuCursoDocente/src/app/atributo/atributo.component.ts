import { Component, Input } from '@angular/core';
import { Atributo, Dato, DependenciaDeDatos, Ubicacion } from '../modelos/schema.model';
import { DatosFijosService } from '../datos-fijos.service';
import { MapTipoInput, MapTipoInputHTML, TipoInput, TwoWayMap } from '../enumerados/enums';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { InformacionGuardada, ValoresDato } from '../modelos/schemaData.model';
import { FormControl, Validators } from '@angular/forms';
import { IntercambioArchivoComponent } from '../datos/archivo/archivo.component';
import { IntercambioTextNumberComponent } from '../datos/textonumber/textonumber.component';

declare var bootstrap: any;

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

    datoGuardado:InformacionGuardada | undefined;
    
    mapOpcionesSelect : Map<string,any> = new Map();
    mapOpcionSeleccionada : Map<string,number> = new Map();
    mapControlesCampos : Map<string,FormControl> = new Map();

    constructor(private datosFijos: DatosFijosService,
        private initialSchemaService : InitialSchemaLoaderService) {
        
        this.mapTipoInput = MapTipoInput;
        this.mapTipoInputHTML = MapTipoInputHTML;
    }

    ngAfterViewInit(){
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    }

    ngOnInit(){
        //Veo cuantas instancias de este atributo hay y cargo los Datos guardados de este Atributo
        if(this.initialSchemaService.loadedData && this.initialSchemaService.loadedData.datosGuardados){
            for(let datoGuardado of this.initialSchemaService.loadedData.datosGuardados){
                
                if (datoGuardado.ubicacionAtributo.idEtapa === this.atributo.ubicacion.idEtapa
                    && datoGuardado.ubicacionAtributo.idGrupo === this.atributo.ubicacion.idGrupo
                    && datoGuardado.ubicacionAtributo.idAtributo === this.atributo.id
                ){
                    this.datoGuardado = datoGuardado;
                    this.cantidadInstancias = datoGuardado.cantidadInstancias;
                }
            }
        }

        //Computo opciones de los Select del Atributo.
        for(let filaDatos of this.atributo.filasDatos){
            for(let dato of filaDatos.datos){
                if(dato.opciones){
                    if(dato.opciones.referencia){
                        
                        //Busco en los datos guardados la Ubicación dato.opciones.referencia
                        if(this.initialSchemaService.loadedData && this.initialSchemaService.loadedData.datosGuardados){
                            for(let datoGuardado of this.initialSchemaService.loadedData.datosGuardados){
                                
                                if (datoGuardado.ubicacionAtributo.idEtapa === dato.opciones.referencia.idEtapa
                                    && datoGuardado.ubicacionAtributo.idGrupo === dato.opciones.referencia.idGrupo
                                    && datoGuardado.ubicacionAtributo.idAtributo === dato.opciones.referencia.idAtributo
                                ){
                                    //Encontré el Atributo, busco el idDato
                                    for(let valorAtributo of datoGuardado.valoresAtributo){
                                        if(valorAtributo.idDato.length === dato.opciones.referencia.idDato.length && valorAtributo.idDato.every(function(value, index) { return value === dato.opciones.referencia.idDato[index]})){
                                            
                                            let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
                                            let claveMap = this.objectToString(ubicacionAbsoluta);

                                            for(let [index,valorDato] of valorAtributo.valoresDato.entries()){
                                                let stringOpcion = 'Nombre de tema no asignado';
                                                if(valorDato.string){
                                                    stringOpcion = valorDato.string;
                                                }
                                                let retrievedValue = this.mapOpcionesSelect.get(claveMap);
                                                if(retrievedValue){
                                                    //Si ya existe la key en el map, agrego una opción al array de opciones
                                                    retrievedValue.push(
                                                        {
                                                            string:stringOpcion,
                                                            muestroSi:null,
                                                            valor:{
                                                                valorUsuario:{
                                                                    indiceInstancia: index
                                                                },
                                                                valorFijo:null
                                                            }
                                                        }
                                                    )
                                                }
                                                else{
                                                    //Si no existe la key en el map
                                                    this.mapOpcionesSelect.set(
                                                        claveMap,
                                                        [
                                                            {
                                                                string:stringOpcion,
                                                                muestroSi:null,
                                                                valor:{
                                                                    valorUsuario:{
                                                                        indiceInstancia: index
                                                                    },
                                                                    valorFijo:null
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
                    }
                    else{
                        //Proceso Datos Fijos
                        const datosFijos = this.datosFijos.getDatosFijos();
                        const datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === dato.opciones.idGrupoDatoFijo);
                        let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
                        let claveMap = this.objectToString(ubicacionAbsoluta);

                        for (const opcion of datoFijo?.opciones!) {
                            
                            let retrievedValue = this.mapOpcionesSelect.get(claveMap);
                            if(retrievedValue){
                                //Si ya existe la key en el map, agrego una opción al array de opciones
                                retrievedValue.push(
                                    {
                                        string:opcion.valor,
                                        muestroSi:opcion.muestroSi,
                                        valor:{
                                            valorUsuario:null,
                                            valorFijo:{
                                                idOpcion:opcion.id
                                            }
                                        }
                                    }
                                )
                            }
                            else{
                                //Si no existe la key en el map
                                this.mapOpcionesSelect.set(
                                    claveMap,
                                    [
                                        {
                                            string:opcion.valor,
                                            muestroSi:opcion.muestroSi,
                                            valor:{
                                                valorUsuario:null,
                                                valorFijo:{
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
        for(let datoDentroAtributo of this.datoGuardado!.valoresAtributo!){
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
        this.datoGuardado!.cantidadInstancias = this.cantidadInstancias;
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

            if(value !== undefined){
                return dependencia.valorSeleccionado.idOpcion !== value;
            }
            return true;
        }
        return false;
    }

    guardarCambio(ubicacion:Ubicacion,indice:number,tipoInput:TipoInput,nuevoValor:any){
        
        if(this.datoGuardado!.valoresAtributo){
            for(let valoresDato of this.datoGuardado!.valoresAtributo){

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
                            let control = this.getFormControl(ubicacion);
                            if(!control?.invalid){
                                valoresDato.valoresDato[indice].number = Number(nuevoValor.value);
                            }
                            else{
                                valoresDato.valoresDato[indice].number = null;
                            }
                            break;
                        }
                        case TipoInput.selectFijoUnico:
                        //Una vez que matchea una opcion, ejecuta codigo hasta encontrar un break
                        //Osea, selectFijoUnico ejecuta el mismo codigo que radio
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
                                valoresDato.valoresDato[indice].selectFijo![0] = valueObject.valorFijo.idOpcion;
                            }
                            else{
                                
                                valoresDato.valoresDato[indice].selectFijo = [valueObject.valorFijo.idOpcion]
                            }
                            break;
                        }
                        case TipoInput.selectFijoMultiple:{
                            if(nuevoValor.value.length === 0){
                                valoresDato.valoresDato[indice].selectFijo = null;
                            }
                            else{
                                let valoresAGuardar = [];
                                for(let valor of nuevoValor.value){
                                    valoresAGuardar.push(valor.valorFijo.idOpcion)
                                }
                                valoresDato.valoresDato[indice].selectFijo = valoresAGuardar;
                            }
                            break;
                        }
                        case TipoInput.selectUsuarioMultiple:{

                            if(nuevoValor.value.length === 0){
                                valoresDato.valoresDato[indice].selectUsuario = null;
                            }
                            else{
                                let valoresAGuardar = [];
                                for(let valor of nuevoValor.value){
                                    valoresAGuardar.push(valor.valorUsuario.indiceInstancia)
                                }
                                valoresDato.valoresDato[indice].selectUsuario = valoresAGuardar;
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
        console.log(this.datoGuardado!.valoresAtributo);
    }

    cargarInfoPrevia(ubicacion:Ubicacion, indice:number, tipoInput: TipoInput, posibleValor:any) : any {
        if(this.datoGuardado!.valoresAtributo){
            for(let valoresDato of this.datoGuardado!.valoresAtributo){

                if(valoresDato.idDato.length === ubicacion.idDato.length && valoresDato.idDato.every(function(value, index) { return value === ubicacion.idDato[index]})){
                    switch (tipoInput) {
                        case TipoInput.text:{
                            let entradaTextNumber : IntercambioTextNumberComponent = {
                                datoGuardado : valoresDato.valoresDato[indice].string,
                                ubicacion : ubicacion,
                                indiceInstancia : indice,
                                tipoInput : tipoInput,
                                deshabilitado: this.estaDeshabilitado(posibleValor.habilitadoSi),
                                dato: posibleValor
                            }
                            return entradaTextNumber;
                            //return valoresDato.valoresDato[indice].string;
                        }
                        case TipoInput.number:{
                            let valor = null;
                            if(valoresDato.valoresDato[indice].number){
                                valor = valoresDato.valoresDato[indice].number?.toString();
                            }
                            let entradaTextNumber : IntercambioTextNumberComponent = {
                                datoGuardado : valor === undefined ? null : valor,
                                ubicacion : ubicacion,
                                indiceInstancia : indice,
                                tipoInput : tipoInput,
                                deshabilitado: this.estaDeshabilitado(posibleValor.habilitadoSi),
                                dato: posibleValor
                            }
                            return entradaTextNumber;
                            //return valoresDato.valoresDato[indice].number;
                        }
                        case TipoInput.selectFijoUnico:{
                            
                            let estaOpcionEstaSeleccionada = false;

                            if(this.atributo.multiInstanciable){
                                if(valoresDato.valoresDato[indice].selectFijo){
                                    estaOpcionEstaSeleccionada = posibleValor.valorFijo.idOpcion === valoresDato.valoresDato[indice].selectFijo![0];
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
                                        estaOpcionEstaSeleccionada = posibleValor.valorFijo.idOpcion === valoresDato.valoresDato[indice].selectFijo![0];
                                        if(estaOpcionEstaSeleccionada){
                                            this.mapOpcionSeleccionada.set(
                                                key,
                                                posibleValor.valorFijo.idOpcion
                                            );
                                        }
                                    }
                                    else{
                                        //Si nunca se guardó valor, guardo el primero y lo seteo como seleccionado
                                        valoresDato.valoresDato[indice].selectFijo = [posibleValor.valorFijo.idOpcion];
                                        this.mapOpcionSeleccionada.set(
                                            key,
                                            posibleValor.valorFijo.idOpcion
                                        );
                                    }
                                }
                            }
                            
                            return estaOpcionEstaSeleccionada;
                        }
                        case TipoInput.selectFijoMultiple:{
                            if(valoresDato.valoresDato[indice].selectFijo){
                                return valoresDato.valoresDato[indice].selectFijo;
                            } 
                            return [];
                        }
                        case TipoInput.radio:{

                            let estaOpcionEstaSeleccionada = false;
                            if(valoresDato.valoresDato[indice].selectFijo){
                                estaOpcionEstaSeleccionada = posibleValor.valorFijo.idOpcion === valoresDato.valoresDato[indice].selectFijo![0];
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
                        case TipoInput.archivo:{
                            let entradaArchivo: IntercambioArchivoComponent = {
                                datoGuardado : valoresDato.valoresDato[indice].archivo,
                                ubicacion : ubicacion,
                                indiceInstancia : indice,
                                tipoInput : tipoInput
                            }
                            return entradaArchivo;
                        }
                        default:
                            return "null_default";
                    }
                }
            }
        }
        return "null_fin";
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

    getFormControl(ubicacion:Ubicacion){
        let value = this.mapControlesCampos.get(this.objectToString(ubicacion));
        return value;
    }

    handleChange(cambio:any){
        if(this.datoGuardado!.valoresAtributo){
            for(let valoresDato of this.datoGuardado!.valoresAtributo){
                if(valoresDato.idDato.length === cambio.ubicacion.idDato.length && valoresDato.idDato.every(function(value, index) { return value === cambio.ubicacion.idDato[index]})){
                    switch (cambio.tipoInput) {
                        case TipoInput.text:{
                            valoresDato.valoresDato[cambio.indiceInstancia].string = cambio.datoGuardado;
                            break;
                        }
                        case TipoInput.number:{
                            valoresDato.valoresDato[cambio.indiceInstancia].number = Number(cambio.datoGuardado);
                            break;
                        }
                        case TipoInput.archivo:{
                            valoresDato.valoresDato[cambio.indiceInstancia].archivo = cambio.datoGuardado;
                            break;
                        }
                        default:
                            break;
                    }
                }
            }
        }
        console.log("Vals de Atrib");
        console.log(this.datoGuardado!.valoresAtributo);
    }

    compareObjects(a:any,b:any) : boolean{
        return a.valorFijo.idOpcion === b;
    }
}
