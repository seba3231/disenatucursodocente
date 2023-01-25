import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { Atributo, Computo, DependenciaDeDatos, Ubicacion, Grupo, Etapa, Dato, ContenidoCondicional,FilaDatos } from '../modelos/schema.model';
import { MapTipoInput, MapTipoInputHTML, TipoInput, TwoWayMap } from '../enumerados/enums';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { AccionesCursosService } from '../servicios/acciones-cursos.service';
import { DatoArchivo, InformacionGuardada, ValoresDato, Version,ValoresAtributo, Archivo } from '../modelos/schemaData.model';
import { FormControl, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalConfirmacionComponent } from '../modal/confirmacion/modal-confirmacion.component';
import { _countGroupLabelsBeforeOption } from '@angular/material/core';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';

declare var bootstrap: any;

export interface RegistrarDependencia{
    interesado:Ubicacion;
    observado:Ubicacion;
    claveInteresado:string|null;
    observado2:Ubicacion|number|undefined;
    interesadoEscucha:EventEmitter<any>;
}
export interface ValorComputado{
    valor:number;
    op1:ComputoValorUbicacion|number;
    op2:ComputoValorUbicacion|number;
    op3:ComputoValorUbicacion|number;
    operacion:string[];
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
export interface RenderContenidoCondicional{
    cantInstancias:number;
    filaDatos:FilaDatos[];
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
    @Output() eliminarDependencia = new EventEmitter<string>();
    @ViewChild('fileUploader', { static: false }) fileUploader!: ElementRef;
    @ViewChild('fileDownloader', { static: false }) fileDownloader!: ElementRef;
    
    mapTipoInput : TwoWayMap<TipoInput, string>;
    mapTipoInputHTML : Map<TipoInput, string>;
    enumTiposInput = TipoInput;
    atributoHerencia : Atributo | undefined;
    grupoHerencia : Grupo | undefined;
    etapaHerencia: Etapa | undefined;

    versionActual:Version | undefined;
    
    //Map con el ContenidoCondicional de un Dato
    mapContenidoCondicional : Map<string,FilaDatos[][]> = new Map();

    //Las posibles opciones de un idGrupoDatoFijo
    mapOpcionesSelect : Map<string,ValorSelect[]> = new Map();
    
    //Para select únicos
    mapOpcionSeleccionada : Map<string,number> = new Map();

    //Para select múltilpes
    mapOpcionesSeleccionadas : Map<string,number[]> = new Map();

    mapControlesCampos : Map<string,FormControl> = new Map();
    mapValoresComputados: Map<string,ValorComputado> = new Map();

    mapManejadorEventos: Map<string,EventEmitter<any>> = new Map();

    mapDatoArchivo : Map<string, DatoArchivo> = new Map();

    mapInformacionGuardadaDeAtributo : Map<string, InformacionGuardada> = new Map();
    //datoGuardado:InformacionGuardada | undefined;

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
        this.atributoHerencia = undefined;
        this.grupoHerencia = undefined;
        this.etapaHerencia = undefined;
        //Veo cuantas instancias de este atributo hay y cargo los Datos guardados de este Atributo
        this.versionActual = this.versionSeleccionada;
        if(this.versionActual !== undefined){
            let ubicacionAtr : Ubicacion = this.ubicacionAbsolutaDeAtributo(this.atributo.ubicacion,this.atributo.id);
            let claveMap = this.objectToString(ubicacionAtr);
            let retrievedValue = this.mapInformacionGuardadaDeAtributo.get(claveMap);
            if(!retrievedValue){
                //Si no existe la key en el map
                for(let datoGuardado of this.versionActual.datosGuardados!){
                    if (this.objectToString(datoGuardado.ubicacionAtributo) === claveMap){
                        this.mapInformacionGuardadaDeAtributo.set(claveMap,datoGuardado);
                        break;
                    }
                }
            }
        }

        if (this.atributo.herencia){
            const [atributoHerencia, grupoHerencia, etapaHerencia] = this.getAtributoHerencia(this.atributo.herencia);
            this.atributoHerencia = JSON.parse(JSON.stringify(atributoHerencia));
            if (this.atributoHerencia){
                this.atributoHerencia.ubicacion = this.atributo.ubicacion;
                if(this.atributoHerencia.nombre != null){
                    this.atributo.nombre = this.atributoHerencia.nombre;
                }
                for(let filaDatos of this.atributoHerencia.filasDatos){
                    for(let dato of filaDatos.datos){
                        dato.ubicacion.idEtapa = this.atributo.ubicacion.idEtapa
                        dato.ubicacion.idGrupo = this.atributo.ubicacion.idGrupo
                        dato.ubicacion.idAtributo =  this.atributo.id
                        let ubicacionAbsoluta = this.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                        let claveMap = this.objectToString(ubicacionAbsoluta);
                        //Computo opciones de los Select del Atributo
                        if(dato.opciones){
                            if(dato.opciones.referencia){
                                //Busco en los datos guardados la Ubicación dato.opciones.referencia
                                let ubicacionDesarmada : Ubicacion = {
                                    idEtapa : dato.opciones.referencia.idEtapa
                                    ,idGrupo : dato.opciones.referencia.idGrupo
                                    ,idAtributo : dato.opciones.referencia.idAtributo
                                    ,idDato : null
                                }
                                let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,dato.opciones.referencia.idDato);
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
                                                observado2: undefined,
                                                claveInteresado:null,
                                                interesadoEscucha:retrievedEventEmitter
                                            }
                                            this.registrarDependencia.emit(registroDependencia);
        
                                            //Si cambia el dato observado, se llama esta funcion
                                            retrievedEventEmitter.subscribe((registroDependencia:RegistrarDependencia) => {
                                                let claveIntesado = this.objectToString(registroDependencia.interesado);
        
                                                //Reseteo el valor guardado y el mapOpcionSeleccionada
                                                //cargarInfoPrevia se encarga de seleccionar la primer opcion by default
                                                let ubicacionDesarmada : Ubicacion = {
                                                    idEtapa : registroDependencia.interesado.idEtapa
                                                    ,idGrupo : registroDependencia.interesado.idGrupo
                                                    ,idAtributo : registroDependencia.interesado.idAtributo
                                                    ,idDato : null
                                                }
                                                let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.interesado.idDato);
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

                        //Computo opciones de los Select del Atributo de contenidoCondicional
                        //Manejo la Herencia acá, falta luego agregar el nuevo Dato de CC que
                        //no estaba en los Datos Heredados.
                        if(dato.filasDatos !== null){
                            //Cambio la Ubicacion Heredada por la Ubicación del Atributo actual
                            let datoInterior = dato.filasDatos[0].datos[0];
                            datoInterior.ubicacion.idEtapa = this.atributo.ubicacion.idEtapa
                            datoInterior.ubicacion.idGrupo = this.atributo.ubicacion.idGrupo
                            datoInterior.ubicacion.idAtributo =  this.atributo.id

                            let ubicacionAbsInterior = this.ubicacionAbsolutaDeDato(datoInterior.ubicacion,datoInterior.id);
                            //ubicacionAbsInterior = 2,24,3,[7,1]
                            this.cargoOpcionesSelect(datoInterior
                                ,this.objectToString(ubicacionAbsInterior)
                                ,ubicacionAbsInterior
                            );
                            
                            //Todos los ContCond
                            //let contenidoCondicional = this.initialSchemaService.defaultSchema?.contenidoCondicional;
                            //Los ContCond que son de este Dato
                            //let contenidosMatchean = contenidoCondicional?.filter((contMacth) => this.objectToString(contMacth.muestroSi.referencia) === this.objectToString(ubicacionAbsInterior));
                            
                            //Cantidad de instancias de Modulo
                            let cantidadInstanciasAtributo = this.buscoInformacionGuardadaDeAtributo(dato.ubicacion)?.cantidadInstancias;
                            //Copio array: arrayDato = [7,1]
                            let arrayDato = [...ubicacionAbsInterior.idDato!];

                            //Agrego elemento al inicio, pivote de n° de instancia
                            ubicacionAbsInterior.idDato!.unshift(0);
                            //Por cada instancia de Módulo, busco cuantas/cuales Unidades tiene
                            for (var i = 0; i < cantidadInstanciasAtributo!; i++) {
                                
                                //Si no existe clave en Map, la agrego
                                let ubicacionContCondicional : Ubicacion = {
                                    idEtapa : ubicacionAbsInterior.idEtapa,
                                    idGrupo : ubicacionAbsInterior.idGrupo,
                                    idAtributo : ubicacionAbsInterior.idAtributo,
                                    idDato : [i]
                                }
                                //Por ejemplo, Padre (modulo) indice 0
                                //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]}"
                                let clavePadreContCondicional = this.objectToString(ubicacionContCondicional);
                                let contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                                if(contCondicional === undefined){
                                    this.mapContenidoCondicional.set(
                                        clavePadreContCondicional,
                                        []
                                    );
                                    contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                                    ubicacionContCondicional.idDato = ubicacionAbsInterior.idDato
                                    var datosGuardados = this.buscoInformacionGuardadaDeAtributo(ubicacionContCondicional) as InformacionGuardada;
                                    this.mapInformacionGuardadaDeAtributo.set
                                    (
                                        this.objectToString(ubicacionContCondicional),
                                        datosGuardados
                                    );
                                }
                                                            
                                ubicacionAbsInterior.idDato![0] = i;
                                //ubicacionAbsInterior = 2,24,3,[i,7,1]
                                let valoresSelectCondicional : ValoresDato[] = this.buscoValoresDatoDeAtributo(ubicacionAbsInterior,arrayDato);
                                for(let [indexSelCond,valSelCond] of valoresSelectCondicional.entries()){

                                    let idOpcion = 0;
                                    if(valSelCond.selectFijo !== null){
                                        idOpcion = valSelCond.selectFijo[0];
                                    }

                                    //UbSchema = 2,24,3,[7,1]
                                    //UbModulo = 2,24,3,[indiceMod]
                                    const [filaDatos,opciones,maxCantDatos] = this.obtengoIngredientesContCond(
                                        {idEtapa : ubicacionAbsInterior.idEtapa,idGrupo : ubicacionAbsInterior.idGrupo,idAtributo : ubicacionAbsInterior.idAtributo,idDato:[...arrayDato]},
                                        {idEtapa : ubicacionAbsInterior.idEtapa,idGrupo : ubicacionAbsInterior.idGrupo,idAtributo : ubicacionAbsInterior.idAtributo,idDato:[i]},
                                        idOpcion,
                                        indexSelCond
                                    );

                                    //Agrego opciones selectUsuario
                                    for(let [key,value] of opciones.entries()){
                                        this.mapOpcionesSelect.set(key,value);
                                    }

                                    //Agrego FilaDatos a mapCC
                                    contCondicional?.push(filaDatos);
                                }
                            }
                        }
                    }
                }
            }
            
            this.grupoHerencia = grupoHerencia!
            this.etapaHerencia = etapaHerencia!          
            // console.log(this.atributoHerencia)            
        }

        //Realizo precomputo de los elementos dinámicos
        if (this.atributo.filasDatos && !this.atributo.herencia){
            for(let filaDatos of this.atributo.filasDatos){
                for(let dato of filaDatos.datos){
                    let ubicacionAbsoluta = this.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                    let claveMap = this.objectToString(ubicacionAbsoluta);
                    //Computo opciones de los Select del Atributo
                    if(dato.opciones){
                        this.cargoOpcionesSelect(dato,claveMap,ubicacionAbsoluta);
                    }
                    //Computo del dato computo
                    if(dato.computo){
                        this.procesarDatoComputo(dato.computo,ubicacionAbsoluta);
                    }
                    //Computo opciones de los Select del Atributo de contenidoCondicional
                    if(dato.filasDatos !== null){
                        
                        let datoInterior = dato.filasDatos[0].datos[0];
                        let ubicacionAbsInterior = this.ubicacionAbsolutaDeDato(datoInterior.ubicacion,datoInterior.id);
                        //ubicacionAbsInterior = 2,24,3,[7,1]
                        this.cargoOpcionesSelect(datoInterior
                            ,this.objectToString(ubicacionAbsInterior)
                            ,ubicacionAbsInterior
                        );
                        
                        //Todos los ContCond
                        //let contenidoCondicional = this.initialSchemaService.defaultSchema?.contenidoCondicional;
                        //Los ContCond que son de este Dato
                        //let contenidosMatchean = contenidoCondicional?.filter((contMacth) => this.objectToString(contMacth.muestroSi.referencia) === this.objectToString(ubicacionAbsInterior));
                        
                        //Cantidad de instancias de Modulo
                        let cantidadInstanciasAtributo = this.buscoInformacionGuardadaDeAtributo(dato.ubicacion)?.cantidadInstancias;
                        //Copio array: arrayDato = [7,1]
                        let arrayDato = [...ubicacionAbsInterior.idDato!];

                        //Agrego elemento al inicio, pivote de n° de instancia
                        ubicacionAbsInterior.idDato!.unshift(0);
                        //Por cada instancia de Módulo, busco cuantas/cuales Unidades tiene
                        for (var i = 0; i < cantidadInstanciasAtributo!; i++) {
                            
                            //Si no existe clave en Map, la agrego
                            let ubicacionContCondicional : Ubicacion = {
                                idEtapa : ubicacionAbsInterior.idEtapa,
                                idGrupo : ubicacionAbsInterior.idGrupo,
                                idAtributo : ubicacionAbsInterior.idAtributo,
                                idDato : [i]
                            }
                            //Por ejemplo, Padre (modulo) indice 0
                            //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]}"
                            let clavePadreContCondicional = this.objectToString(ubicacionContCondicional);
                            let contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                            if(contCondicional === undefined){
                                this.mapContenidoCondicional.set(
                                    clavePadreContCondicional,
                                    []
                                );
                                contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                                ubicacionContCondicional.idDato = ubicacionAbsInterior.idDato
                                var datosGuardados = this.buscoInformacionGuardadaDeAtributo(ubicacionContCondicional) as InformacionGuardada;
                                this.mapInformacionGuardadaDeAtributo.set
                                (
                                    this.objectToString(ubicacionContCondicional),
                                    datosGuardados
                                );
                            }
                                                        
                            ubicacionAbsInterior.idDato![0] = i;
                            //ubicacionAbsInterior = 2,24,3,[i,7,1]
                            let valoresSelectCondicional : ValoresDato[] = this.buscoValoresDatoDeAtributo(ubicacionAbsInterior,arrayDato);
                            for(let [indexSelCond,valSelCond] of valoresSelectCondicional.entries()){

                                let idOpcion = 0;
                                if(valSelCond.selectFijo !== null){
                                    idOpcion = valSelCond.selectFijo[0];
                                }

                                //UbSchema = 2,24,3,[7,1]
                                //UbModulo = 2,24,3,[indiceMod]
                                const [filaDatos,opciones,maxCantDatos] = this.obtengoIngredientesContCond(
                                    {idEtapa : ubicacionAbsInterior.idEtapa,idGrupo : ubicacionAbsInterior.idGrupo,idAtributo : ubicacionAbsInterior.idAtributo,idDato:[...arrayDato]},
                                    {idEtapa : ubicacionAbsInterior.idEtapa,idGrupo : ubicacionAbsInterior.idGrupo,idAtributo : ubicacionAbsInterior.idAtributo,idDato:[i]},
                                    idOpcion,
                                    indexSelCond
                                );

                                //Agrego opciones selectUsuario
                                for(let [key,value] of opciones.entries()){
                                    this.mapOpcionesSelect.set(key,value);
                                }

                                //Agrego FilaDatos a mapCC
                                contCondicional?.push(filaDatos);
                            }
                        }
                    }
                }
            }
        }
        
        console.log("Fin precomputo");
    }

