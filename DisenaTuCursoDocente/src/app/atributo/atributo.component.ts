import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Atributo, Computo, DependenciaDeDatos, Ubicacion } from '../modelos/schema.model';
import { MapTipoInput, MapTipoInputHTML, TipoInput, TwoWayMap } from '../enumerados/enums';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { InformacionGuardada, ValoresDato, Version } from '../modelos/schemaData.model';
import { FormControl, Validators } from '@angular/forms';
import { IntercambioArchivoComponent } from '../datos/archivo/archivo.component';
import { IntercambioTextNumberComponent } from '../datos/textonumber/textonumber.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalConfirmacionComponent } from '../modal/confirmacion/modal-confirmacion.component';
import { _countGroupLabelsBeforeOption } from '@angular/material/core';

declare var bootstrap: any;

export interface RegistrarDependencia{
    interesado:Ubicacion;
    observado:Ubicacion;
    interesadoEscucha:EventEmitter<any>;
}
export interface ValorComputado{
    valor:number;
    op1:ComputoValorUbicacion|number;
    op2:ComputoValorUbicacion|number;
    operacion:string;
}
export interface ComputoValorUbicacion{
    claveUbicacion:string;
    valor:number;
}
export interface ValorSelect{
    string:string;
    muestroSi:DependenciaDeDatos|null;
    //En caso de Select de Usuario: indica el indice de instancia
    //En caso de Select Fijo: indica el idOpcion
    valor:number|null;
}

