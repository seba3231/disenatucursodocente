import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { Atributo, Computo, DependenciaDeDatos, Ubicacion, Grupo, Etapa } from '../modelos/schema.model';
import { MapTipoInput, MapTipoInputHTML, TipoInput, TwoWayMap } from '../enumerados/enums';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { AccionesCursosService } from '../servicios/acciones-cursos.service';
import { DatoArchivo, InformacionGuardada, ValoresDato, Version } from '../modelos/schemaData.model';
import { FormControl, Validators } from '@angular/forms';
import { NgbModal,NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { ModalConfirmacionComponent } from '../modal/confirmacion/modal-confirmacion.component';
import { _countGroupLabelsBeforeOption } from '@angular/material/core';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';

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
    @Input() versionSeleccionada!: Version | undefined;
    @Output() registrarDependencia = new EventEmitter<RegistrarDependencia>();
    @Output() informarCambio = new EventEmitter<Ubicacion>();
    @ViewChild('fileUploader', { static: false }) fileUploader!: ElementRef;
    @ViewChild('fileDownloader', { static: false }) fileDownloader!: ElementRef;
    
    mapTipoInput : TwoWayMap<TipoInput, string>;
    mapTipoInputHTML : Map<TipoInput, string>;
    enumTiposInput = TipoInput;
    atributoHerencia : Atributo | undefined;
    grupoHerencia : Grupo | undefined;
    etapaHerencia: Etapa | undefined;

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

    mapDatoArchivo : Map<string, DatoArchivo> = new Map();

    constructor(private initialSchemaService : InitialSchemaLoaderService
        ,private modalService: NgbModal
        ,private accionesCursosService: AccionesCursosService) {
        
        this.mapTipoInput = MapTipoInput;
        this.mapTipoInputHTML = MapTipoInputHTML;
    }

    ngAfterViewInit(){
        //Inicializo popoever de bootstrap
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
    }

    ngOnInit(){
        this.atributoHerencia = undefined
        this.grupoHerencia = undefined
        this.etapaHerencia = undefined    
        //Veo cuantas instancias de este atributo hay y cargo los Datos guardados de este Atributo
        this.versionActual = this.versionSeleccionada;
        if(this.versionActual !== undefined){
            for(let datoGuardado of this.versionActual.datosGuardados!){
                
                if (datoGuardado.ubicacionAtributo.idEtapa === this.atributo.ubicacion.idEtapa
                    && datoGuardado.ubicacionAtributo.idGrupo === this.atributo.ubicacion.idGrupo
                    && datoGuardado.ubicacionAtributo.idAtributo === this.atributo.id
                ){
                    this.datoGuardado = datoGuardado;
                }
            }
        }

        if (this.atributo.herencia){
            const [atributoHerencia, grupoHerencia, etapaHerencia] = this.getAtributoHerencia(this.atributo.herencia)
            this.atributoHerencia = JSON.parse(JSON.stringify(atributoHerencia));
            if (this.atributoHerencia){
                this.atributoHerencia.ubicacion = this.atributo.ubicacion
                for(let filaDatos of this.atributoHerencia.filasDatos){
                    for(let dato of filaDatos.datos){
                       dato.ubicacion.idEtapa = this.atributo.ubicacion.idEtapa
                       dato.ubicacion.idGrupo = this.atributo.ubicacion.idGrupo
                       dato.ubicacion.idAtributo =  this.atributo.id
                    }
                }
            }
            
            this.grupoHerencia = grupoHerencia
            this.etapaHerencia = etapaHerencia            
            // console.log(this.atributoHerencia)            
        }

        //Realizo precomputo de los elementos dinámicos
        if (this.atributo.filasDatos){
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
        }
        
        console.log("Fin precomputo");
    }

    getAtributoHerencia(ubicacion: Ubicacion): any{ //retorna un Dato completo
        if (this.initialSchemaService.defaultSchema){
            for(let etapa of this.initialSchemaService.defaultSchema?.etapas){
                for(let grupo of etapa.grupos){
                    for(let atributo of grupo.atributos){
                        
                        if (atributo.ubicacion.idEtapa == ubicacion.idEtapa
                            && atributo.ubicacion.idGrupo == ubicacion.idGrupo
                            && atributo.id == ubicacion.idAtributo){
                            return [atributo, grupo, etapa]
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
        this.datoGuardado!.cantidadInstancias++;
        this.accionesCursosService.modificarCurso();
    }

    openSelectFileDialog(ubicacion:Ubicacion,indice:number){
        //Varios Datos usan el FileUploader, se setean las coordenadas para
        //para saber donde guardar lo que se seleccione
        let fileUploader = this.fileUploader.nativeElement;
        fileUploader.setAttribute('idEtapa',ubicacion.idEtapa.toString());
        fileUploader.setAttribute('idGrupo',ubicacion.idGrupo.toString());
        fileUploader.setAttribute('idAtributo',ubicacion.idAtributo.toString());
        let acumuladorIDDato=null;
        for(let idDato of ubicacion.idDato){
            if(acumuladorIDDato === null){
                acumuladorIDDato=idDato.toString();
            }
            else{
                acumuladorIDDato=acumuladorIDDato+","+idDato.toString();
            }
        }
        fileUploader.setAttribute('idDato',acumuladorIDDato);
        fileUploader.setAttribute('indice',indice.toString());
        fileUploader.click();
    }

    onFileSelected(event:any){
        //https://blog.angular-university.io/angular-file-upload/
        const file:File = event.target.files[0];
        if (file) {
            //Reconstruyo coordenadas
            let fileUploader = this.fileUploader.nativeElement;
            let idEtapa = Number(fileUploader.getAttribute('idEtapa'));
            let idGrupo = Number(fileUploader.getAttribute('idGrupo'));
            let idAtributo = Number(fileUploader.getAttribute('idAtributo'));
            let attDato = fileUploader.getAttribute('idDato');
            const arrayDato = attDato.split(",");
            let idDato :number[] = [];
            for(let sDato of arrayDato){
                idDato.push(Number(sDato));
            }
            let ubicacion : Ubicacion = {
                idEtapa:idEtapa,
                idGrupo:idGrupo,
                idAtributo:idAtributo,
                idDato:idDato
            }
            let indice = fileUploader.getAttribute('indice');
            let claveMap = this.objectToString(ubicacion)+indice;
            let archivoCargado = this.mapDatoArchivo.get(claveMap);
            let insideThis = this;
            if(archivoCargado !== undefined){

                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async function () {
                    if (typeof reader.result === 'string') {
                        archivoCargado!.fileName = file.name;
                        archivoCargado!.fileBinary = reader.result;
                    }
                    insideThis.accionesCursosService.modificarCurso();
                };
                reader.onerror = function (error) {
                    const alert = document.querySelector('ngb-alert')
                    if(alert){
                        alert.classList.add('show')
                    }
                    console.log('Error: ', error);
                };
            }
        }
    }

    eliminarArchivo(ubicacion:Ubicacion,indice:number){
        let claveMap = this.objectToString(ubicacion)+indice;
        let archivoCargado = this.mapDatoArchivo.get(claveMap);
        if(archivoCargado !== undefined){
            archivoCargado!.fileName = null;
            archivoCargado!.fileBinary = null;
            this.accionesCursosService.modificarCurso();
        }
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
        console.log(ubicacion)
        let valoresDato = this.buscoDatoGuardadoDeAtributo(ubicacion);
        console.log(nuevoValor.value)
        if(valoresDato.length !== 0){
            let claveMap = this.objectToString(ubicacion)+indice;
            switch (tipoInput) {
                case TipoInput.text:{
                    valoresDato[indice].string = nuevoValor.value;
                    break;
                }
                case TipoInput.number:{
                    valoresDato[indice].number = Number(nuevoValor.value);
                    break;
                }
                case TipoInput.porcentaje:{
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
                case TipoInput.archivo:{
                    let archivoCargado = this.mapDatoArchivo.get(claveMap);
                    if(archivoCargado !== undefined){
                        archivoCargado.texto = nuevoValor.value;
                    }
                    break;
                }
                case TipoInput.date:{
                    valoresDato[indice].date = new Date(nuevoValor.value);
                    break;
                }
                default:
                    break;
            }
            this.informarCambio.emit(ubicacion);
            //console.log(valoresDato);
            this.accionesCursosService.modificarCurso();
        }
    }

    cargarInfoPrevia(ubicacion:Ubicacion, indice:number, tipoInput: TipoInput, posibleValor:any) : any {
        // console.log(ubicacion)
        let valoresDato = this.buscoDatoGuardadoDeAtributo(ubicacion);
        if(valoresDato.length !== 0){
            let claveMap = this.objectToString(ubicacion)+indice;
            switch (tipoInput) {
                case TipoInput.text:{
                    return valoresDato[indice].string;
                }
                case TipoInput.date:{
                    return valoresDato[indice].date;
                }
                case TipoInput.number:{
                    return valoresDato[indice].number;
                }
                case TipoInput.selectFijoUnico:{
                    
                    let estaOpcionEstaSeleccionada = false;
                    if(this.atributo.multiInstanciable){
                        //No se guarda en this.mapOpcionSeleccionada porque nada de este atributo
                        //(sucede en todos, pero nos interesa este)
                        //depende del valor seleccionado en un selectFijoUnico multiinstanciable
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
                        let valorParaControl = 0;
                        if(valoresDato[indice].number !== null){
                            valorParaControl = valoresDato[indice].number!;
                        }
                        this.mapControlesCampos.set(
                            claveMap,
                            new FormControl(
                                {
                                    value: valorParaControl,
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
                    let archivoCargado = this.mapDatoArchivo.get(claveMap);
                    if(archivoCargado === undefined){
                        if(valoresDato[indice]?.archivo == null){
                            let nuevoDatoArchivo : DatoArchivo= {
                                texto:null,
                                fileName:null,
                                fileBinary:null,
                                ruta:null
                            }
                            valoresDato[indice]!.archivo = nuevoDatoArchivo;
                        }
                        this.mapDatoArchivo.set(claveMap,valoresDato[indice]?.archivo!);
                    }
                    archivoCargado = this.mapDatoArchivo.get(claveMap);
                    switch(posibleValor){
                        case 'Texto':{
                            return archivoCargado?.texto;
                        }
                        case 'ExisteFile':{
                            return archivoCargado?.fileName !== null;
                        }
                    }
                    break;
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

    downloadUserFile(ubicacion:Ubicacion,indice:number){
        let claveMap = this.objectToString(ubicacion)+indice;
        let archivoCargado = this.mapDatoArchivo.get(claveMap);
        if(archivoCargado !== undefined){
            if(archivoCargado?.fileName !== null){
                
                let fileDownloader = this.fileDownloader.nativeElement;
                fileDownloader.setAttribute('href',archivoCargado.fileBinary);
                fileDownloader.setAttribute('download',archivoCargado.fileName);
                fileDownloader.click();
            }
        }
    }

    openModalAgrergoLinkArchivo(ubicacion:Ubicacion,indice:number){
        let claveMap = this.objectToString(ubicacion)+indice;
        let archivoCargado = this.mapDatoArchivo.get(claveMap);
        if(archivoCargado !== undefined){

            // MODAL PARA AGREGAR COMENTARIOS
            const modalRef = this.modalService.open(ModalComentariosComponent, {
                scrollable: false,
            });
            modalRef.componentInstance.tittle = 'Agregar o modificar un enlace a otro sitio';
            if (archivoCargado.ruta)
                modalRef.componentInstance.body = "Enlace actual: " + archivoCargado.ruta
            modalRef.componentInstance.inputDisclaimer[0] = 'Ingrese un enlace aquí';
            
            //Control Resolve with Observable
            modalRef.closed.subscribe({
                next: (resp) => {
                    if (resp.length > 0){
                        console.log(resp);
                        archivoCargado!.ruta = resp[0];
                    }
                    this.accionesCursosService.modificarCurso();
                    console.log(archivoCargado);
                },
                error: () => {
                    //Nunca se llama aca
                },
            });
        }
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
                            console.log(valorAtributo)
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
                if(this.datoGuardado!.cantidadInstancias !== 1){
                    
                    for(let datoDentroAtributo of this.datoGuardado!.valoresAtributo!){
                        datoDentroAtributo.valoresDato.splice(indice,1);
                    }
                    this.datoGuardado!.cantidadInstancias--;
                }
                else{
                    //Reseteo los datos de la única instancia
                    for(let datoDentroAtributo of this.datoGuardado!.valoresAtributo!){
                        datoDentroAtributo.valoresDato[0].string = null;
                        datoDentroAtributo.valoresDato[0].number = null;
                        datoDentroAtributo.valoresDato[0].selectFijo = null;
                        datoDentroAtributo.valoresDato[0].selectUsuario = null;
                        datoDentroAtributo.valoresDato[0].archivo = null;
                        datoDentroAtributo.valoresDato[0].date = null;
                    }
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
                                                        this.corregirIndicesGuardados(indice,datoGuardado.selectUsuario);
                                                        if(datoGuardado.selectUsuario.length === 0){
                                                            datoGuardado.selectUsuario = null;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if(TipoInput.computo === this.mapTipoInput.revGet(dato.tipo)){
                                            if(typeof dato.computo.op1 === "object"){
                                                let referencia = dato.computo.op1;
                                                if(referencia.idEtapa === ubicacionAtributo.idEtapa
                                                    && referencia.idGrupo === ubicacionAtributo.idGrupo
                                                    && referencia.idAtributo === idAtributo)
                                                {
                                                    this.informarCambio.emit(referencia);
                                                }
                                            }
                                            if(typeof dato.computo.op2 === "object"){
                                                let referencia = dato.computo.op2;
                                                if(referencia.idEtapa === ubicacionAtributo.idEtapa
                                                    && referencia.idGrupo === ubicacionAtributo.idGrupo
                                                    && referencia.idAtributo === idAtributo)
                                                {
                                                    this.informarCambio.emit(referencia);
                                                }
                                            }
                                        }
                                    }
                                }
                            }   
                        }
                    }
                }
                //console.log(this.datoGuardado!.valoresAtributo);
                
                //Invalido map de archivos
                this.mapDatoArchivo = new Map();
                //Invalido map de opcionesSeleccionadas
                this.mapOpcionSeleccionada = new Map();
                this.mapOpcionesSeleccionadas = new Map();

                this.accionesCursosService.modificarCurso();
            },
            error: () => {
                //Nunca se llama aca
            },
        });
    }

    corregirIndicesGuardados(indiceEliminado:number, indicesGuardados:number[]){
        
        //Primera recorrida: el indice igual lo remuevo del array
        for(const [i, indiceGuardado]  of indicesGuardados.entries()){    
            if(indiceGuardado === indiceEliminado){
                indicesGuardados.splice(i,1);
                break;
            }
        }
        //Segunda recorrida, modifico indices
        for(const [i, indiceGuardado]  of indicesGuardados.entries()){
            //Los indices menores no los cambio
            //Los indices mayores les resto 1
            if(indiceGuardado !== indiceEliminado && indiceGuardado>indiceEliminado){
                indicesGuardados[i]--;
            }
        }
    }
}