    /*A(a:string):boolean{
        //mapContenidoCondicional.get(objectToString(ubicacionAbsolutaDeDato(dato.ubicacion,indiceInstancia)))
        let def :FilaDatos[][] = [];
        if(this.mapContenidoCondicional.get(a)){
            return true;
        }
        return false;
    }

    B(b:string):FilaDatos[][]{
        let def :FilaDatos[][] = [];
        let vuelta = this.mapContenidoCondicional.get(b);
        if(vuelta){
            return vuelta;
        }
        return def;
    }*/

    obtenerClaveSelectCondicional(ubicacionDato:Ubicacion,indicePadre:number,indiceHijo:number,idDatoCondicional:number):string{
        //Por ejemplo, Padre (modulo) indice 0, Hijo (unidad) indice 1, dato 2
        //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},1,2
        let nuevaUbicacion : Ubicacion = {
            idEtapa: ubicacionDato.idEtapa,
            idGrupo: ubicacionDato.idGrupo,
            idAtributo: ubicacionDato.idAtributo,
            idDato: [indicePadre]
        }
        return this.objectToString(nuevaUbicacion)+","+indiceHijo+","+idDatoCondicional;
    }

    obtengoOpcionesSelectUsuario(ubicacionAtr:Ubicacion, idDato:number[], ubicacionInteresado:Ubicacion, claveInteresado:string) : ValorSelect[] {
        let opcionesDevueltas : ValorSelect[] = [];
        let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionAtr,idDato);
        for(let [index,valorDato] of valoresDato.entries()){
            let stringOpcion = 'Nombre no asignado';
            if(valorDato.string){
                stringOpcion = valorDato.string;
            }
            if(valorDato.archivo && valorDato.archivo.texto){
                stringOpcion = valorDato.archivo.texto;
            }
            let nuevaOpcion : ValorSelect = {
                string:stringOpcion,
                muestroSi:null,
                valor:index
            }
            opcionesDevueltas.push(nuevaOpcion);
        }

        let ubicacionRef : Ubicacion = {
            idEtapa : ubicacionAtr.idEtapa
            ,idGrupo : ubicacionAtr.idGrupo
            ,idAtributo : ubicacionAtr.idAtributo
            ,idDato : [...idDato]
        }

        //Si dependo de alguien mas, debo de saber cuando ese alguien
        //mas cambia para actualizar y recomputar acorde
        let claveObservado = this.objectToString(ubicacionRef);
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
                observado:ubicacionRef,
                observado2:undefined,
                claveInteresado:claveInteresado,
                interesadoEscucha:retrievedEventEmitter
            }
            this.registrarDependencia.emit(registroDependencia);