@Component({
  selector: 'app-atributo',
  templateUrl: './atributo.component.html',
  styleUrls: ['./atributo.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AtributoComponent {
    @Input() atributo!: Atributo;
    @Output() registrarDependencia = new EventEmitter<RegistrarDependencia>();
    @Output() informarCambio = new EventEmitter<Ubicacion>();
    
    mapTipoInput : TwoWayMap<TipoInput, string>;
    mapTipoInputHTML : Map<TipoInput, string>;
    enumTiposInput = TipoInput;
    cantidadInstancias:number = 1;

    datoGuardado:InformacionGuardada | undefined;
    versionActual:Version | undefined;
    
    mapOpcionesSelect : Map<string,ValorSelect[]> = new Map();
    //Para select únicos
    mapOpcionSeleccionada : Map<string,number> = new Map();
    //Para select múltilpes
    mapOpcionesSeleccionadas : Map<string,number[]> = new Map();

    mapControlesCampos : Map<string,FormControl> = new Map();
    mapValoresComputados: Map<string,ValorComputado> = new Map();

    mapManejadorEventos: Map<string,EventEmitter<any>> = new Map();

    constructor(private initialSchemaService : InitialSchemaLoaderService
        ,private modalService: NgbModal) {
        
        this.mapTipoInput = MapTipoInput;
        this.mapTipoInputHTML = MapTipoInputHTML;
    }

    ngAfterViewInit(){
        //Inicializo popoever de bootstrap
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
    }

    ngOnInit(){
        //Veo cuantas instancias de este atributo hay y cargo los Datos guardados de este Atributo
        this.versionActual = this.initialSchemaService.loadedData?.versiones.at(-1);
        if(this.versionActual !== undefined){
            for(let datoGuardado of this.versionActual.datosGuardados!){
                
                if (datoGuardado.ubicacionAtributo.idEtapa === this.atributo.ubicacion.idEtapa
                    && datoGuardado.ubicacionAtributo.idGrupo === this.atributo.ubicacion.idGrupo
                    && datoGuardado.ubicacionAtributo.idAtributo === this.atributo.id
                ){
                    this.datoGuardado = datoGuardado;
                    this.cantidadInstancias = datoGuardado.cantidadInstancias;
                }
            }
        }

        //Realizo precomputo de los elementos dinámicos
        for(let filaDatos of this.atributo.filasDatos){
            for(let dato of filaDatos.datos){
                
                let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
                let claveMap = this.objectToString(ubicacionAbsoluta);
                //Computo opciones de los Select del Atributo
                if(dato.opciones){
                    if(dato.opciones.referencia){
                        //Busco en los datos guardados la Ubicación dato.opciones.referencia
                        let valoresDato = this.buscoDatoGuardadoDeAtributo(dato.opciones.referencia);
                        for(let [index,valorDato] of valoresDato.entries()){
                            let stringOpcion = 'Nombre de tema no asignado';
                            if(valorDato.string){
                                stringOpcion = valorDato.string;
                            }
                            let retrievedValue = this.mapOpcionesSelect.get(claveMap);
                            if(retrievedValue){
                                //Si ya existe la key en el map, agrego una opción al array de opciones
                                let nuevaOpcion : ValorSelect = {
                                    string:stringOpcion,
                                    muestroSi:null,
                                    valor:index
                                }
                                retrievedValue.push(nuevaOpcion);
                            }
                            else{
                                //Si no existe la key en el map
                                let nuevaOpcion : ValorSelect = {
                                    string:stringOpcion,
                                    muestroSi:null,
                                    valor:index
                                }
                                let array : ValorSelect[] = [];
                                array.push(nuevaOpcion);
                                this.mapOpcionesSelect.set(claveMap,array);
                            }
                        }
                    }
                    else{
                        //Proceso Datos Fijos
                        let datosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;
                        let datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === dato.opciones.idGrupoDatoFijo);

                        for (let opcion of datoFijo?.opciones!) {
                            
                            let retrievedValue = this.mapOpcionesSelect.get(claveMap);
                            if(retrievedValue){
                                //Si ya existe la key en el map, agrego una opción al array de opciones
                                let nuevaOpcion : ValorSelect = {
                                    string:opcion.valor,
                                    muestroSi:opcion.muestroSi,
                                    valor:opcion.id
                                }
                                retrievedValue.push(nuevaOpcion);
                            }
                            else{
                                //Si no existe la key en el map
                                let nuevaOpcion : ValorSelect = {
                                    string:opcion.valor,
                                    muestroSi:opcion.muestroSi,
                                    valor:opcion.id
                                }
                                let array : ValorSelect[] = [];
                                array.push(nuevaOpcion);
                                this.mapOpcionesSelect.set(claveMap,array);
                            }

                            //Si dependo de alguien mas para mostrar, debo de saber cuando ese alguien
                            //mas cambia para actualizar la información guardada en this.datoGuardado.valoresAtributo
                            //y recomputar acorde
                            if(opcion.muestroSi){
                                let claveInteresado = this.objectToString(claveMap);
                                let claveObservado = this.objectToString(opcion.muestroSi.referencia);
                                let claveEvento = claveInteresado+claveObservado;

                                let retrievedEventEmitter = this.mapManejadorEventos.get(claveEvento);
                                if(retrievedEventEmitter === undefined){
                                    //Registro evento en Grupo
                                    retrievedEventEmitter = new EventEmitter();
                                    this.mapManejadorEventos.set(
                                        claveEvento,
                                        retrievedEventEmitter
                                    );
                                    let registroDependencia : RegistrarDependencia = {
                                        interesado:ubicacionAbsoluta,
                                        observado:opcion.muestroSi.referencia,
                                        interesadoEscucha:retrievedEventEmitter
                                    }
                                    this.registrarDependencia.emit(registroDependencia);

                                    //Si cambia el dato observado, se llama esta funcion
                                    retrievedEventEmitter.subscribe((registroDependencia:RegistrarDependencia) => {
                                        let claveIntesado = this.objectToString(registroDependencia.interesado);

                                        //Reseteo el valor guardado y el mapOpcionSeleccionada
                                        //cargarInfoPrevia se encarga de seleccionar la primer opcion by default
                                        let valoresDato = this.buscoDatoGuardadoDeAtributo(registroDependencia.interesado);
                                        valoresDato[0].selectFijo = null;
                                        this.mapOpcionSeleccionada.delete(claveIntesado);
                                    });
                                }
                            }
                        }
                    }
                }
                //Computo del dato computo
                if(dato.computo){
                    this.procesarDatoComputo(dato.computo,ubicacionAbsoluta);
                }
            }
        }
        console.log("Fin precomputo");
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

    muestroOpcion(muestroSi:DependenciaDeDatos|null, indice:number){
        if(muestroSi){
            let clave = this.objectToString(muestroSi.referencia)+indice;
            let opcionSeleccionada = this.mapOpcionSeleccionada.get(clave);
            if(opcionSeleccionada !== undefined){

                return opcionSeleccionada === muestroSi.valorSeleccionado.idOpcion
            }
        }
        return true;
    }

    estaDeshabilitado(dependencia:DependenciaDeDatos, indice:number){
        if(dependencia){
            let key = this.objectToString(dependencia.referencia)+indice;
            let value = this.mapOpcionSeleccionada.get(key);

            if(value !== undefined){
                return dependencia.valorSeleccionado.idOpcion !== value;
            }
            return true;
        }
        return false;
    }

    guardarCambio(ubicacion:Ubicacion,indice:number,tipoInput:TipoInput,nuevoValor:any){
        
        let valoresDato = this.buscoDatoGuardadoDeAtributo(ubicacion);
        if(valoresDato.length !== 0){
            let claveMap = this.objectToString(ubicacion)+indice;
            switch (tipoInput) {
                case TipoInput.porcentaje:{
                    //let control = this.mapControlesCampos.get(this.objectToString(ubicacion));
                    let control = this.mapControlesCampos.get(claveMap);
                    if(!control?.invalid){
                        valoresDato[indice].number = Number(nuevoValor.value);
                    }
                    else{
                        valoresDato[indice].number = null;
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
                        this.mapOpcionSeleccionada.set(
                            claveMap,
                            valueObject
                        );
                    }

                    //Actualizo datos guardados en archivo
                    if(valoresDato[indice].selectFijo){
                        valoresDato[indice].selectFijo![0] = valueObject;
                    }
                    else{
                        
                        valoresDato[indice].selectFijo = [valueObject];
                    }
                    break;
                }
                case TipoInput.selectFijoMultiple:{
                    if(nuevoValor.value.length === 0){
                        valoresDato[indice].selectFijo = null;
                    }
                    else{
                        let valoresAGuardar = [];
                        for(let valor of nuevoValor.value){
                            valoresAGuardar.push(valor);
                        }
                        valoresDato[indice].selectFijo = valoresAGuardar;
                    }
                    break;
                }
                case TipoInput.selectUsuarioMultiple:{

                    if(nuevoValor.value.length === 0){
                        valoresDato[indice].selectUsuario = null;
                    }
                    else{
                        let valoresAGuardar = [];
                        for(let valor of nuevoValor.value){
                            valoresAGuardar.push(valor);
                        }
                        valoresDato[indice].selectUsuario = valoresAGuardar;
                    }
                    break;
                }
                default:
                    break;
            }
            this.informarCambio.emit(ubicacion);
        }
        /*console.log("Todos los val");
        console.log(this.initialSchemaService.loadedData);*/
        // console.log("Vals de Atrib");
        // console.log(this.datoGuardado!.valoresAtributo);
    }

    cargarInfoPrevia(ubicacion:Ubicacion, indice:number, tipoInput: TipoInput, posibleValor:any) : any {
        let valoresDato = this.buscoDatoGuardadoDeAtributo(ubicacion);
        if(valoresDato.length !== 0){
            let claveMap = this.objectToString(ubicacion)+indice;
            /*if(claveMap === '{"idEtapa":1,"idGrupo":11,"idAtributo":2,"idDato":[2]}0'){
                let dato = valoresDato[indice].string;
                console.log("cargando Dato");
            }*/
            switch (tipoInput) {
                case TipoInput.text:{
                    let entradaTextNumber : IntercambioTextNumberComponent = {
                        datoGuardado : valoresDato[indice]?.string,
                        ubicacion : ubicacion,
                        indiceInstancia : indice,
                        tipoInput : tipoInput,
                        deshabilitado: this.estaDeshabilitado(posibleValor.habilitadoSi,indice),
                        dato: posibleValor
                    }
                    return entradaTextNumber;
                }
                case TipoInput.number:{
                    let valor = null;
                    if(valoresDato[indice]?.number){
                        valor = valoresDato[indice].number?.toString();
                    }
                    let entradaTextNumber : IntercambioTextNumberComponent = {
                        datoGuardado : valor === undefined ? null : valor,
                        ubicacion : ubicacion,
                        indiceInstancia : indice,
                        tipoInput : tipoInput,
                        deshabilitado: this.estaDeshabilitado(posibleValor.habilitadoSi,indice),
                        dato: posibleValor
                    }
                    return entradaTextNumber;
                }
                case TipoInput.selectFijoUnico:{
                    
                    let estaOpcionEstaSeleccionada = false;
                    if(this.atributo.multiInstanciable){
                        if(valoresDato[indice]?.selectFijo){
                            estaOpcionEstaSeleccionada = posibleValor === valoresDato[indice].selectFijo![0];
                        }
                    }
                    else{
                        let value = this.mapOpcionSeleccionada.get(claveMap);
                        //Checkeo que solo se compute una vez este codigo
                        if(value === undefined){
                            if(valoresDato[indice]?.selectFijo){
                                estaOpcionEstaSeleccionada = posibleValor === valoresDato[indice].selectFijo![0];
                                if(estaOpcionEstaSeleccionada){
                                    this.mapOpcionSeleccionada.set(
                                        claveMap,
                                        posibleValor
                                    );
                                }
                            }
                            else{
                                //Si nunca se guardó valor, guardo el primero y lo seteo como seleccionado
                                estaOpcionEstaSeleccionada=true;
                                valoresDato[indice].selectFijo = [posibleValor];
                                this.mapOpcionSeleccionada.set(
                                    claveMap,
                                    posibleValor
                                );
                            }
                        }
                        else{
                            estaOpcionEstaSeleccionada = posibleValor === value;
                        }
                    }

                    return estaOpcionEstaSeleccionada;
                }
                case TipoInput.selectFijoMultiple:{
                    let valoresSeleccionados = this.mapOpcionesSeleccionadas.get(claveMap);
                    if(valoresSeleccionados === undefined){
                        let vuelta : number[] = [];
                        if(valoresDato[indice]?.selectFijo){
                            vuelta = valoresDato[indice].selectFijo!;
                        }
                        this.mapOpcionesSeleccionadas.set(claveMap,vuelta);
                    }
                    return this.mapOpcionesSeleccionadas.get(claveMap);
                }
                case TipoInput.radio:{

                    let estaOpcionEstaSeleccionada = false;
                    if(valoresDato[indice]?.selectFijo){
                        estaOpcionEstaSeleccionada = posibleValor === valoresDato[indice].selectFijo![0];
                    }
                    if(estaOpcionEstaSeleccionada && !this.atributo.multiInstanciable){
                        let value = this.mapOpcionSeleccionada.get(claveMap);
                        if(value === undefined){
                            this.mapOpcionSeleccionada.set(
                                claveMap,
                                posibleValor
                            );
                        }
                    }
                    return estaOpcionEstaSeleccionada;
                }
                case TipoInput.porcentaje:{
                    let value = this.mapControlesCampos.get(claveMap);
                    //Checkeo que solo se compute una vez este codigo
                    if(value === undefined){
                        this.mapControlesCampos.set(
                            claveMap,
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
                    return this.mapControlesCampos.get(claveMap);
                }
                case TipoInput.archivo:{
                    let entradaArchivo: IntercambioArchivoComponent = {
                        datoGuardado : valoresDato[indice]?.archivo,
                        ubicacion : ubicacion,
                        indiceInstancia : indice,
                        tipoInput : tipoInput
                    }
                    return entradaArchivo;
                }
                case TipoInput.selectUsuarioMultiple:{
                    let valoresSeleccionados = this.mapOpcionesSeleccionadas.get(claveMap);
                    if(valoresSeleccionados === undefined){
                        let vuelta : number[] = [];
                        if(valoresDato[indice]?.selectUsuario){
                            vuelta = valoresDato[indice].selectUsuario!;
                        }
                        this.mapOpcionesSeleccionadas.set(claveMap,vuelta);
                    }
                    return this.mapOpcionesSeleccionadas.get(claveMap);
                }
                default:
                    return "null_default";
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

    handleChange(cambio:any){
        let valoresDato = this.buscoDatoGuardadoDeAtributo(cambio.ubicacion);
        switch (cambio.tipoInput) {
            case TipoInput.text:{
                valoresDato[cambio.indiceInstancia].string = cambio.datoGuardado;
                break;
            }
            case TipoInput.number:{
                valoresDato[cambio.indiceInstancia].number = Number(cambio.datoGuardado);
                break;
            }
            case TipoInput.archivo:{
                valoresDato[cambio.indiceInstancia].archivo = cambio.datoGuardado;
                break;
            }
            default:
                break;
        }
        this.informarCambio.emit(cambio.ubicacion);
        // console.log("Vals de Atrib");
        // console.log(this.datoGuardado!.valoresAtributo);
    }

    buscoDatoGuardadoDeAtributo(ubicacion:Ubicacion) : ValoresDato[]{
        //Busco en los datos guardados la Ubicación pasada por parámetro
        if(this.versionActual !== undefined){
            for(let datoGuardado of this.versionActual.datosGuardados!){
                
                if (datoGuardado.ubicacionAtributo.idEtapa === ubicacion.idEtapa
                    && datoGuardado.ubicacionAtributo.idGrupo === ubicacion.idGrupo
                    && datoGuardado.ubicacionAtributo.idAtributo === ubicacion.idAtributo
                ){
                    //Encontré el Atributo, busco el idDato
                    for(let valorAtributo of datoGuardado.valoresAtributo){
                        if(valorAtributo.idDato.length === ubicacion.idDato.length && valorAtributo.idDato.every(function(value, index) { return value === ubicacion.idDato[index]})){
                            return valorAtributo.valoresDato;
                        }
                    }
                }
            }
        }    
        return [];
    }

    procesarDatoComputo(datoComputo:Computo,ubicacion:Ubicacion){
        let claveIntesado = this.objectToString(ubicacion);
        let valorComputado = this.mapValoresComputados.get(claveIntesado);
        if(valorComputado === undefined){
            let valorOP1 = this.calcularValorOperando(datoComputo.op1,ubicacion);
            let valorOP2 = this.calcularValorOperando(datoComputo.op2,ubicacion);
            let op1=0;
            let op2=0;
            if(typeof valorOP1 === "object"){
                op1 = valorOP1.valor;
            }
            else{
                op1 = valorOP1;
            }
            if(typeof valorOP2 === "object"){
                op2 = valorOP2.valor;
            }
            else{
                op2 = valorOP2;
            }
            //Hago la cuenta
            let nuevoValorComputado=0;
            if(op2!==0 || (op2===0 && datoComputo.operacion !== '/')){
                switch(datoComputo.operacion){
                    case '/':{
                        nuevoValorComputado=op1/op2;
                        break;
                    }
                    case '+':{
                        nuevoValorComputado=op1+op2;
                        break;
                    }
                    case '-':{
                        nuevoValorComputado=op1-op2;
                        break;
                    }
                    case '*':{
                        nuevoValorComputado=op1*op2;
                        break;
                    }
                }
            }
            let valorComputado:ValorComputado = {
                valor:nuevoValorComputado,
                op1:valorOP1,
                op2:valorOP2,
                operacion:datoComputo.operacion
            };
            this.mapValoresComputados.set(claveIntesado,valorComputado);
        }
    }

    calcularValorOperando(operandoObservado:Ubicacion|number,ubicacionInteresado:Ubicacion):number|ComputoValorUbicacion{
        let resultado=0;
        if(typeof operandoObservado === "object"){
            //Busco en los datos guardados la Ubicación dato.computo.op1
            let valoresDato = this.buscoDatoGuardadoDeAtributo(operandoObservado);
            for(let valorDato of valoresDato){
                //Si hay valor válido
                if(valorDato.number){
                    resultado = resultado + valorDato.number;
                }
            }
            //Si el operando son datos de una Ubicacion, se debe de saber
            //cuando ese dato cambia para recomputar
            let claveInteresado = this.objectToString(ubicacionInteresado);
            let claveObservado = this.objectToString(operandoObservado);
            let claveEvento = claveInteresado+claveObservado;

            let retrievedEventEmitter = this.mapManejadorEventos.get(claveEvento);
            if(retrievedEventEmitter === undefined){
                //Registro evento en Grupo
                retrievedEventEmitter = new EventEmitter();
                this.mapManejadorEventos.set(
                    claveEvento,
                    retrievedEventEmitter
                );
                let registroDependencia : RegistrarDependencia = {
                    interesado:ubicacionInteresado,
                    observado:operandoObservado,
                    interesadoEscucha:retrievedEventEmitter
                }
                this.registrarDependencia.emit(registroDependencia);

                //Si cambia el dato observado, se llama esta funcion
                retrievedEventEmitter.subscribe((registroDependencia:RegistrarDependencia) => {
                    let claveIntesado = this.objectToString(registroDependencia.interesado);
                    let claveObservado = this.objectToString(registroDependencia.observado);

                    let valorAnterior = this.mapValoresComputados.get(claveIntesado);
                    if(valorAnterior !== undefined){
                        let op1 = 0;
                        if(typeof valorAnterior.op1 === "object" && valorAnterior.op1.claveUbicacion === claveObservado){
                            let valoresDato = this.buscoDatoGuardadoDeAtributo(registroDependencia.observado);
                            let nuevoResultadoOP = 0;
                            for(let valorDato of valoresDato){
                                //Si hay valor válido
                                if(valorDato.number){
                                    nuevoResultadoOP = nuevoResultadoOP + valorDato.number;
                                }
                            }
                            valorAnterior.op1.valor = nuevoResultadoOP;
                            op1 = nuevoResultadoOP;
                        }
                        else if(typeof valorAnterior.op1 === "number"){
                            op1 = valorAnterior.op1;
                        }
                        let op2 = 0;
                        if(typeof valorAnterior.op2 === "object" && valorAnterior.op2.claveUbicacion === claveObservado){
                            let valoresDato = this.buscoDatoGuardadoDeAtributo(registroDependencia.observado);
                            let nuevoResultadoOP = 0;
                            for(let valorDato of valoresDato){
                                //Si hay valor válido
                                if(valorDato.number){
                                    nuevoResultadoOP = nuevoResultadoOP + valorDato.number;
                                }
                            }
                            valorAnterior.op2.valor = nuevoResultadoOP;
                            op2 = nuevoResultadoOP;
                        }
                        else if(typeof valorAnterior.op2 === "number"){
                            op2 = valorAnterior.op2;
                        }

                        //Hago la cuenta
                        let nuevoValorComputado=0;
                        if(op2!==0 || (op2===0 && valorAnterior.operacion !== '/')){
                            switch(valorAnterior.operacion){
                                case '/':{
                                    nuevoValorComputado=op1/op2;
                                    break;
                                }
                                case '+':{
                                    nuevoValorComputado=op1+op2;
                                    break;
                                }
                                case '-':{
                                    nuevoValorComputado=op1-op2;
                                    break;
                                }
                                case '*':{
                                    nuevoValorComputado=op1*op2;
                                    break;
                                }
                            }
                        }
                        
                        //Guardo resultado
                        valorAnterior.valor = nuevoValorComputado;
                    }
                });
            }
            let vuelta : ComputoValorUbicacion = {
                claveUbicacion:claveObservado,
                valor:resultado
            }
            return vuelta;
        }
        else{
            //Busco el valor constante con id dato.computo.op1
            let constantes = this.initialSchemaService.defaultSchema?.constantes;
            let constanteSeleccionada = constantes?.find((constante) => constante.id === operandoObservado);
            resultado = constanteSeleccionada?.valor!;
            return resultado;
        }
    }

    modalConfirmacion(ubicacionAtributo:Ubicacion, idAtributo:number, indice:number){
        const modalRef = this.modalService.open(ModalConfirmacionComponent, {
            scrollable: false,
        });
        modalRef.componentInstance.tittle = 'Atención';
        modalRef.componentInstance.body = '¿Está seguro que desea eliminar el registro?';
        
        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: () => {
                //Elimino instancia de Atributo
                if(this.cantidadInstancias !== 1){
                    
                    for(let datoDentroAtributo of this.datoGuardado!.valoresAtributo!){
                        datoDentroAtributo.valoresDato.splice(indice,1);
                    }
                    this.datoGuardado!.cantidadInstancias = this.cantidadInstancias;
                    this.cantidadInstancias--;
                }
                else{
                    //Reseteo los datos de la única instancia
                    this.cantidadInstancias--;
                    for(let datoDentroAtributo of this.datoGuardado!.valoresAtributo!){
                        datoDentroAtributo.valoresDato = [];
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

                //Busco en el schema los datos que dependen del Atributo eliminado
                for(let etapa of this.initialSchemaService.defaultSchema?.etapas!){
                    for(let grupo of etapa.grupos){
                        for(let atrib of grupo.atributos){
                            if(atrib.filasDatos != null){
                                for(let filaDatos of atrib.filasDatos){
                                    for(let dato of filaDatos.datos){
                                        if(TipoInput.selectUsuarioMultiple === this.mapTipoInput.revGet(dato.tipo)){
                                            let referencia = dato.opciones.referencia;
                                            if(referencia.idEtapa === ubicacionAtributo.idEtapa
                                                && referencia.idGrupo === ubicacionAtributo.idGrupo
                                                && referencia.idAtributo === idAtributo)
                                            {

                                                let ubicacionDato = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
                                                let datosGuardados = this.buscoDatoGuardadoDeAtributo(ubicacionDato);
                                                for(let datoGuardado of datosGuardados){
                                                    if(datoGuardado.selectUsuario != null){
                                                        datoGuardado.selectUsuario = this.corregirIndicesGuardados(indice,datoGuardado.selectUsuario);
                                                        if(datoGuardado.selectUsuario.length === 0){
                                                            datoGuardado.selectUsuario = null;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }   
                        }
                    }
                }
            },
            error: () => {
                //Nunca se llama aca
            },
        });
    }

    corregirIndicesGuardados(indiceEliminado:number, indicesGuardados:number[]){
        let vuelta:number[] = [];
        for(let indiceGuardado of indicesGuardados){
            //Los indices menores los dejo
            if(indiceGuardado !== indiceEliminado && indiceGuardado<indiceEliminado){
                vuelta.push(indiceGuardado);
            }
            //Los indices mayores les resto 1
            if(indiceGuardado !== indiceEliminado && indiceGuardado>indiceEliminado){
                let nuevoIndice = indiceGuardado - 1;
                vuelta.push(nuevoIndice);
            }
            //El indice igual, no lo agrego al array vuelta
        }
        return vuelta;
    }
}