            //Si cambia el dato observado, se llama esta funcion
            retrievedEventEmitter.subscribe((registroDependencia:RegistrarDependencia) => {
                let claveIntesado = registroDependencia.claveInteresado;
                let ubicacionDesarmada : Ubicacion = {
                    idEtapa: registroDependencia.observado.idEtapa,
                    idGrupo: registroDependencia.observado.idGrupo,
                    idAtributo: registroDependencia.observado.idAtributo,
                    idDato: null
                }

                //Reseteo los maps de opciones disponibles
                let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.observado.idDato);
                let array : ValorSelect[] = [];
                this.mapOpcionesSelect.set(claveIntesado!,array);
                let retrievedValue = this.mapOpcionesSelect.get(claveIntesado!);
                
                for(let [index,valorDato] of valoresDato.entries()){
                    let stringOpcion = 'Nombre no asignado';
                    if(valorDato.string){
                        stringOpcion = valorDato.string;
                    }
                    if(valorDato.archivo && valorDato.archivo.texto){
                        stringOpcion = valorDato.archivo.texto;
                    }
                    let nuevaOpcion : ValorSelect = {
                        string:stringOpcion,
                        muestroSi:null,
                        valor:index
                    }
                    retrievedValue!.push(nuevaOpcion);
                }
            });
        }
        return opcionesDevueltas;
    }

    obtengoOpcionesSelectFijo(idGrupoDatoFijo:number) : ValorSelect[] {
        let opcionesDevueltas : ValorSelect[] = [];
        //Proceso Datos Fijos
        let datosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;
        let datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === idGrupoDatoFijo);

        for (let opcion of datoFijo?.opciones!) {
            let nuevaOpcion : ValorSelect = {
                string:opcion.valor,
                muestroSi:opcion.muestroSi,
                valor:opcion.id
            }
            opcionesDevueltas.push(nuevaOpcion);
        }
        return opcionesDevueltas;
    }

    cargoOpcionesSelect(dato:Dato,claveMap:string,ubicacionAbsoluta:Ubicacion){
        if(dato.opciones.referencia){
            //Busco en los datos guardados la Ubicación dato.opciones.referencia
            let ubicacionDesarmada : Ubicacion = {
                idEtapa : dato.opciones.referencia.idEtapa
                ,idGrupo : dato.opciones.referencia.idGrupo
                ,idAtributo : dato.opciones.referencia.idAtributo
                ,idDato : null
            }

            let retrievedValue = this.mapOpcionesSelect.get(claveMap);
            if(!retrievedValue){
                let array : ValorSelect[] = this.obtengoOpcionesSelectUsuario(ubicacionDesarmada,dato.opciones.referencia.idDato!,ubicacionAbsoluta,claveMap);
                this.mapOpcionesSelect.set(claveMap,array);
            }
        }
        else{
            //Proceso Datos Fijos
            let datosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;
            let datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === dato.opciones.idGrupoDatoFijo);
            
            let retrievedValue = this.mapOpcionesSelect.get(claveMap);
            if(!retrievedValue){
                let array : ValorSelect[] = this.obtengoOpcionesSelectFijo(dato.opciones.idGrupoDatoFijo);
                this.mapOpcionesSelect.set(claveMap,array);
            }
            for (let opcion of datoFijo?.opciones!) {

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
                            observado2:undefined,
                            claveInteresado:null,
                            interesadoEscucha:retrievedEventEmitter
                        }
                        this.registrarDependencia.emit(registroDependencia);

                        //Si cambia el dato observado, se llama esta funcion
                        retrievedEventEmitter.subscribe((registroDependencia:RegistrarDependencia) => {
                            let claveIntesado = this.objectToString(registroDependencia.interesado);

                            //Reseteo el valor guardado y el mapOpcionSeleccionada
                            //cargarInfoPrevia se encarga de seleccionar la primer opcion by default
                            let ubicacionDesarmada : Ubicacion = {
                                idEtapa : registroDependencia.interesado.idEtapa
                                ,idGrupo : registroDependencia.interesado.idGrupo
                                ,idAtributo : registroDependencia.interesado.idAtributo
                                ,idDato : null
                            }
                            let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.interesado.idDato);
                            valoresDato[0].selectFijo = null;
                            this.mapOpcionSeleccionada.delete(claveIntesado);
                        });
                    }
                }
            }
        }
    }

    /*pruebaOpciones(clave:string){
        let ret = this.mapOpcionesSelect.get(clave);
        return ret;
    }*/

    filaDatosConContCondicional(filaDatos: FilaDatos[]):boolean{
        for(let fila of filaDatos){
            for(let dato of fila.datos){
                if(dato.idContenidoCondicional !== null){
                    return true;
                }
            }
        }
        return false;
    }

    cargarDatosDesdeHerencia(){
        let infoHerdada : InformacionGuardada = JSON.parse(JSON.stringify(this.buscoInformacionGuardadaDeAtributo(this.atributo.herencia)!));
        let infoActual : InformacionGuardada = this.buscoInformacionGuardadaDeAtributo(this.ubicacionAbsolutaDeAtributo(this.atributo.ubicacion,this.atributo.id))!;
        
        //Busco si infoActual tiene un Dato que infoHeredada no tiene
        let valsAtribActual = infoActual!.valoresAtributo;
        let valsAtribHeredado = infoHerdada!.valoresAtributo;
        let idsNuevos : number[][] = [];
        for(let valAtribA of valsAtribActual){
            let encontreIDDato = false;
            for(let valAtribH of valsAtribHeredado){
                if(JSON.stringify(valAtribH.idDato)===JSON.stringify(valAtribA.idDato)){
                    encontreIDDato = true;
                    break;
                }
            }
            if(!encontreIDDato){
                idsNuevos.push(valAtribA.idDato);
            }
        }
        //Copio Datos Heredados
        infoActual.cantidadInstancias = infoHerdada.cantidadInstancias;
        infoActual.valoresAtributo = [];
        for(let valAtribH of valsAtribHeredado){
            infoActual.valoresAtributo.push(valAtribH);
        }
        //Agrego Datos nuevos que no tenia el Atr Heredado
        for(let arrayIDs of idsNuevos){
            let nuevoValAtrib : ValoresAtributo = {
                idDato:arrayIDs,
                valoresDato:[]
            }
            for (let i = 1; i <= infoActual.cantidadInstancias; i++) {
                let valDato : ValoresDato = {
                    string:null,
                    number:null,
                    selectFijo:null,
                    selectUsuario:null,
                    archivo:null,
                    date:null
                }
                nuevoValAtrib.valoresDato.push(valDato);
            }
            infoActual.valoresAtributo.push(nuevoValAtrib);
        }

        //Actualizo estructuras del render
        var [atributoHerencia,_a,_b] = this.getAtributoHerencia(this.atributo.herencia)
        var copyAtributoHerencia = JSON.parse(JSON.stringify(atributoHerencia!));
        if (copyAtributoHerencia){
            for(let filaDatos of copyAtributoHerencia.filasDatos){
                for(let dato of filaDatos.datos){
                    //Le cambio los ID a los datos heredados
                    dato.ubicacion.idEtapa = this.atributo.ubicacion.idEtapa;
                    dato.ubicacion.idGrupo = this.atributo.ubicacion.idGrupo;
                    dato.ubicacion.idAtributo =  this.atributo.id;
                }
            }
            copyAtributoHerencia.ubicacion.idEtapa = this.atributo.ubicacion.idEtapa;
            copyAtributoHerencia.ubicacion.idGrupo = this.atributo.ubicacion.idGrupo;
            copyAtributoHerencia.ubicacion.idAtributo = this.atributo.ubicacion.idAtributo;
            copyAtributoHerencia.ubicacion.idDato = this.atributo.ubicacion.idDato;
            //Asigno variable atributoHerencia que imprime en UI
            this.atributoHerencia =  copyAtributoHerencia;
        }
        //Reseteo Opciones Seleccionadas para que se actualice en UI las opciones de la Herencia
        this.mapOpcionesSeleccionadas = new Map();
        //Reseteo Archivos para que se actualice la UI con nuevos datos
        this.mapDatoArchivo = new Map();
        //Resteo Opcion Seleccionada para actualizar UI
        this.mapOpcionSeleccionada = new Map();
        //Persisto nuevos datos
        this.accionesCursosService.modificarCurso();

        /*if (this.atributo.herencia){
            
            //Codigo que contempla atributo.herencia != null Y atributo.filaDatos != null
            let infoHerdada : InformacionGuardada = JSON.parse(JSON.stringify(this.buscoInformacionGuardadaDeAtributo(this.atributo.herencia)!));
            let infoActual : InformacionGuardada = this.buscoInformacionGuardadaDeAtributo(this.ubicacionAbsolutaDeAtributo(this.atributo.ubicacion,this.atributo.id))!;
            //Busco si infoActual tiene un Dato que infoHeredada no tiene
            let valsAtribActual = infoActual!.valoresAtributo;
            let valsAtribHeredado = infoHerdada!.valoresAtributo;
            let idsNuevos : number[][] = [];
            for(let valAtribA of valsAtribActual){
                let encontreIDDato = false;
                for(let valAtribH of valsAtribHeredado){
                    if(JSON.stringify(valAtribH.idDato)===JSON.stringify(valAtribA.idDato)){
                        encontreIDDato = true;
                        break;
                    }
                }
                if(!encontreIDDato){
                    idsNuevos.push(valAtribA.idDato);
                }
            }

            // esto esta mal porque es el schema, yo tengo que traer los datos guardados para poder llamar al valoresDato
            var [atributoHerencia,_a,_b] = this.getAtributoHerencia(this.atributo.herencia)
            var copyAtributoHerencia = JSON.parse(JSON.stringify(atributoHerencia!));
            if (copyAtributoHerencia){
                // atributoHerencia.ubicacion = this.atributo.ubicacion
                for(let filaDatos of copyAtributoHerencia.filasDatos){
                    for(let dato of filaDatos.datos){

                        var datoUbicacion = JSON.parse(JSON.stringify(this.atributo.ubicacion));
                        datoUbicacion.idAtributo = this.atributo.id
                        datoUbicacion.idDato = []
                        datoUbicacion.idDato.push(dato.id)
                        var valoresAtributo : ValoresAtributo[] | undefined
                        var cantidadInstancias = 0
                        if(this.versionActual !== undefined){
                            for(let datoGuardado of this.versionActual.datosGuardados!){
                                
                                if (datoGuardado.ubicacionAtributo.idEtapa === this.atributo.herencia.idEtapa
                                    && datoGuardado.ubicacionAtributo.idGrupo === this.atributo.herencia.idGrupo
                                    && datoGuardado.ubicacionAtributo.idAtributo === this.atributo.herencia.idAtributo
                                ){
                                    valoresAtributo = datoGuardado.valoresAtributo
                                    cantidadInstancias = datoGuardado.cantidadInstancias
                                }
                            }
                        }    

                        if(this.versionActual !== undefined){
                            for(let datoGuardado of this.versionActual.datosGuardados!){
                                
                                if (datoGuardado.ubicacionAtributo.idEtapa === this.atributo.ubicacion.idEtapa
                                    && datoGuardado.ubicacionAtributo.idGrupo === this.atributo.ubicacion.idGrupo
                                    && datoGuardado.ubicacionAtributo.idAtributo === this.atributo.id
                                ){
                                    //Encontré el Atributo, le piso los valores atributo con el nuevo
                                    if (valoresAtributo){
                                        datoGuardado.cantidadInstancias = cantidadInstancias
                                        datoGuardado.valoresAtributo = JSON.parse(JSON.stringify(valoresAtributo));
                                        
                                        var datoHeredado = JSON.parse(JSON.stringify(dato));
                                        datoHeredado.ubicacion = datoGuardado.ubicacionAtributo
                                        let ubicacionAbsoluta = this.ubicacionAbsolutaDeDato(datoHeredado.ubicacion,dato.id);
                                        let claveMap = this.objectToString(ubicacionAbsoluta);
                                        //Computo opciones de los Select del Atributo
                                        if(datoHeredado.opciones){
                                            this.cargoOpcionesSelect(datoHeredado,claveMap,ubicacionAbsoluta);
                                        }
                                        //Computo del dato computo
                                        if(datoHeredado.computo){
                                            this.procesarDatoComputo(datoHeredado.computo,ubicacionAbsoluta);
                                        }
                                        //Computo opciones de los Select del Atributo de contenidoCondicional
                                        if(datoHeredado.filasDatos !== null){

                                        }

                                        //Agrego Datos nuevos a la Base
                                        for(let arrayIDs of idsNuevos){
                                            let nuevoValAtrib : ValoresAtributo = {
                                                idDato:arrayIDs,
                                                valoresDato:[]
                                            }
                                            for (let i = 1; i <= datoGuardado.cantidadInstancias; i++) {
                                                let valDato : ValoresDato = {
                                                    string:null,
                                                    number:null,
                                                    selectFijo:null,
                                                    selectUsuario:null,
                                                    archivo:null,
                                                    date:null
                                                }
                                                nuevoValAtrib.valoresDato.push(valDato);
                                            }
                                            datoGuardado.valoresAtributo.push(nuevoValAtrib);
                                        }
                                    }
                                }
                            }
                        }
                        
                        //Le cambio los ID a los datos heredados
                        dato.ubicacion.idEtapa = this.atributo.ubicacion.idEtapa;
                        dato.ubicacion.idGrupo = this.atributo.ubicacion.idGrupo;
                        dato.ubicacion.idAtributo =  this.atributo.id;

                        this.informarCambio.emit(datoUbicacion);
                        // break
                    }
                    break;
                }

                //Reseteo Opciones Seleccionadas para que se actualice en UI las opciones de la Herencia
                this.mapOpcionesSeleccionadas = new Map();
                //Reseteo Archivos para que se actualice la UI con nuevos datos
                this.mapDatoArchivo = new Map();

                //Resteo Opcion Seleccionada para actualizar UI
                this.mapOpcionSeleccionada = new Map();

                this.accionesCursosService.modificarCurso();

                copyAtributoHerencia.ubicacion.idEtapa = this.atributo.ubicacion.idEtapa;
                copyAtributoHerencia.ubicacion.idGrupo = this.atributo.ubicacion.idGrupo;
                copyAtributoHerencia.ubicacion.idAtributo = this.atributo.ubicacion.idAtributo;
                copyAtributoHerencia.ubicacion.idDato = this.atributo.ubicacion.idDato;

                this.atributoHerencia =  copyAtributoHerencia;
            }
        }*/
    }

    getAtributoHerencia(ubicacion: Ubicacion): [Atributo|null,Grupo|null,Etapa|null]{ //retorna un Dato completo
        if (this.initialSchemaService.defaultSchema){
            for(let etapa of this.initialSchemaService.defaultSchema?.etapas){
                for(let grupo of etapa.grupos){
                    for(let atributo of grupo.atributos){
                        
                        if (atributo.ubicacion.idEtapa == ubicacion.idEtapa
                            && atributo.ubicacion.idGrupo == ubicacion.idGrupo
                            && atributo.id == ubicacion.idAtributo){
                            if (atributo.herencia){
                                const [atributoHerencia,,] = this.getAtributoHerencia(atributo.herencia);
                                return [atributoHerencia, grupo, etapa]
                            }
                            else{
                                return [atributo, grupo, etapa]
                            }    
                        }
                    }
                }
            }
        }
        return [null,null,null];
    }

    agregarInstanciaAtributo(ubicacion:Ubicacion,idAtributo:number) {
        let ubicacionAtr : Ubicacion = {
            idEtapa : ubicacion.idEtapa,
            idGrupo : ubicacion.idGrupo,
            idAtributo : idAtributo,
            idDato : null
        }
        
        let infoGuardada : InformacionGuardada | null = this.buscoInformacionGuardadaDeAtributo(ubicacionAtr);
        if(infoGuardada !== null){
            //Si es un Modulo (Contenido Condicional), tengo que acomodar las Unidades
            const [esAtrCC,arrayIDDato] = this.esAtributoConContenidoCondicional(ubicacionAtr,idAtributo);
            if(esAtrCC){
                //Construyo Ubicacion de Unidad
                //2,24,3,[indiceModulo,7,1]
                let ubicacionUnidad : Ubicacion = {
                    idEtapa:ubicacionAtr.idEtapa,
                    idGrupo:ubicacionAtr.idGrupo,
                    idAtributo:ubicacionAtr.idAtributo,
                    idDato:[...arrayIDDato]
                }
                ubicacionUnidad.idDato?.unshift(infoGuardada.cantidadInstancias);

                //Construyo Ubicacion del map CC
                let ubicacionContCondicional : Ubicacion = {
                    idEtapa:ubicacionAtr.idEtapa,
                    idGrupo:ubicacionAtr.idGrupo,
                    idAtributo:ubicacionAtr.idAtributo,
                    idDato:[infoGuardada.cantidadInstancias]
                }
                //Creo lugar para Unidad en BDat
                let infoGuardadaUnidad : InformacionGuardada = {
                    ubicacionAtributo:ubicacionUnidad,
                    cantidadInstancias:1,
                    comentariosPrivados:[],
                    valoresAtributo:[]
                }
                //Agrego como valAtrib el idDato = [7,1]
                infoGuardadaUnidad.valoresAtributo.push(
                    {
                        idDato:[...arrayIDDato],
                        valoresDato:[
                            {
                                string:null,
                                number:null,
                                selectFijo:null,
                                selectUsuario:null,
                                archivo:null,
                                date:null
                            }
                        ]
                    }
                );
                //Agrego en map CC las filaDatos
                //Cargo las opciones selectMultipleUsuario de CC
                //UbSchema = 2,24,3,[7,1]
                //UbModulo = 2,24,3,[indiceMod]
                const [filaDatos,opciones,maxCantDatos] = this.obtengoIngredientesContCond(
                    {idEtapa:ubicacionAtr.idEtapa,idGrupo:ubicacionAtr.idGrupo,idAtributo:ubicacionAtr.idAtributo,idDato:[...arrayIDDato]},
                    ubicacionContCondicional,
                    0,
                    0
                );
                
                //Agrego como valsAtrib los idDato = [7,1,idDato]
                for(let i = 1; i<=maxCantDatos;i++){
                    let nuevoArrayDato = [...arrayIDDato];
                    nuevoArrayDato.push(i);
                    infoGuardadaUnidad.valoresAtributo.push(
                        {
                            idDato:nuevoArrayDato,
                            valoresDato:[
                                {
                                    string:null,
                                    number:null,
                                    selectFijo:null,
                                    selectUsuario:null,
                                    archivo:null,
                                    date:null
                                }
                            ]
                        }
                    );
                }
                //Agrego opciones selectUsuario
                for(let [key,value] of opciones.entries()){
                    this.mapOpcionesSelect.set(key,value);
                }

                //Agrego FilaDatos a mapCC
                this.mapContenidoCondicional.set(this.objectToString(ubicacionContCondicional),[filaDatos]);

                this.versionActual!.datosGuardados!.push(infoGuardadaUnidad);
            }

            let valsAtrib : ValoresAtributo[] = infoGuardada.valoresAtributo;
            for(let datoDentroAtributo of valsAtrib){
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
            infoGuardada.cantidadInstancias++;
            this.accionesCursosService.modificarCurso();
            //Por cada Dato del Atributo creado, emito por si alguien más depende de el
            let datosDeAtrib : Dato[] = this.datosDeAtributo(ubicacionAtr);
            for(let dato of datosDeAtrib){
                let ubicacionDato = this.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                this.informarCambio.emit(ubicacionDato);
            }
        }
    }

    agregarUnidades(dato: Dato,ubicacion:Ubicacion,idAtributo:number,idModulo:number) {

        let datoInterior = dato.filasDatos[0].datos[0];

        var ubicacionAtr: Ubicacion = {
            idEtapa : ubicacion.idEtapa,
            idGrupo : ubicacion.idGrupo,
            idAtributo : idAtributo,
            idDato : [idModulo,dato.id,datoInterior.id]
        }

        let infoGuardada : InformacionGuardada | null= this.buscoInformacionGuardadaDeAtributo(ubicacionAtr);
        let indiceNuevoHijo = 0;
        if(infoGuardada !==null){
            //Reseteo los datos de la nueva instancia
            for(let datoDentroAtributo of infoGuardada.valoresAtributo!){
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
            infoGuardada.cantidadInstancias++;
            indiceNuevoHijo = infoGuardada.cantidadInstancias-1;
        }

        let ubicacionContCondicional : Ubicacion = {
            idEtapa : ubicacionAtr.idEtapa,
            idGrupo : ubicacionAtr.idGrupo,
            idAtributo : ubicacionAtr.idAtributo,
            idDato : [idModulo]
        }

        let clavePadreContCondicional = this.objectToString(ubicacionContCondicional);
        var contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);

        //UbSchema = 2,24,3,[7,1]
        //UbModulo = 2,24,3,[indiceMod]
        const [filaDatos,opciones,maxCantDatos] = this.obtengoIngredientesContCond(
            {idEtapa : ubicacion.idEtapa,idGrupo : ubicacion.idGrupo,idAtributo : idAtributo,idDato : [dato.id,datoInterior.id]},
            ubicacionContCondicional,
            0,
            indiceNuevoHijo
        );

        //Agrego opciones selectUsuario
        for(let [key,value] of opciones.entries()){
            this.mapOpcionesSelect.set(key,value);
        }

        //Agrego FilaDatos a mapCC
        contCondicional?.push(filaDatos);

        this.accionesCursosService.modificarCurso();
    }

    openSelectFileDialog(ubicacion:Ubicacion,indicePadre:number,indiceHijo:number|null){
        //Varios Datos usan el FileUploader, se setean las coordenadas para
        //para saber donde guardar lo que se seleccione
        let fileUploader = this.fileUploader.nativeElement;
        fileUploader.setAttribute('idEtapa',ubicacion.idEtapa.toString());
        fileUploader.setAttribute('idGrupo',ubicacion.idGrupo.toString());
        fileUploader.setAttribute('idAtributo',ubicacion.idAtributo.toString());
        let acumuladorIDDato:string|null=null;
        for(let idDato of ubicacion.idDato!){
            if(acumuladorIDDato === null){
                acumuladorIDDato=idDato.toString();
            }
            else{
                acumuladorIDDato=acumuladorIDDato+","+idDato.toString();
            }
        }
        fileUploader.setAttribute('idDato',acumuladorIDDato);
        fileUploader.setAttribute('indicePadre',indicePadre.toString());
        if(indiceHijo!=null){
            fileUploader.setAttribute('indiceHijo',indiceHijo.toString());
        }
        else if(fileUploader.getAttribute('indiceHijo')!=null){
            fileUploader.removeAttribute('indiceHijo');
        }
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
            let indicePadre = fileUploader.getAttribute('indicePadre');
            let claveMap = this.objectToString(ubicacion)+indicePadre;

            //Si es un Archivo de CC, viene el IndiceHijo
            let indiceHijo = fileUploader.getAttribute('indiceHijo');
            if(indiceHijo!=null){
                //Cambio clave para que reconozca Unidades
                claveMap = this.objectToString(ubicacion)+indicePadre+','+indiceHijo;
            }

            let archivoCargado = this.mapDatoArchivo.get(claveMap);
            let insideThis = this;
            if(archivoCargado !== undefined){

                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    if (typeof reader.result === 'string') {
                        archivoCargado!.fileName = file.name;
                        let idArchivo = insideThis.agregarArchivo(reader.result);
                        archivoCargado!.fileId = idArchivo;
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

    eliminarArchivo(ubicacion:Ubicacion,indicePadre:number,indiceHijo:number|null){
        let claveMap = this.objectToString(ubicacion)+indicePadre;
        if(indiceHijo!=null){
            claveMap=claveMap+','+indiceHijo;
        }
        let archivoCargado = this.mapDatoArchivo.get(claveMap);
        if(archivoCargado !== undefined){
            archivoCargado!.fileName = null;
            let idEliminar = archivoCargado!.fileId!;
            archivoCargado!.fileId = null;
            this.eliminarArchivoDeBase(idEliminar);
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

    guardarCambio(ubicacion:Ubicacion,idDato:number,indice:number,tipoInput:TipoInput,nuevoValor:any){
        
        let valoresDato = this.buscoValoresDatoDeAtributo(ubicacion,[idDato]);
        if(valoresDato.length !== 0){
            //let claveMap = this.objectToString(ubicacion)+indice;
            let claveMap = this.objectToString(this.ubicacionAbsolutaDeDato(ubicacion,idDato))+indice;
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
                        let valoresAGuardar:number[] = [];
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
                        let valoresAGuardar:number[] = [];
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
                    valoresDato[indice].date = nuevoValor.value
                    break;
                }
                default:
                    break;
            }
            let ubicacionAbs : Ubicacion = {
                idEtapa: ubicacion.idEtapa,
                idGrupo: ubicacion.idGrupo,
                idAtributo: ubicacion.idAtributo,
                idDato: [idDato]
            }
            this.informarCambio.emit(ubicacionAbs);
            this.accionesCursosService.modificarCurso();
        }
    }

    guardarCambioContenidoCondicional(ubicacion:Ubicacion,idDato:number,indicePadre:number,indiceHijo:number,tipoInput:TipoInput,nuevoValor:any){
        
        const [ubicacionAtributo, arrayIdDato] = this.ubicacionContenidoCondicional(ubicacion,idDato,indicePadre);

        //ubicacionClaveMap = "{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[7,1]}
        let ubicacionClaveMap : Ubicacion = {
            idEtapa:ubicacionAtributo.idEtapa,
            idGrupo:ubicacionAtributo.idGrupo,
            idAtributo:ubicacionAtributo.idAtributo,
            idDato:[...arrayIdDato]
        }
        
        let valoresDato : ValoresDato[]= this.buscoValoresDatoDeAtributo(ubicacionAtributo,arrayIdDato);
        if(valoresDato.length !== 0){
            //calveMap = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[7,1]}0,0'
            let claveMap = this.objectToString(ubicacionClaveMap)+indicePadre+','+indiceHijo;
            switch (tipoInput) {
                case TipoInput.text:{
                    valoresDato[indiceHijo].string = nuevoValor.value;
                    break;
                }
                case TipoInput.number:{
                    valoresDato[indiceHijo].number = Number(nuevoValor.value);
                    break;
                }
                case TipoInput.selectFijoUnico:{
                    let valueObject = this.stringToObject(nuevoValor.value);

                    //Elimino Archivo
                    this.eliminarArchivo(ubicacionClaveMap,indicePadre,indiceHijo);

                    //Reseteo datos guardados del CC viejo - los de la forma 2,24,3,[7,1,idDato]
                    let valoresAtributo : ValoresAtributo[] = this.buscoValoresAtributoDeAtributo(ubicacionAtributo);
                    for(let valorAtributo of valoresAtributo){
                        //Si tiene archivo, intento eliminarlo
                        if(valorAtributo.valoresDato[indiceHijo].archivo!=null 
                            && valorAtributo.valoresDato[indiceHijo].archivo?.fileId != null
                        ){
                            this.eliminarArchivo(
                                {
                                    idEtapa:ubicacionClaveMap.idEtapa,
                                    idGrupo:ubicacionClaveMap.idGrupo,
                                    idAtributo:ubicacionClaveMap.idAtributo,
                                    idDato:[...valorAtributo.idDato]
                                }
                                ,indicePadre
                                ,indiceHijo
                            );
                        }
                        valorAtributo.valoresDato[indiceHijo] = {
                            string : null,
                            number: null,
                            selectFijo: null,
                            selectUsuario: null,
                            archivo: null,
                            date: null
                        }
                    }

                    //Actualizo datos guardados en archivo - en 2,24,3,[7,1]
                    if(valoresDato[indiceHijo].selectFijo){
                        valoresDato[indiceHijo].selectFijo![0] = valueObject;
                    }
                    else{
                        valoresDato[indiceHijo].selectFijo = [valueObject];
                    }
                    
                    //Por ejemplo, Padre (modulo) indice 0
                    //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]}"
                    let ubicacionContCondicional : Ubicacion = {
                        idEtapa:ubicacionAtributo.idEtapa,
                        idGrupo:ubicacionAtributo.idGrupo,
                        idAtributo:ubicacionAtributo.idAtributo,
                        idDato:[indicePadre]
                    }
                    let clavePadreContCondicional = this.objectToString(ubicacionContCondicional);
                    let contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                    if(contCondicional !== undefined){
                        //Elimino eventos de dependencia de los selectUsuario viejos
                        for(let fD of contCondicional[indiceHijo]){
                            for(let dat of fD.datos){
                                switch (this.mapTipoInput.revGet(dat.tipo)) {
                                    case TipoInput.selectUsuarioMultiple:{
                                        //EMITO
                                        //claveInteresado = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},0,3'
                                        this.eliminarDependencia.emit(this.objectToString({
                                            idEtapa:ubicacionAtributo.idEtapa,
                                            idGrupo:ubicacionAtributo.idGrupo,
                                            idAtributo:ubicacionAtributo.idAtributo,
                                            idDato:[indicePadre]
                                        })+","+indiceHijo+","+dat.id);
                                    }
                                }
                            }
                        }

                        //UbSchema = 2,24,3,[7,1]
                        //UbModulo = 2,24,3,[indiceMod]
                        const [filaDatos,opciones,maxCantDatos] = this.obtengoIngredientesContCond(
                            ubicacionClaveMap,
                            ubicacionContCondicional,
                            valueObject,
                            indiceHijo
                        );

                        //Agrego opciones selectUsuario
                        for(let [key,value] of opciones.entries()){
                            this.mapOpcionesSelect.set(key,value);
                        }

                        //Agrego FilaDatos a mapCC
                        contCondicional[indiceHijo] = filaDatos;

                        //Reseteo las opciones seleccionadas anteriormente en UI
                        this.mapOpcionesSeleccionadas = new Map();
                        //Reseteo map de archivos
                        this.mapDatoArchivo = new Map();
                    }
                    break;
                }
                case TipoInput.selectUsuarioMultiple:{

                    if(nuevoValor.value.length === 0){
                        valoresDato[indiceHijo].selectUsuario = null;
                    }
                    else{
                        let valoresAGuardar:number[] = [];
                        for(let valor of nuevoValor.value){
                            valoresAGuardar.push(valor);
                        }
                        valoresDato[indiceHijo].selectUsuario = valoresAGuardar;
                    }
                    break;
                }
                case TipoInput.date:{
                    valoresDato[indiceHijo].date = nuevoValor.value
                    break;
                }
                case TipoInput.archivo:{
                    let archivoCargado = this.mapDatoArchivo.get(claveMap);
                    if(archivoCargado !== undefined){
                        archivoCargado.texto = nuevoValor.value;
                    }
                    break;
                }
                default:
                    break;
            }
            this.accionesCursosService.modificarCurso();
            console.log("Curso Actualizado.");
        }
    }

    cargarInfoPrevia(ubicacion:Ubicacion, idDato:number, indice:number, tipoInput: TipoInput, posibleValor:any) : any {
        
        let valoresDato = this.buscoValoresDatoDeAtributo(ubicacion,[idDato]);
        if(valoresDato.length !== 0){
            let claveMap = this.objectToString(this.ubicacionAbsolutaDeDato(ubicacion,idDato))+indice;
            switch (tipoInput) {
                case TipoInput.text:{
                    return valoresDato[indice!].string;
                }
                case TipoInput.date:{
                    return valoresDato[indice!].date;
                }
                case TipoInput.number:{
                    return valoresDato[indice!].number;
                }
                case TipoInput.selectFijoUnico:{

                    let estaOpcionEstaSeleccionada = false;
                    let value = this.mapOpcionSeleccionada.get(claveMap);
                    //Checkeo que solo se compute una vez este codigo
                    if(value === undefined){
                        if(valoresDato[indice!]?.selectFijo){
                            estaOpcionEstaSeleccionada = posibleValor === valoresDato[indice!].selectFijo![0];
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
                            valoresDato[indice!].selectFijo = [posibleValor];
                            this.mapOpcionSeleccionada.set(
                                claveMap,
                                posibleValor
                            );
                        }
                    }
                    else{
                        estaOpcionEstaSeleccionada = posibleValor === value;
                    }

                    return estaOpcionEstaSeleccionada;
                }
                case TipoInput.selectFijoMultiple:{
                    let valoresSeleccionados = this.mapOpcionesSeleccionadas.get(claveMap);
                    if(valoresSeleccionados === undefined){
                        let vuelta : number[] = [];
                        if(valoresDato[indice!]?.selectFijo){
                            vuelta = valoresDato[indice!].selectFijo!;
                        }
                        this.mapOpcionesSeleccionadas.set(claveMap,vuelta);
                    }
                    valoresSeleccionados = this.mapOpcionesSeleccionadas.get(claveMap);
                    return valoresSeleccionados;
                }
                case TipoInput.radio:{

                    let estaOpcionEstaSeleccionada = false;
                    if(valoresDato[indice!]?.selectFijo){
                        estaOpcionEstaSeleccionada = posibleValor === valoresDato[indice!].selectFijo![0];
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
                        if(valoresDato[indice!].number !== null){
                            valorParaControl = valoresDato[indice!].number!;
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
                        if(valoresDato[indice!]?.archivo == null){
                            let nuevoDatoArchivo : DatoArchivo= {
                                texto:null,
                                fileName:null,
                                fileId:null,
                                ruta:null
                            }
                            valoresDato[indice!]!.archivo = nuevoDatoArchivo;
                        }
                        this.mapDatoArchivo.set(claveMap,valoresDato[indice!]?.archivo!);
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
                        if(valoresDato[indice!]?.selectUsuario){
                            vuelta = valoresDato[indice!].selectUsuario!;
                        }
                        this.mapOpcionesSeleccionadas.set(claveMap,vuelta);
                    }
                    valoresSeleccionados = this.mapOpcionesSeleccionadas.get(claveMap);
                    return valoresSeleccionados;
                    //return this.mapOpcionesSeleccionadas.get(claveMap);
                }
                default:
                    return "null_default";
            }
        }
        
        return "";
    }

    cargarInfoPreviaContenidoCondicional(ubicacion:Ubicacion, idDato:number, indicePadre:number,indiceHijo:number,tipoInput: TipoInput, posibleValor:any) : any {
        
        const [ubicacionAtributo, arrayIdDato] = this.ubicacionContenidoCondicional(ubicacion,idDato,indicePadre);
        
        /*if(this.objectToString(arrayIdDato)==="[7,1,2]" && indicePadre===0 && indiceHijo===0){
            console.log("aca");
        }*/

        let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionAtributo,arrayIdDato);
        if(valoresDato.length !== 0){
            //calveMap = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[7,1]}0,0'
            let claveMap = this.objectToString(this.ubicacionAbsolutaDeDato(ubicacion,idDato))+indicePadre+','+indiceHijo;
            switch (tipoInput) {
                case TipoInput.text:{
                    return valoresDato[indiceHijo].string;
                }
                case TipoInput.date:{
                    return valoresDato[indiceHijo].date;
                }
                case TipoInput.number:{
                    return valoresDato[indiceHijo].number;
                }
                case TipoInput.selectFijoUnico:{
                    
                    let estaOpcionEstaSeleccionada = false;
                    if(valoresDato[indiceHijo]?.selectFijo){
                        let varlorGuardado = valoresDato[indiceHijo].selectFijo![0];
                        estaOpcionEstaSeleccionada = posibleValor === varlorGuardado;
                    }
                    else{
                        estaOpcionEstaSeleccionada=true;
                        valoresDato[indiceHijo].selectFijo = [posibleValor];
                    }

                    return estaOpcionEstaSeleccionada;
                }
                case TipoInput.selectUsuarioMultiple:{
                    let valoresSeleccionados = this.mapOpcionesSeleccionadas.get(claveMap);
                    if(valoresSeleccionados === undefined){
                        let vuelta : number[] = [];
                        if(valoresDato[indiceHijo]?.selectUsuario){
                            vuelta = valoresDato[indiceHijo].selectUsuario!;
                        }
                        this.mapOpcionesSeleccionadas.set(claveMap,vuelta);
                    }
                    valoresSeleccionados = this.mapOpcionesSeleccionadas.get(claveMap);
                    return valoresSeleccionados;
                    //return this.mapOpcionesSeleccionadas.get(claveMap);
                }
                case TipoInput.archivo:{
                    let archivoCargado = this.mapDatoArchivo.get(claveMap);
                    if(archivoCargado === undefined){
                        if(valoresDato[indiceHijo!]?.archivo == null){
                            let nuevoDatoArchivo : DatoArchivo= {
                                texto:null,
                                fileName:null,
                                fileId:null,
                                ruta:null
                            }
                            valoresDato[indiceHijo!]!.archivo = nuevoDatoArchivo;
                        }
                        this.mapDatoArchivo.set(claveMap,valoresDato[indiceHijo!]?.archivo!);
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
                default:
                    return "null_default";
            }
        }
        return "null_fin";
    }

    addLinkHTML(string: string){
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return string.replace(urlRegex, function(url) {
            return `<a href=${url} target=_blank>` + url + '</a>';
        })
    }

    downloadUserFile(ubicacion:Ubicacion,indicePadre:number,indiceHijo:number|null){
        let claveMap = this.objectToString(ubicacion)+indicePadre;
        if(indiceHijo!=null){
            claveMap=claveMap+','+indiceHijo;
        }
        let archivoCargado = this.mapDatoArchivo.get(claveMap);
        if(archivoCargado !== undefined){
            if(archivoCargado?.fileName !== null){
                
                let fileDownloader = this.fileDownloader.nativeElement;
                let [archivo,] = this.obtenerArchivoCargadoById(archivoCargado.fileId!);
                fileDownloader.setAttribute('href',archivo.b64);
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
    
    ubicacionAbsolutaDeAtributo(ubicacion:Ubicacion,idAtributo:number){
        return {
            idEtapa : ubicacion.idEtapa,
            idGrupo : ubicacion.idGrupo,
            idAtributo : idAtributo,
            idDato : null
        }
    }

    ubicacionAbsolutaDeDato(ubicacion:Ubicacion,idDato:number) : Ubicacion {
        let idDatoAbsoluto:number[] = [];
        if(ubicacion.idDato){
            idDatoAbsoluto = [...ubicacion.idDato];
        }
        idDatoAbsoluto.push(idDato);
        return {
            idEtapa : ubicacion.idEtapa,
            idGrupo : ubicacion.idGrupo,
            idAtributo : ubicacion.idAtributo,
            idDato : idDatoAbsoluto
        }
    }

    ubicacionContenidoCondicional(ubicacion:Ubicacion,idDato:number,indicePadre:number) : [Ubicacion,number[]]{
        let ubicacionAtributo : Ubicacion = {
            idEtapa:ubicacion.idEtapa,
            idGrupo:ubicacion.idGrupo,
            idAtributo:ubicacion.idAtributo,
            idDato:[...ubicacion.idDato!]
        }
        let arrayIdDato : number[] = [...ubicacionAtributo.idDato!];
        if(ubicacion.idDato !== null && ubicacion.idDato.length === 2){
            //Caso de Dato de Contenido Condicional
            //arrayIdDato = [7,1,idDato]
            arrayIdDato.push(idDato);
        }
        else{
            //Caso SelectFijoUnico que determina Contenido Condicional
            //ubicacionAtributo = 2,24,3,[7,1]
            ubicacionAtributo = this.ubicacionAbsolutaDeDato(ubicacion,idDato);
            //arrayIdDato = [7,1]
            arrayIdDato = [...ubicacionAtributo.idDato!];
        }
        //ubicacionAtributo = 2,24,3,[indicePadre,7,1]
        ubicacionAtributo.idDato!.unshift(indicePadre);
        return [ubicacionAtributo,arrayIdDato];
    }

    objectToString(obj:any){

        return JSON.stringify(obj);
    }

    stringToObject(string:string){
        return JSON.parse(string);
    }

    buscoInformacionGuardadaDeAtributo(ubicacion:Ubicacion) : InformacionGuardada | null{
        if(this.versionActual !== undefined){
            for(let datoGuardado of this.versionActual.datosGuardados!){
                //Busco por "ubicacionAtributo"
                //ordeno los atributos dentro del objeto para asegurar que no de distinto por un orden diferente
                var ordered = Object.keys(datoGuardado.ubicacionAtributo).sort().reduce(
                    (obj, key) => { 
                      obj[key] = datoGuardado.ubicacionAtributo[key]; 
                      return obj;
                    }, 
                    {}
                  );
        
                let datoUbiAtr = this.objectToString(ordered)

                ordered = Object.keys(ubicacion).sort().reduce(
                    (obj, key) => { 
                      obj[key] = ubicacion[key]; 
                      return obj;
                    }, 
                    {}
                  );
                let claveUbiAtr = this.objectToString(ordered)

                if(datoUbiAtr === claveUbiAtr){
                    return datoGuardado;
                }
            }
        }
        return null;
    }

    buscoValoresAtributoDeAtributo(ubicacion:Ubicacion) : ValoresAtributo[]{
        let inforGuardada : InformacionGuardada | null = this.buscoInformacionGuardadaDeAtributo(ubicacion);
        if(inforGuardada !== null){
            return inforGuardada.valoresAtributo;
        }
        return [];
    }

    buscoValoresDatoDeAtributo(ubicacion:Ubicacion,idDato:number[] | null) : ValoresDato[]{
        //Busco por "ubicacionAtributo"
        let valsAtrib : ValoresAtributo[] = this.buscoValoresAtributoDeAtributo(ubicacion);
        //Busco por "idDato" dentro de "valoresAtributo"
        for(let valorDato of valsAtrib){
            if(this.objectToString(valorDato.idDato) === this.objectToString(idDato)){
                return valorDato.valoresDato;
            }
        }
        return [];
    }

    procesarDatoComputo(datoComputo:Computo,ubicacion:Ubicacion){
        let claveIntesado = this.objectToString(ubicacion);
        let valorComputado = this.mapValoresComputados.get(claveIntesado);
        if(valorComputado === undefined){
            let valorOP1 = this.calcularValorOperando(datoComputo.op1,datoComputo.op2,ubicacion);
            let valorOP2 = this.calcularValorOperando(datoComputo.op2,datoComputo.op1,ubicacion);
            let valorOP3 = this.calcularValorOperando(datoComputo.op3,undefined,ubicacion);
            let op1=0;
            let op2=0;
            let op3=0;
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
            if (valorOP3){
                if(typeof valorOP3 === "object"){
                    op3 = valorOP3.valor;
                }
                else{
                    op3 = valorOP3;
                }
            }
            //Hago la cuenta
            let nuevoValorComputado=0;
            if(op2!==0 || (op2===0 && datoComputo.operacion[0] !== '/')){
                switch(datoComputo.operacion[0]){
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
            if(op3!==0 || (op3===0 && datoComputo.operacion[1] && datoComputo.operacion[1] !== '/')){
                switch(datoComputo.operacion[1]){
                    case '/':{
                        nuevoValorComputado=nuevoValorComputado/op3;
                        break;
                    }
                    case '+':{
                        nuevoValorComputado=nuevoValorComputado+op3;
                        break;
                    }
                    case '-':{
                        nuevoValorComputado=nuevoValorComputado-op3;
                        break;
                    }
                    case '*':{
                        nuevoValorComputado=nuevoValorComputado*op3;
                        break;
                    }
                }
            }
            nuevoValorComputado = Math.ceil(nuevoValorComputado)
            let valorComputado:ValorComputado = {
                valor:nuevoValorComputado,
                op1:valorOP1,
                op2:valorOP2,
                op3:valorOP3,
                operacion:datoComputo.operacion
            };
            this.mapValoresComputados.set(claveIntesado,valorComputado);
        }
    }

    calcularValorOperando(operandoObservado:Ubicacion|number,operandoObservado2:Ubicacion|number|undefined,ubicacionInteresado:Ubicacion):number|ComputoValorUbicacion{
        let resultado=0;
        if(typeof operandoObservado === "object"){
            //Busco en los datos guardados la Ubicación dato.computo.op1
            let ubicacionDesarmada : Ubicacion = {
                idEtapa : operandoObservado.idEtapa
                ,idGrupo : operandoObservado.idGrupo
                ,idAtributo : operandoObservado.idAtributo
                ,idDato : null
            }
            let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,operandoObservado.idDato);
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
                    observado2:operandoObservado2,
                    claveInteresado:null,
                    interesadoEscucha:retrievedEventEmitter
                }
                this.registrarDependencia.emit(registroDependencia);

                //Si cambia el dato observado, se llama esta funcion
                retrievedEventEmitter.subscribe((registroDependencia:RegistrarDependencia) => {
                    let claveIntesado = this.objectToString(registroDependencia.interesado);
                    let claveObservado = this.objectToString(registroDependencia.observado);
                    let claveObservado2 = this.objectToString(registroDependencia.observado2); //2
                    
                    //cambiar el registro dependencias y tener un observado y observado2

                    let valorAnterior = this.mapValoresComputados.get(claveIntesado);                    

                    if(valorAnterior !== undefined){
                        let op1 = 0;
                        if(typeof valorAnterior.op1 === "object" ){
                            let ubicacionDesarmada : Ubicacion = {
                                idEtapa : registroDependencia.observado.idEtapa
                                ,idGrupo : registroDependencia.observado.idGrupo
                                ,idAtributo : registroDependencia.observado.idAtributo
                                ,idDato : null
                            }
                            let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.observado.idDato);

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
                        if(typeof valorAnterior.op2 === "object"){
                            var registroDependenciaobservado2 : Ubicacion;
                            registroDependenciaobservado2 = registroDependencia.observado2 as Ubicacion;
                            let ubicacionDesarmada : Ubicacion = {
                                idEtapa : registroDependenciaobservado2.idEtapa
                                ,idGrupo : registroDependenciaobservado2.idGrupo
                                ,idAtributo : registroDependenciaobservado2.idAtributo
                                ,idDato : null
                            }
                            let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependenciaobservado2.idDato);
                            
                            let nuevoResultadoOP = 0;
                            if (valoresDato){
                                for(let valorDato of valoresDato){
                                    //Si hay valor válido
                                    if(valorDato.number){
                                        nuevoResultadoOP = nuevoResultadoOP + valorDato.number;
                                    }
                                }
                            }
                            valorAnterior.op2.valor = nuevoResultadoOP;
                            op2 = nuevoResultadoOP;
                        }
                        else if(typeof valorAnterior.op2 === "number"){
                            op2 = valorAnterior.op2;
                        }
                        let op3 = 0;
                        if(typeof valorAnterior.op3 === "object" && valorAnterior.op3.claveUbicacion === claveObservado){
                            let ubicacionDesarmada : Ubicacion = {
                                idEtapa : registroDependencia.observado.idEtapa
                                ,idGrupo : registroDependencia.observado.idGrupo
                                ,idAtributo : registroDependencia.observado.idAtributo
                                ,idDato : null
                            }
                            let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.observado.idDato);
                            //let valoresDato = this.buscoValoresDatoDeAtributo(registroDependencia.observado);
                            let nuevoResultadoOP = 0;
                            for(let valorDato of valoresDato){
                                //Si hay valor válido
                                if(valorDato.number){
                                    nuevoResultadoOP = nuevoResultadoOP + valorDato.number;
                                }
                            }
                            valorAnterior.op3.valor = nuevoResultadoOP;
                            op1 = nuevoResultadoOP;
                        }
                        else if(typeof valorAnterior.op3 === "number"){
                            op3 = valorAnterior.op3;
                        }

                        //Hago la cuenta
                        let nuevoValorComputado=0;
                        if(op2!==0 || (op2===0 && valorAnterior.operacion[0] !== '/')){
                            switch(valorAnterior.operacion[0]){
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
                        if(op3!==0 || (op3===0 && valorAnterior.operacion[1] && valorAnterior.operacion[1] !== '/')){
                            switch(valorAnterior.operacion[1]){
                                case '/':{
                                    nuevoValorComputado=nuevoValorComputado/op3;
                                    break;
                                }
                                case '+':{
                                    nuevoValorComputado=nuevoValorComputado+op3;
                                    break;
                                }
                                case '-':{
                                    nuevoValorComputado=nuevoValorComputado-op3;
                                    break;
                                }
                                case '*':{
                                    nuevoValorComputado=nuevoValorComputado*op3;
                                    break;
                                }
                            }
                        }
                        nuevoValorComputado = Math.ceil(nuevoValorComputado)
                        
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

    datosDeAtributo(ubicacionAtributo:Ubicacion) :Dato[]{
        let vuelta : Dato[] = [];
        for(let etapa of this.initialSchemaService.defaultSchema?.etapas!){
            for(let grupo of etapa.grupos){
                for(let atrib of grupo.atributos){
                    let iterUbiAtr : Ubicacion = {
                        idEtapa:atrib.ubicacion.idEtapa,
                        idGrupo:atrib.ubicacion.idGrupo,
                        idAtributo:atrib.id,
                        idDato:atrib.ubicacion.idDato
                    }
                    if(this.objectToString(iterUbiAtr) === this.objectToString(ubicacionAtributo)){
                        if(atrib.filasDatos != null){
                            for(let filaDatos of atrib.filasDatos){
                                for(let dato of filaDatos.datos){
                                    vuelta.push(dato);
                                }
                            }
                        }
                    }
                }
            }
        }
        return vuelta;
    }

    modalConfirmacion(ubicacionAtributo:Ubicacion, idAtributo:number, indice:number){
        const modalRef = this.modalService.open(ModalConfirmacionComponent, {
            scrollable: false,
        });
        modalRef.componentInstance.tittle = 'Atención';
        modalRef.componentInstance.body = '¿Está seguro que desea eliminar el registro?';
        modalRef.componentInstance.ubicacionAtr = this.ubicacionAbsolutaDeAtributo(ubicacionAtributo,idAtributo);
        
        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: (ubicacionAtr:Ubicacion) => {
                let claveUbiAtr = this.objectToString(ubicacionAtr);
                let retrievedValue = this.mapInformacionGuardadaDeAtributo.get(claveUbiAtr);
                if(retrievedValue){
                    
                    //Si es un Modulo (Contenido Condicional), tengo que acomodar las Unidades
                    const [esAtrCC,arrayIDDato] = this.esAtributoConContenidoCondicional(ubicacionAtributo,idAtributo);
                    if(esAtrCC){
                        //Construyo Ubicacion de Unidad
                        //2,24,3,[indiceModulo,7,1]
                        let ubicacionUnidad : Ubicacion = {
                            idEtapa:ubicacionAtr.idEtapa,
                            idGrupo:ubicacionAtr.idGrupo,
                            idAtributo:ubicacionAtr.idAtributo,
                            idDato:[...arrayIDDato]
                        }
                        ubicacionUnidad.idDato?.unshift(0);

                        //Construyo Ubicacion del map CC
                        let ubicacionContCondicional : Ubicacion = {
                            idEtapa:ubicacionAtr.idEtapa,
                            idGrupo:ubicacionAtr.idGrupo,
                            idAtributo:ubicacionAtr.idAtributo,
                            idDato:[0]
                        }
                        let clavePadreContCondicional = this.objectToString(ubicacionContCondicional);

                        if(retrievedValue.cantidadInstancias === 1){
                            let infoGuardada : InformacionGuardada | null = this.buscoInformacionGuardadaDeAtributo(ubicacionUnidad);
                            if(infoGuardada !== null){
                                //Elimino las opciones viejas
                                let ubicacionSelectCC : Ubicacion = {
                                    idEtapa:ubicacionAtr.idEtapa,
                                    idGrupo:ubicacionAtr.idGrupo,
                                    idAtributo:ubicacionAtr.idAtributo,
                                    idDato:[...arrayIDDato]
                                }

                                //Elimino dependencias de dato
                                let contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                                if(contCondicional !== undefined){
                                    //Elimino eventos de dependencia de los selectUsuario viejos
                                    this.eliminarEntradasMapsPorCambioEnCC(contCondicional,0,clavePadreContCondicional);
                                }

                                //Elimino Unidades del Modulo
                                infoGuardada.cantidadInstancias = 1;
                                for(let valsAtrib of infoGuardada.valoresAtributo){
                                    valsAtrib.valoresDato = [];
                                    let nuevoValorDato : ValoresDato = {
                                        string:null,
                                        number:null,
                                        selectFijo:null,
                                        selectUsuario:null,
                                        archivo:null,
                                        date:null
                                    }
                                    valsAtrib.valoresDato.push(nuevoValorDato);
                                }

                                //UbSchema = 2,24,3,[7,1]
                                //UbModulo = 2,24,3,[indiceMod]
                                const [filaDatos,opciones,maxCantDatos] = this.obtengoIngredientesContCond(
                                    ubicacionSelectCC,
                                    ubicacionContCondicional,
                                    0,
                                    0
                                );
                                
                                //Agrego opciones selectUsuario
                                for(let [key,value] of opciones.entries()){
                                    this.mapOpcionesSelect.set(key,value);
                                }

                                //Actualizo mapCC
                                this.mapContenidoCondicional.set(this.objectToString(ubicacionContCondicional),[filaDatos]);
                            }
                        }
                        else{
                            for (let indiceModulo = indice; indiceModulo < retrievedValue.cantidadInstancias; indiceModulo++) {
                                
                                ubicacionUnidad.idDato![0] = indiceModulo;
                                ubicacionContCondicional.idDato![0] = indiceModulo;

                                if(indiceModulo >= indice){
                                    //Elimino dependencias de dato y opciones de selectUsuario
                                    let contCondicional = this.mapContenidoCondicional.get(this.objectToString(ubicacionContCondicional));
                                    if(contCondicional !== undefined){
                                        this.eliminarEntradasMapsPorCambioEnCC(contCondicional,0,this.objectToString(ubicacionContCondicional));
                                    }
                                }

                                if(indice === indiceModulo){
                                    //Elimino las Unidades del Modulo
                                    this.eliminarInformacionGuardada(ubicacionUnidad);
                                    //Elimino Contenido Condicional a mostrar en UI
                                    this.mapContenidoCondicional.delete(this.objectToString(ubicacionContCondicional));
                                }

                                if(indiceModulo > indice){
                                    //Muevo las Unidades de Modulos en base un lugar para atras
                                    this.corregirIndicesModuloUnidad(ubicacionUnidad);
                                    //Muevo las claves de CC
                                    let contCondModulo = this.mapContenidoCondicional.get(this.objectToString(ubicacionContCondicional));
                                    this.mapContenidoCondicional.delete(this.objectToString(ubicacionContCondicional));
                                    let nuevaUbicacionContCondicional : Ubicacion = {
                                        idEtapa:ubicacionAtr.idEtapa,
                                        idGrupo:ubicacionAtr.idGrupo,
                                        idAtributo:ubicacionAtr.idAtributo,
                                        idDato:[indiceModulo-1]
                                    }
                                    this.mapContenidoCondicional.set(this.objectToString(nuevaUbicacionContCondicional),contCondModulo!);
                                    //Muevo las claves de los selectUsuario de la UI
                                    for(const [indiceHijo,filaDatos] of contCondModulo!.entries()){
                                        for(let filaDatosCondional of filaDatos){
                                            for(let datoInterno of filaDatosCondional.datos){
                                                switch (this.mapTipoInput.revGet(datoInterno.tipo)) {
                                                    case TipoInput.selectUsuarioMultiple:{
                                                        //Por ejemplo, Padre (modulo) indice 0, Hijo (unidad) indice 1, idDato 2
                                                        //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},1,2"
                                                        let newClaveHijoContCondicional = this.objectToString(nuevaUbicacionContCondicional)+","+indiceHijo+","+datoInterno.id;
                                                        this.cargoOpcionesSelect(datoInterno,newClaveHijoContCondicional,datoInterno.ubicacion);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //Si existe la key en el map
                    //Elimino instancia de Atributo
                    if(retrievedValue.cantidadInstancias !== 1){
                        
                        for(let datoDentroAtributo of retrievedValue.valoresAtributo!){
                            datoDentroAtributo.valoresDato.splice(indice,1);
                        }
                        retrievedValue.cantidadInstancias--;
                    }
                    else{
                        //Reseteo los datos de la única instancia
                        for(let datoDentroAtributo of retrievedValue.valoresAtributo!){
                            datoDentroAtributo.valoresDato[0].string = null;
                            datoDentroAtributo.valoresDato[0].number = null;
                            datoDentroAtributo.valoresDato[0].selectFijo = null;
                            datoDentroAtributo.valoresDato[0].selectUsuario = null;
                            datoDentroAtributo.valoresDato[0].archivo = null;
                            datoDentroAtributo.valoresDato[0].date = null;
                        }
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
                                                //let ubicacionDato = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
                                                let datosGuardados = this.buscoValoresDatoDeAtributo(dato.ubicacion,[dato.id]);
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
                                    }
                                }
                            }   
                        }
                    }
                }

                //Invalido map de archivos
                this.mapDatoArchivo = new Map();
                //Invalido map de opcionSeleccionada
                this.mapOpcionSeleccionada = new Map();
                //Invalido map de opcionesSeleccionadas
                this.mapOpcionesSeleccionadas = new Map();

                this.accionesCursosService.modificarCurso();

                //Por cada Dato del Atributo eliminado, emito por si alguien más depende de el
                let datosDeAtrib : Dato[] = this.datosDeAtributo(ubicacionAtr);
                for(let dato of datosDeAtrib){
                    let ubicacionDato = this.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                    this.informarCambio.emit(ubicacionDato);
                }
            },
            error: () => {
                //Nunca se llama aca
            },
        });
    }

    modalEliminarUnidad(ubicacionAtributo:Ubicacion, idAtributo:number, dato: Dato, idModulo: number ,idUnidad:number){
        const modalRef = this.modalService.open(ModalConfirmacionComponent, {
            scrollable: false,
        });
        modalRef.componentInstance.tittle = 'Atención';
        modalRef.componentInstance.body = '¿Está seguro que desea eliminar el registro?';

        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: () => {
                let datoInterior = dato.filasDatos[0].datos[0];

                var ubicacionAtr: Ubicacion = {                
                    idEtapa : ubicacionAtributo.idEtapa,
                    idGrupo : ubicacionAtributo.idGrupo,
                    idAtributo : idAtributo,
                    idDato : [idModulo,dato.id,datoInterior.id]
                }
                
                let infoGuardada : InformacionGuardada | null= this.buscoInformacionGuardadaDeAtributo(ubicacionAtr);
                if(infoGuardada !==null){
                    if(infoGuardada.cantidadInstancias !== 1){
                        
                        for(let datoDentroAtributo of infoGuardada.valoresAtributo!){
                            datoDentroAtributo.valoresDato.splice(idUnidad,1);
                        }
                        infoGuardada.cantidadInstancias--;
                    }
                    else{
                        //Reseteo los datos de la única instancia
                        for(let datoDentroAtributo of infoGuardada.valoresAtributo!){
                            datoDentroAtributo.valoresDato[0].string = null;
                            datoDentroAtributo.valoresDato[0].number = null;
                            datoDentroAtributo.valoresDato[0].selectFijo = null;
                            datoDentroAtributo.valoresDato[0].selectUsuario = null;
                            datoDentroAtributo.valoresDato[0].archivo = null;
                            datoDentroAtributo.valoresDato[0].date = null;
                        }
                    }
                }

                ubicacionAtr.idDato = [idModulo];
                let clavePadreContCondicional = this.objectToString(ubicacionAtr);
                let contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                if(contCondicional !== undefined){
                    //Para todos los CC que hay en este Modulo
                    //Elimino las opciones selectUsuario y las dependencias de dato
                    this.eliminarEntradasMapsPorCambioEnCC(contCondicional,idUnidad,clavePadreContCondicional);

                    if (contCondicional.length !== 1){

                        contCondicional.splice(idUnidad,1);
                        //Muevo las claves de los selectUsuario de la UI
                        for(const [indiceHijo,filaDatos] of contCondicional!.entries()){
                            if(indiceHijo>=idUnidad){
                                for(let filaDatosCondional of filaDatos){
                                    for(let datoInterno of filaDatosCondional.datos){
                                        switch (this.mapTipoInput.revGet(datoInterno.tipo)) {
                                            case TipoInput.selectUsuarioMultiple:{
                                                //Por ejemplo, Padre (modulo) indice 0, Hijo (unidad) indice 1, idDato 2
                                                //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},1,2"
                                                let newClaveHijoContCondicional = clavePadreContCondicional+","+indiceHijo+","+datoInterno.id;
                                                this.cargoOpcionesSelect(datoInterno,newClaveHijoContCondicional,datoInterno.ubicacion);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else{
                        //Actualizo CC con opción default
                        //Ubicacion Select Cont Cond
                        let ubicacionSelectCC : Ubicacion = {
                            idEtapa : ubicacionAtributo.idEtapa,
                            idGrupo : ubicacionAtributo.idGrupo,
                            idAtributo : idAtributo,
                            idDato : [dato.id,datoInterior.id]
                        }

                        //UbSchema = 2,24,3,[7,1]
                        //UbModulo = 2,24,3,[indiceMod]
                        const [filaDatos,opciones,maxCantDatos] = this.obtengoIngredientesContCond(
                            ubicacionSelectCC,
                            ubicacionAtr,
                            0,
                            0
                        );
                        
                        //Agrego opciones selectUsuario
                        for(let [key,value] of opciones.entries()){
                            this.mapOpcionesSelect.set(key,value);
                        }

                        //Actualizo mapCC
                        contCondicional[idUnidad] = filaDatos;
                    }
                }

                this.mapDatoArchivo = new Map();
                //Invalido map de opcionSeleccionada
                this.mapOpcionSeleccionada = new Map();
                //Invalido map de opcionesSeleccionadas
                this.mapOpcionesSeleccionadas = new Map();

                this.accionesCursosService.modificarCurso();

                //Por cada Dato del Atributo eliminado, emito por si alguien más depende de el
                let datosDeAtrib : Dato[] = this.datosDeAtributo(ubicacionAtr);
                for(let dato of datosDeAtrib){
                    let ubicacionDato = this.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                    this.informarCambio.emit(ubicacionDato);
                }
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

    corregirIndicesModuloUnidad(ubicacionUnidad:Ubicacion){
        let info : InformacionGuardada | null= this.buscoInformacionGuardadaDeAtributo(ubicacionUnidad);
        if(info !== null){
            info.ubicacionAtributo.idDato![0] = info.ubicacionAtributo.idDato![0]-1;
        }
    }

    esAtributoConContenidoCondicional(ubicacionAtr:Ubicacion,idAtr:number):[boolean,number[]]{
        for(let etapa of this.initialSchemaService.defaultSchema?.etapas!){
            for(let grupo of etapa.grupos){
                for(let atrib of grupo.atributos){
                    if(atrib.filasDatos != null){
                        for(let filaDatos of atrib.filasDatos){
                            for(let dato of filaDatos.datos){
                                if(dato.filasDatos !== null
                                    && dato.ubicacion.idEtapa === ubicacionAtr.idEtapa
                                    && dato.ubicacion.idGrupo === ubicacionAtr.idGrupo
                                    && dato.ubicacion.idAtributo === idAtr
                                ){
                                    return [true,[dato.id,1]];
                                }
                            }
                        }
                    }
                }
            }
        }

        return [false,[]];
    }

    obtengoIngredientesContCond(ubicacionSchemaCC:Ubicacion,ubicacionModulo:Ubicacion,idOpcion:number,indiceHijo:number):[FilaDatos[],Map<string,ValorSelect[]>,number]{
        //Obtengo FilaDatos de CC y las opciones de sus selectMultipleUsuario
        //ubicacionSchemaCC = 2,24,3,[7,1]
        //ubicacionModulo   = 2,24,3,[indiceMod]
        //let filaDatosAAgregar : FilaDatos[] = [];
        let opcionesSelect : Map<string,ValorSelect[]> = new Map();
        //let maxCantDatos : number = 0;

        const [filaDatosAAgregar,maxCantDatos] = this.obtenerFilasCC(ubicacionSchemaCC,idOpcion);

        //Tengo que agregar las opciones de los selectUsuarioMultiple
        for(let filaDatosCondional of filaDatosAAgregar){
            for(let datoInterno of filaDatosCondional.datos){
                switch (this.mapTipoInput.revGet(datoInterno.tipo)) {
                    case TipoInput.selectUsuarioMultiple:{
                        //Por ejemplo, Padre (modulo) indice 0, Hijo (unidad) indice 1, idDato 2
                        //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},1,2"
                        let claveHijoContCondicional = this.objectToString(ubicacionModulo)+","+indiceHijo+","+datoInterno.id;

                        let ubicacionDesarmada : Ubicacion = {
                            idEtapa : datoInterno.opciones.referencia.idEtapa
                            ,idGrupo : datoInterno.opciones.referencia.idGrupo
                            ,idAtributo : datoInterno.opciones.referencia.idAtributo
                            ,idDato : null
                        }
                        let opSel = this.obtengoOpcionesSelectUsuario(ubicacionDesarmada,datoInterno.opciones.referencia.idDato!,datoInterno.ubicacion,claveHijoContCondicional);
                        opcionesSelect.set(claveHijoContCondicional,opSel);
                    }
                }
            }
        }

        return [filaDatosAAgregar,opcionesSelect,maxCantDatos];
    }

    obtenerFilasCC(ubicacionSchemaCC:Ubicacion,idOpcion:number):[FilaDatos[],number]{

        let filaDatosAAgregar : FilaDatos[] = [];
        let maxCantDatos : number = 0;

        //Todos los ContCond
        let contenidoCondicional = this.initialSchemaService.defaultSchema?.contenidoCondicional;
        //Los ContCond que son de este Dato - 2,24,3,[7,1]
        let contenidosMatchean = contenidoCondicional?.filter((contMacth) => this.objectToString(contMacth.muestroSi.referencia) === this.objectToString(ubicacionSchemaCC));

        for (let contenidoEncontrado of contenidosMatchean!) {
            
            let maxLocal = 0;
            let filaDatosHeredadas : FilaDatos[] = [];

            //Obtengo las filaDatos Heredadas de CC y la cantidad de Datos
            if(contenidoEncontrado.herencia != null){

                filaDatosHeredadas = this.obtenerFilasCCHeredadas(contenidoEncontrado.herencia);
                for(let filaDato of filaDatosHeredadas){
                    maxLocal += filaDato.datos.length;
                }
            }
            
            //Si "Original" tiene filaDatos, sumo a Cantidad de Datos
            if (contenidoEncontrado.filasDatos){
                for(let filaDatosCondional of contenidoEncontrado.filasDatos){
                    maxLocal += filaDatosCondional.datos.length;
                }
            }

            if(contenidoEncontrado.muestroSi.valorSeleccionado.idOpcion === idOpcion){

                //Cambio Ubicación de lo Heredado, lo agrego al FilaDatos retorno.
                for(let filaDato of filaDatosHeredadas){
                    for(let dato of filaDato.datos){
                        dato.ubicacion.idEtapa=ubicacionSchemaCC.idEtapa;
                        dato.ubicacion.idGrupo=ubicacionSchemaCC.idGrupo;
                        dato.ubicacion.idAtributo=ubicacionSchemaCC.idAtributo;
                    }
                    filaDatosAAgregar.push(filaDato);
                }

                //FilaDatos del "Original", luego de lo heredado
                if(contenidoEncontrado.filasDatos){
                    let copiaFilaDatosAAgregar = this.stringToObject(this.objectToString(contenidoEncontrado.filasDatos));
                    for(let filaDato of copiaFilaDatosAAgregar){
                        filaDatosAAgregar.push(filaDato);
                    }
                }
            }

            if(maxLocal > maxCantDatos){
                maxCantDatos=maxLocal;
            }
        }
        
        return [filaDatosAAgregar,maxCantDatos];
    }

    obtenerFilasCCHeredadas(idCC:number):FilaDatos[]{
        let filaDatosAAgregar : FilaDatos[] = [];

        //Todos los ContCond
        let contenidoCondicional = this.initialSchemaService.defaultSchema?.contenidoCondicional;
        //Los ContCond que son de este Dato - 2,24,3,[7,1]       
        let contenidosMatchean = contenidoCondicional?.find((contMacth) => this.objectToString(contMacth.id) === this.objectToString(idCC));
        if(contenidosMatchean){
            if(contenidosMatchean.herencia != null){
                let filaDatosRecursivo = this.obtenerFilasCCHeredadas(contenidosMatchean.herencia);
                for(let fila of filaDatosRecursivo){
                    filaDatosAAgregar.push(fila);
                }
            }
            let copiaFilaDatosAAgregar = this.stringToObject(this.objectToString(contenidosMatchean.filasDatos));
            for(let fila of copiaFilaDatosAAgregar){
                filaDatosAAgregar.push(fila);
            }
        }

        return filaDatosAAgregar;
    }

    eliminarInformacionGuardada(ubicacion:Ubicacion){
        if(this.versionActual !== undefined){
            let indiceEliminar = -1;
            for(const [indice, informacionGuardada] of this.versionActual.datosGuardados!.entries()){
                if(this.objectToString(informacionGuardada.ubicacionAtributo) === this.objectToString(ubicacion)){
                    indiceEliminar = indice;
                    break;
                }
            }
            if(indiceEliminar !== -1){
                this.versionActual.datosGuardados!.splice(indiceEliminar, 1);
            }
        }
    }

    eliminarEntradasMapsPorCambioEnCC(contCondicional:FilaDatos[][],idUnidad:number,claveCC:string){
        //Elimino las opciones selectUsuario y las dependencias de dato
        for(let [indexHijo,todasFDHijo] of contCondicional.entries()){
            if(indexHijo>=idUnidad){
                for(let fD of todasFDHijo){
                    for(let dat of fD.datos){
                        switch (this.mapTipoInput.revGet(dat.tipo)) {
                            case TipoInput.selectUsuarioMultiple:{
                                //EMITO
                                //claveInteresado = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},0,3'
                                let claveInteresado = claveCC+","+indexHijo+","+dat.id;
                                this.eliminarDependencia.emit(claveInteresado);

                                //Elimino entrada de manejadorEventos Local
                                let claveObservado = this.objectToString(dat.opciones.referencia);
                                let claveEvento = claveInteresado+claveObservado;
                                this.mapManejadorEventos.delete(claveEvento);

                                //Elimino opciones Select
                                //Por ejemplo, Padre (modulo) indice 0, Hijo (unidad) indice 1, idDato 2
                                //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},1,2"
                                let oldClaveHijoContCondicional = claveCC+","+indexHijo+","+dat.id;
                                this.mapOpcionesSelect.delete(oldClaveHijoContCondicional);
                            }
                        }
                    }
                }
            }
        }
    }

    eliminarArchivoDeBase(id:number){
        let existeReferenciaHaciaArchivo = false;
        //Si ninguna version del curso tiene referencia hacia el archivo, lo elimino
        if(this.initialSchemaService.loadedData !==undefined){
            for(let version of this.initialSchemaService.loadedData.versiones){
                for(let infoGuardada of version.datosGuardados!){
                    for(let valAtrib of infoGuardada.valoresAtributo){
                        for(let valDato of valAtrib.valoresDato){
                            if(valDato.archivo !== null 
                                && valDato.archivo.fileId !== null
                                && valDato.archivo.fileId === id
                            ){
                                existeReferenciaHaciaArchivo = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        if(!existeReferenciaHaciaArchivo){
            let [,index] = this.obtenerArchivoCargadoById(id);
            this.initialSchemaService.loadedData!.archivos.splice(index,1);
        }
    }

    obtenerArchivoCargadoById(id:number) : [Archivo,number] {
        let archivosCargados : Archivo[] = this.initialSchemaService.loadedData!.archivos;
        for(let [index,archivo] of archivosCargados.entries()){
            if(archivo.id === id){
                return [archivo,index];
            }
        }
        return [{id:0,b64:"null"},-1];
    }

    agregarArchivo(b64:string) : number {
        let archivosCargados : Archivo[] = this.initialSchemaService.loadedData!.archivos;
        let lastID = 0;
        for(let [,archivo] of archivosCargados.entries()){
            if(archivo.b64 === b64){
                return archivo.id;
            }
            lastID = archivo.id;
        }
        let nuevaID = lastID+1;
        archivosCargados.push(
            {
                id:nuevaID,
                b64:b64
            }
        );
        return nuevaID;
    }
}
