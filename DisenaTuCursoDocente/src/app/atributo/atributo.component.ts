import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { Atributo, Computo, DependenciaDeDatos, Ubicacion, Grupo, Etapa, Dato, FilaDatos } from '../modelos/schema.model';
import { MapTipoInput, MapTipoInputHTML, TipoInput, TwoWayMap } from '../enumerados/enums';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { AccionesCursosService } from '../servicios/acciones-cursos.service';
import { DatoArchivo, InformacionGuardada, ValoresDato, Version,ValoresAtributo, Archivo } from '../modelos/schemaData.model';
import { FormControl, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalConfirmacionComponent } from '../modal/confirmacion/modal-confirmacion.component';
import { _countGroupLabelsBeforeOption } from '@angular/material/core';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';
import { Interaccion_Schema_Data } from '../servicios/interaccion-schema-data.service';

declare var bootstrap: any;

export interface RegistrarDependencia{
    interesado:Ubicacion;
    observado:Ubicacion;
    claveInteresado:string|null;
    observado2:Ubicacion|number|undefined;
    indiceEliminado:number|null;
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
    @Output() informarCambio = new EventEmitter<{cambioEnUbicacion:Ubicacion,indiceEliminado:number|null}>();
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

    //Disponibilizamos librería JSON en Template
    JSON = JSON;
    
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

    constructor(private initialSchemaService : InitialSchemaLoaderService
        ,private modalService: NgbModal
        ,private accionesCursosService: AccionesCursosService
        ,public interaccionSchemaConData: Interaccion_Schema_Data
    ) {
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
            let ubicacionAtr : Ubicacion = this.interaccionSchemaConData.ubicacionAbsolutaDeAtributo(this.atributo.ubicacion,this.atributo.id);
            let claveMap = JSON.stringify(ubicacionAtr);
            let retrievedValue = this.mapInformacionGuardadaDeAtributo.get(claveMap);
            if(!retrievedValue){
                //Si no existe la key en el map
                for(let datoGuardado of this.versionActual.datosGuardados!){
                    if (JSON.stringify(datoGuardado.ubicacionAtributo) === claveMap){
                        this.mapInformacionGuardadaDeAtributo.set(claveMap,datoGuardado);
                        break;
                    }
                }
            }
        }

        if (this.atributo.herencia){
            const [atributoHerencia, grupoHerencia, etapaHerencia] = this.interaccionSchemaConData.getAtributoHerencia(this.atributo.herencia,{idEtapa:this.atributo.ubicacion.idEtapa,idGrupo:this.atributo.ubicacion.idGrupo,idAtributo:this.atributo.id,idDato:null});
            this.cargarAtributoHerencia(atributoHerencia,grupoHerencia,etapaHerencia);
        }

        //Realizo precomputo de los elementos dinámicos
        if (this.atributo.filasDatos && !this.atributo.herencia){
            for(let filaDatos of this.atributo.filasDatos){
                for(let dato of filaDatos.datos){
                    let ubicacionAbsoluta = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                    let claveMap = JSON.stringify(ubicacionAbsoluta);
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
                        this.cargarCC(dato);
                    }
                }
            }
        }
        
        console.log("Fin precomputo");
    }

    cargarAtributoHerencia(atributoHerencia:Atributo|null,grupoHerencia:Grupo|null,etapaHerencia:Etapa|null){
        if(atributoHerencia != null && grupoHerencia != null && etapaHerencia != null){
            this.atributoHerencia = atributoHerencia;
            if(this.atributoHerencia.nombre != null){
                this.atributo.nombre = this.atributoHerencia.nombre;
            }
            for(let filaDatos of this.atributoHerencia.filasDatos){
                for(let dato of filaDatos.datos){
                    let ubicacionAbsoluta = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                    let claveMap = JSON.stringify(ubicacionAbsoluta);
                    //Computo opciones de los Select del Atributo
                    if(dato.opciones){
                        this.cargoOpcionesSelect(dato,claveMap,ubicacionAbsoluta);
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
                        datoInterior.ubicacion.idEtapa = this.atributo.ubicacion.idEtapa;
                        datoInterior.ubicacion.idGrupo = this.atributo.ubicacion.idGrupo;
                        datoInterior.ubicacion.idAtributo =  this.atributo.id;

                        this.cargarCC(dato);
                    }
                }
            }
            this.grupoHerencia = grupoHerencia;
            this.etapaHerencia = etapaHerencia;
        }
    }

    cargarCC(dato:Dato){

        let datoInterior = dato.filasDatos[0].datos[0];
        let ubicacionAbsInterior = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(datoInterior.ubicacion,datoInterior.id);
        //ubicacionAbsInterior = 2,24,3,[7,1]
        this.cargoOpcionesSelect(datoInterior
            ,JSON.stringify(ubicacionAbsInterior)
            ,ubicacionAbsInterior
        );
        
        //Cantidad de instancias de Modulo
        let cantidadInstanciasAtributo = this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(dato.ubicacion,this.versionSeleccionada!)?.cantidadInstancias;
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
            let clavePadreContCondicional = JSON.stringify(ubicacionContCondicional);
            let contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
            if(contCondicional === undefined){
                this.mapContenidoCondicional.set(
                    clavePadreContCondicional,
                    []
                );
                contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                ubicacionContCondicional.idDato = ubicacionAbsInterior.idDato
                var datosGuardados = this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(ubicacionContCondicional,this.versionSeleccionada!) as InformacionGuardada;
                this.mapInformacionGuardadaDeAtributo.set
                (
                    JSON.stringify(ubicacionContCondicional),
                    datosGuardados
                );
            }
                                        
            ubicacionAbsInterior.idDato![0] = i;
            //ubicacionAbsInterior = 2,24,3,[i,7,1]
            let valoresSelectCondicional : ValoresDato[] = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionAbsInterior,arrayDato,this.versionSeleccionada!);
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

    obtenerClaveSelectCondicional(ubicacionDato:Ubicacion,indicePadre:number,indiceHijo:number,idDatoCondicional:number):string{
        //Por ejemplo, Padre (modulo) indice 0, Hijo (unidad) indice 1, dato 2
        //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},1,2
        let nuevaUbicacion : Ubicacion = {
            idEtapa: ubicacionDato.idEtapa,
            idGrupo: ubicacionDato.idGrupo,
            idAtributo: ubicacionDato.idAtributo,
            idDato: [indicePadre]
        }
        return JSON.stringify(nuevaUbicacion)+","+indiceHijo+","+idDatoCondicional;
    }

    cargarOpcionesSelectUsuario(ubicacionAtr:Ubicacion, idDato:number[], ubicacionInteresado:Ubicacion, claveInteresado:string) : ValorSelect[] {
        let opcionesDevueltas : ValorSelect[] = this.interaccionSchemaConData.obtengoOpcionesSelectUsuario(ubicacionAtr,idDato,this.versionSeleccionada!);

        let ubicacionRef : Ubicacion = {
            idEtapa : ubicacionAtr.idEtapa
            ,idGrupo : ubicacionAtr.idGrupo
            ,idAtributo : ubicacionAtr.idAtributo
            ,idDato : [...idDato]
        }

        //Si dependo de alguien mas, debo de saber cuando ese alguien
        //mas cambia para actualizar y recomputar acorde
        let claveObservado = JSON.stringify(ubicacionRef);
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
                indiceEliminado:null,
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
                let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.observado.idDato,this.versionSeleccionada!);
                let array : ValorSelect[] = [];
                
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
                    array!.push(nuevaOpcion);
                }

                //Se eliminaron opciones, corrijo indices guardados de CC si aplica
                let indiceEliminado = registroDependencia.indiceEliminado!;
                if(this.mapContenidoCondicional.size !== 0 && indiceEliminado !== null){
                    //Construyo Ubicacion de la Unidad que depende del Dato eliminado
                    //ClaveInteresado = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},0,3'
                    //Interesado = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[7,1]}'
                    //Necesito traerme Mod 0, Unidad 0, Dato 3
                    let idDato = [...registroDependencia.interesado.idDato!];
                    let arraySplit = claveIntesado!.split(',');
                    let indiceDato = arraySplit[arraySplit.length-1];
                    let indiceUnidad = arraySplit[arraySplit.length-2];
                    let indiceMod = arraySplit[3];//"idDato":[0]}
                    indiceMod = indiceMod.substring(
                        indiceMod.indexOf("[") + 1, 
                        indiceMod.lastIndexOf("]")
                    );
                    idDato.push(Number(indiceDato));

                    let unidadesDeModulo : Ubicacion = {
                        idEtapa: registroDependencia.interesado.idEtapa,
                        idGrupo: registroDependencia.interesado.idGrupo,
                        idAtributo: registroDependencia.interesado.idAtributo,
                        idDato: [...registroDependencia.interesado.idDato!]
                    }
                    //Agrego indiceMod al inicio, unidades del Modulo = indiceMod
                    unidadesDeModulo.idDato!.unshift(Number(indiceMod));

                    let datosGuardados = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(unidadesDeModulo,idDato,this.versionSeleccionada!);
                    let datoACambiar = datosGuardados[indiceUnidad];
                    if(indiceEliminado === -1){
                        datoACambiar.selectUsuario = null;
                        //Reseteo Opciones Seleccionadas para que se actualice en UI las opciones de la Herencia
                        this.mapOpcionesSeleccionadas = new Map();
                    }
                    if(datoACambiar.selectUsuario != null){
                        this.corregirIndicesGuardados(indiceEliminado,datoACambiar.selectUsuario);
                        if(datoACambiar.selectUsuario.length === 0){
                            datoACambiar.selectUsuario = null;
                        }
                    }
                }
                this.mapOpcionesSelect.set(claveIntesado!,array);
            });
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
                let array : ValorSelect[] = this.cargarOpcionesSelectUsuario(ubicacionDesarmada,dato.opciones.referencia.idDato!,ubicacionAbsoluta,claveMap);
                this.mapOpcionesSelect.set(claveMap,array);
            }
        }
        else{
            //Proceso Datos Fijos
            let datosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;
            let datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === dato.opciones.idGrupoDatoFijo);
            
            let retrievedValue = this.mapOpcionesSelect.get(claveMap);
            if(!retrievedValue){
                let array : ValorSelect[] = this.interaccionSchemaConData.obtenerOpcionesSelectFijo(dato.opciones.idGrupoDatoFijo);
                this.mapOpcionesSelect.set(claveMap,array);
            }
            for (let opcion of datoFijo?.opciones!) {

                //Si dependo de alguien mas para mostrar, debo de saber cuando ese alguien
                //mas cambia para actualizar la información guardada en this.datoGuardado.valoresAtributo
                //y recomputar acorde
                if(opcion.muestroSi){
                    let claveInteresado = JSON.stringify(claveMap);
                    let claveObservado = JSON.stringify(opcion.muestroSi.referencia);
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
                            indiceEliminado:null,
                            interesadoEscucha:retrievedEventEmitter
                        }
                        this.registrarDependencia.emit(registroDependencia);

                        //Si cambia el dato observado, se llama esta funcion
                        retrievedEventEmitter.subscribe((registroDependencia:RegistrarDependencia) => {
                            let claveIntesado = JSON.stringify(registroDependencia.interesado);

                            //Reseteo el valor guardado y el mapOpcionSeleccionada
                            //cargarInfoPrevia se encarga de seleccionar la primer opcion by default
                            let ubicacionDesarmada : Ubicacion = {
                                idEtapa : registroDependencia.interesado.idEtapa
                                ,idGrupo : registroDependencia.interesado.idGrupo
                                ,idAtributo : registroDependencia.interesado.idAtributo
                                ,idDato : null
                            }
                            let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.interesado.idDato,this.versionSeleccionada!);
                            valoresDato[0].selectFijo = null;
                            this.mapOpcionSeleccionada.delete(claveIntesado);
                        });
                    }
                }
            }
        }
    }

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
        let infoHerdada : InformacionGuardada = JSON.parse(JSON.stringify(this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(this.atributo.herencia,this.versionSeleccionada!)!));
        let infoActual : InformacionGuardada = this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(this.interaccionSchemaConData.ubicacionAbsolutaDeAtributo(this.atributo.ubicacion,this.atributo.id),this.versionSeleccionada!)!;
        
        const [esAtrCC,arrayIDDato] = this.interaccionSchemaConData.esAtributoConContenidoCondicional(this.atributo.ubicacion,this.atributo.id);
        //Si es CC, copio los datos de las Unidades
        if(esAtrCC){
            let maxIndexMod = infoActual.cantidadInstancias!-1;
            //Elimino los Módulos de infoActual
            for (let i = maxIndexMod; i >= 0; i--) {
                let ubicacionAtr : Ubicacion = {idEtapa:this.atributo.ubicacion.idEtapa,idGrupo:this.atributo.ubicacion.idGrupo,idAtributo:this.atributo.id,idDato:null}
                let retrievedValue = this.mapInformacionGuardadaDeAtributo.get(JSON.stringify(ubicacionAtr));
                if(retrievedValue){
                    this.eliminarUnidadesDeModulo(
                        ubicacionAtr,
                        arrayIDDato,
                        retrievedValue,
                        i
                    );
                    //Elimino instancia de Atributo
                    if(retrievedValue.cantidadInstancias !== 1){
                        
                        for(let datoDentroAtributo of retrievedValue.valoresAtributo!){
                            datoDentroAtributo.valoresDato.splice(i,1);
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
            }
            //Busco si Unidad de infoActual tiene un Dato que Unidad de infoHeredada no tiene
            let idsUnidadNuevos : number[][] = [];
            let idDatoUnidad_0 = [...arrayIDDato];
            idDatoUnidad_0.unshift(0);
            let infoActualUnidad : InformacionGuardada = this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo({idEtapa:this.atributo.ubicacion.idEtapa,idGrupo:this.atributo.ubicacion.idGrupo,idAtributo:this.atributo.id,idDato:idDatoUnidad_0},this.versionSeleccionada!)!;
            let infoHerdadaUnidad : InformacionGuardada = this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo({idEtapa:this.atributo.herencia.idEtapa,idGrupo:this.atributo.herencia.idGrupo,idAtributo:this.atributo.herencia.idAtributo,idDato:idDatoUnidad_0},this.versionSeleccionada!)!;
            let valsAtribActual = infoActualUnidad!.valoresAtributo;
            let valsAtribHeredado = infoHerdadaUnidad!.valoresAtributo;
            for(let valAtribA of valsAtribActual){
                let encontreIDDato = false;
                for(let valAtribH of valsAtribHeredado){
                    if(JSON.stringify(valAtribH.idDato)===JSON.stringify(valAtribA.idDato)){
                        encontreIDDato = true;
                        break;
                    }
                }
                if(!encontreIDDato){
                    idsUnidadNuevos.push(valAtribA.idDato);
                }
            }

            //Elimino Unidad que quedó en el Modulo por defecto
            this.eliminarInformacionGuardada({idEtapa:this.atributo.ubicacion.idEtapa,idGrupo:this.atributo.ubicacion.idGrupo,idAtributo:this.atributo.id,idDato:idDatoUnidad_0});

            //Agrego Unidades Heredadas, por cada Modulo, copio las Unidades
            for (let i = 0; i < infoHerdada.cantidadInstancias; i++) {
                let idDatoUnidadesDeModulo_I = [...arrayIDDato];
                idDatoUnidadesDeModulo_I.unshift(i);
                //Copio los datos viejos
                let infoGuardadaUnidadesDeModulo_I : InformacionGuardada = JSON.parse(JSON.stringify(this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo({idEtapa:this.atributo.herencia.idEtapa,idGrupo:this.atributo.herencia.idGrupo,idAtributo:this.atributo.herencia.idAtributo,idDato:idDatoUnidadesDeModulo_I},this.versionSeleccionada!)));
                
                //Creo el Dato que no tienen las Unidades de Etapa anaterior
                for(let idUnidadNuevo of idsUnidadNuevos){
                    let valsAtrib : ValoresAtributo = {
                        idDato:[...idUnidadNuevo],
                        valoresDato : []
                    }
                    for(let iterDato = 0; iterDato < infoGuardadaUnidadesDeModulo_I.cantidadInstancias; iterDato++){
                        valsAtrib.valoresDato.push({
                            string:null,
                            number:null,
                            selectFijo:null,
                            selectUsuario:null,
                            archivo:null,
                            date:null
                        });
                    }
                    infoGuardadaUnidadesDeModulo_I.valoresAtributo.push(valsAtrib);
                }
                
                //Cambio Ubicación del la información a almacenar
                infoGuardadaUnidadesDeModulo_I.ubicacionAtributo.idEtapa = this.atributo.ubicacion.idEtapa;
                infoGuardadaUnidadesDeModulo_I.ubicacionAtributo.idGrupo = this.atributo.ubicacion.idGrupo;
                infoGuardadaUnidadesDeModulo_I.ubicacionAtributo.idAtributo = this.atributo.id;

                //Guardo en Base
                this.versionActual!.datosGuardados!.push(infoGuardadaUnidadesDeModulo_I);
            }
        }

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
        let [atributoHerencia, grupoHerencia, etapaHerencia] = this.interaccionSchemaConData.getAtributoHerencia(this.atributo.herencia,
            {idEtapa:this.atributo.ubicacion.idEtapa,idGrupo:this.atributo.ubicacion.idGrupo,idAtributo:this.atributo.id,idDato:null}
        );
        //Si no es CC y Hereda
        if(!esAtrCC){  
            if(atributoHerencia!=null){
                //Emito que quizá cambiaron los valores
                for(let filaDatos of atributoHerencia.filasDatos){
                    for(let dato of filaDatos.datos){
                        let ubicacionDato = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                        this.informarCambio.emit({cambioEnUbicacion:ubicacionDato,indiceEliminado:-1});
                    }
                }
                //Asigno variable atributoHerencia que imprime en UI
                //this.atributoHerencia =  atributoHerencia;
            }
        }
        else{
            //Es CC, debemos cargar el mapContenidoCondicional
            //Y resetear las opciones seleccionadas desde Herencia (de Etapa anterior)
            //Si el Atributo de esas opciones existe en esta Etapa
            this.mapContenidoCondicional = new Map();
            this.cargarAtributoHerencia(atributoHerencia,grupoHerencia,etapaHerencia);
            /*
                                                                       [  Unidad 0   ,  Unidad 1   ,  Unidad 2  ,  Unidad 3   ] -->
            mapContenidoCondicional.get( 2,24,3,[instanciaModulo] ) -> [ FilaDatos[] , FilaDatos[] , FilaDatos[], FilaDatos[] ] -->
            */
            let indiceModulo = 0;
            for (let values of this.mapContenidoCondicional.values()) {
                let indiceUnidad = 0;
                for(let filasDatosUnidad_I of values){
                    for(let filaDatos of filasDatosUnidad_I){
                        for(let dato of filaDatos.datos){
                            if(dato.opciones != null 
                                && dato.opciones.referencia != null
                                && dato.opciones.referencia.idEtapa == this.atributo.ubicacion.idEtapa
                            ){
                                let idDatoAtrib : number[] = [...arrayIDDato];
                                idDatoAtrib.unshift(indiceModulo);
                                let idDatoDato : number[] = [...arrayIDDato];
                                idDatoDato.push(dato.id);
                                let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(
                                    {idEtapa:this.atributo.ubicacion.idEtapa,idGrupo:this.atributo.ubicacion.idGrupo,idAtributo:this.atributo.id,idDato:idDatoAtrib},
                                    idDatoDato
                                    ,this.versionSeleccionada!
                                );
                                valoresDato[indiceUnidad].selectUsuario = null;
                            }
                        }
                    }
                    indiceUnidad++;
                }
                indiceModulo++;
            }
        }
        //Reseteo Opciones Seleccionadas para que se actualice en UI las opciones de la Herencia
        this.mapOpcionesSeleccionadas = new Map();
        //Reseteo Archivos para que se actualice la UI con nuevos datos
        this.mapDatoArchivo = new Map();
        //Resteo Opcion Seleccionada para actualizar UI
        this.mapOpcionSeleccionada = new Map();
        //Persisto nuevos datos
        this.accionesCursosService.modificarCurso();
    }

    agregarInstanciaAtributo(ubicacion:Ubicacion,idAtributo:number) {
        let ubicacionAtr : Ubicacion = {
            idEtapa : ubicacion.idEtapa,
            idGrupo : ubicacion.idGrupo,
            idAtributo : idAtributo,
            idDato : null
        }
        
        let infoGuardada : InformacionGuardada | null = this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(ubicacionAtr,this.versionSeleccionada!);
        if(infoGuardada !== null){
            //Si es un Modulo (Contenido Condicional), tengo que acomodar las Unidades
            const [esAtrCC,arrayIDDato] = this.interaccionSchemaConData.esAtributoConContenidoCondicional(ubicacionAtr,idAtributo);
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
                this.mapContenidoCondicional.set(JSON.stringify(ubicacionContCondicional),[filaDatos]);

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
                let ubicacionDato = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                this.informarCambio.emit({cambioEnUbicacion:ubicacionDato,indiceEliminado:null});
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

        let infoGuardada : InformacionGuardada | null= this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(ubicacionAtr,this.versionSeleccionada!);
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

        let clavePadreContCondicional = JSON.stringify(ubicacionContCondicional);
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
            let claveMap = JSON.stringify(ubicacion)+indicePadre;

            //Si es un Archivo de CC, viene el IndiceHijo
            let indiceHijo = fileUploader.getAttribute('indiceHijo');
            if(indiceHijo!=null){
                //Cambio clave para que reconozca Unidades
                claveMap = JSON.stringify(ubicacion)+indicePadre+','+indiceHijo;
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
        let claveMap = JSON.stringify(ubicacion)+indicePadre;
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
            let clave = JSON.stringify(muestroSi.referencia)+indice;
            let opcionSeleccionada = this.mapOpcionSeleccionada.get(clave);
            if(opcionSeleccionada !== undefined){

                return opcionSeleccionada === muestroSi.valorSeleccionado.idOpcion
            }
        }
        return true;
    }

    estaDeshabilitado(dependencia:DependenciaDeDatos, indice:number){
        if(dependencia){
            let key = JSON.stringify(dependencia.referencia)+indice;
            let value = this.mapOpcionSeleccionada.get(key);

            if(value !== undefined){
                return dependencia.valorSeleccionado.idOpcion !== value;
            }
            return true;
        }
        return false;
    }

    guardarCambio(ubicacion:Ubicacion,idDato:number,indice:number,tipoInput:TipoInput,nuevoValor:any){
        
        let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacion,[idDato],this.versionSeleccionada!);
        if(valoresDato.length !== 0){
            //let claveMap = JSON.stringify(ubicacion)+indice;
            let claveMap = JSON.stringify(this.interaccionSchemaConData.ubicacionAbsolutaDeDato(ubicacion,idDato))+indice;
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
                    let valueObject = JSON.parse(nuevoValor.value);
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
            this.informarCambio.emit({cambioEnUbicacion:ubicacionAbs,indiceEliminado:null});
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
        
        let valoresDato : ValoresDato[]= this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionAtributo,arrayIdDato,this.versionSeleccionada!);
        if(valoresDato.length !== 0){
            //calveMap = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[7,1]}0,0'
            let claveMap = JSON.stringify(ubicacionClaveMap)+indicePadre+','+indiceHijo;
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
                    let valueObject = JSON.parse(nuevoValor.value);

                    //Reseteo datos guardados del CC viejo - los de la forma 2,24,3,[7,1,idDato]
                    let valoresAtributo : ValoresAtributo[] = this.interaccionSchemaConData.buscoValoresAtributoDeAtributo(ubicacionAtributo,this.versionSeleccionada!);
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
                    let clavePadreContCondicional = JSON.stringify(ubicacionContCondicional);
                    let contCondicional = this.mapContenidoCondicional.get(clavePadreContCondicional);
                    if(contCondicional !== undefined){
                        //Elimino eventos de dependencia de los selectUsuario viejos
                        for(let fD of contCondicional[indiceHijo]){
                            for(let dat of fD.datos){
                                switch (this.mapTipoInput.revGet(dat.tipo)) {
                                    case TipoInput.selectUsuarioMultiple:{
                                        //Elimino dependencia en componente Grupo
                                        //claveInteresado = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},0,3'
                                        let claveInteresado = JSON.stringify({
                                            idEtapa:ubicacionAtributo.idEtapa,
                                            idGrupo:ubicacionAtributo.idGrupo,
                                            idAtributo:ubicacionAtributo.idAtributo,
                                            idDato:[indicePadre]
                                        })+","+indiceHijo+","+dat.id;
                                        this.eliminarDependencia.emit(claveInteresado);
                                        
                                        //Elimino dependencia en mapManejadorEventos
                                        let claveObservado = JSON.stringify(dat.opciones.referencia);
                                        this.mapManejadorEventos.delete(claveInteresado+claveObservado);
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
        
        let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacion,[idDato],this.versionSeleccionada!);
        if(valoresDato.length !== 0){
            let claveMap = JSON.stringify(this.interaccionSchemaConData.ubicacionAbsolutaDeDato(ubicacion,idDato))+indice;
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

        let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionAtributo,arrayIdDato,this.versionSeleccionada!);
        if(valoresDato.length !== 0){
            //calveMap = '{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[7,1]}0,0'
            let claveMap = JSON.stringify(this.interaccionSchemaConData.ubicacionAbsolutaDeDato(ubicacion,idDato))+indicePadre+','+indiceHijo;
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
        let claveMap = JSON.stringify(ubicacion)+indicePadre;
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
        let claveMap = JSON.stringify(ubicacion)+indice;
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
            ubicacionAtributo = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(ubicacion,idDato);
            //arrayIdDato = [7,1]
            arrayIdDato = [...ubicacionAtributo.idDato!];
        }
        //ubicacionAtributo = 2,24,3,[indicePadre,7,1]
        ubicacionAtributo.idDato!.unshift(indicePadre);
        return [ubicacionAtributo,arrayIdDato];
    }

    procesarDatoComputo(datoComputo:Computo,ubicacion:Ubicacion){
        let claveIntesado = JSON.stringify(ubicacion);
        let valorComputado = this.mapValoresComputados.get(claveIntesado);
        if(valorComputado === undefined){
            let op1 = this.calcularValorOperando(datoComputo.op1,datoComputo.op2,ubicacion);
            let op2 = this.calcularValorOperando(datoComputo.op2,datoComputo.op1,ubicacion);
            let op3 = this.calcularValorOperando(datoComputo.op3,undefined,ubicacion);

            let nuevoValorComputado = this.interaccionSchemaConData.calcularResultadoOperacion(op1,op2,op3,datoComputo);
            
            let valorOP1 : ComputoValorUbicacion | number = this.empaquetoOperando(op1,datoComputo.op1);
            let valorOP2 : ComputoValorUbicacion | number = this.empaquetoOperando(op2,datoComputo.op2);
            let valorOP3 : ComputoValorUbicacion | number = this.empaquetoOperando(op3,datoComputo.op3);
            
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

    empaquetoOperando(resultado:number,op:number|Ubicacion):ComputoValorUbicacion | number{
        let vuelta : ComputoValorUbicacion | number = resultado;
        if(typeof op === "object"){
            let claveObservado = JSON.stringify(op);
            vuelta = {
                claveUbicacion:claveObservado,
                valor:resultado
            }
        }
        return vuelta;
    }

    calcularValorOperando(operandoObservado:Ubicacion|number,operandoObservado2:Ubicacion|number|undefined,ubicacionInteresado:Ubicacion):number{
        let resultado = this.interaccionSchemaConData.calcularValorOperando(operandoObservado,this.versionSeleccionada!); 
        
        if(typeof operandoObservado === "object"){
            //Si el operando son datos de una Ubicacion, se debe de saber
            //cuando ese dato cambia para recomputar
            let claveInteresado = JSON.stringify(ubicacionInteresado);
            let claveObservado = JSON.stringify(operandoObservado);
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
                    indiceEliminado:null,
                    interesadoEscucha:retrievedEventEmitter
                }
                this.registrarDependencia.emit(registroDependencia);

                //Si cambia el dato observado, se llama esta funcion
                retrievedEventEmitter.subscribe((registroDependencia:RegistrarDependencia) => {
                    let claveIntesado = JSON.stringify(registroDependencia.interesado);
                    let claveObservado = JSON.stringify(registroDependencia.observado);
                    let claveObservado2 = JSON.stringify(registroDependencia.observado2); //2
                    
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
                            let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.observado.idDato,this.versionSeleccionada!);

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
                            let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependenciaobservado2.idDato,this.versionSeleccionada!);
                            
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
                            let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionDesarmada,registroDependencia.observado.idDato,this.versionSeleccionada!);
                            //let valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(registroDependencia.observado);
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
        }

        return resultado;
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
                    if(JSON.stringify(iterUbiAtr) === JSON.stringify(ubicacionAtributo)){
                        
                        //Busco los Datos Heredados
                        if(atrib.herencia != null){
                            const [atributoHerencia, grupoHerencia, etapaHerencia] = this.interaccionSchemaConData.getAtributoHerencia(atrib.herencia,
                                {idEtapa:atrib.ubicacion.idEtapa,idGrupo:atrib.ubicacion.idGrupo,idAtributo:atrib.id,idDato:null}
                            );
                            if(atributoHerencia!=null){
                                for(let filaDatos of atributoHerencia.filasDatos){
                                    for(let dato of filaDatos.datos){
                                        vuelta.push(dato);
                                    }
                                }
                            }
                        }
                        
                        //Agrego los datos propios
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
        modalRef.componentInstance.ubicacionAtr = this.interaccionSchemaConData.ubicacionAbsolutaDeAtributo(ubicacionAtributo,idAtributo);
        
        //Control Resolve with Observable
        modalRef.closed.subscribe({
            next: (ubicacionAtr:Ubicacion) => {
                let claveUbiAtr = JSON.stringify(ubicacionAtr);
                let retrievedValue = this.mapInformacionGuardadaDeAtributo.get(claveUbiAtr);
                if(retrievedValue){
                    
                    //Si es un Modulo (Contenido Condicional), tengo que acomodar las Unidades
                    const [esAtrCC,arrayIDDato] = this.interaccionSchemaConData.esAtributoConContenidoCondicional(ubicacionAtributo,idAtributo);
                    if(esAtrCC){
                        this.eliminarUnidadesDeModulo(ubicacionAtr,arrayIDDato,retrievedValue,indice);
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
                            //Si filaDatos == null, debo buscar si heredó
                            if(atrib.filasDatos != null){
                                for(let filaDatos of atrib.filasDatos){
                                    for(let dato of filaDatos.datos){
                                        if(TipoInput.selectUsuarioMultiple === this.mapTipoInput.revGet(dato.tipo)){
                                            let referencia = dato.opciones.referencia;
                                            if(referencia.idEtapa === ubicacionAtributo.idEtapa
                                                && referencia.idGrupo === ubicacionAtributo.idGrupo
                                                && referencia.idAtributo === idAtributo
                                            ){
                                                let datosGuardados = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(dato.ubicacion,[dato.id],this.versionSeleccionada!);
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
                    let ubicacionDato = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                    this.informarCambio.emit({cambioEnUbicacion:ubicacionDato,indiceEliminado:indice});
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
                
                let infoGuardada : InformacionGuardada | null= this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(ubicacionAtr,this.versionSeleccionada!);
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
                let clavePadreContCondicional = JSON.stringify(ubicacionAtr);
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
                    let ubicacionDato = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(dato.ubicacion,dato.id);
                    this.informarCambio.emit({cambioEnUbicacion:ubicacionDato,indiceEliminado:null});
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
        let info : InformacionGuardada | null= this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(ubicacionUnidad,this.versionSeleccionada!);
        if(info !== null){
            info.ubicacionAtributo.idDato![0] = info.ubicacionAtributo.idDato![0]-1;
        }
    }

    obtengoIngredientesContCond(ubicacionSchemaCC:Ubicacion,ubicacionModulo:Ubicacion,idOpcion:number,indiceHijo:number):[FilaDatos[],Map<string,ValorSelect[]>,number]{
        //Obtengo FilaDatos de CC y las opciones de sus selectMultipleUsuario
        //ubicacionSchemaCC = 2,24,3,[7,1]
        //ubicacionModulo   = 2,24,3,[indiceMod]
        //let filaDatosAAgregar : FilaDatos[] = [];
        let opcionesSelect : Map<string,ValorSelect[]> = new Map();
        //let maxCantDatos : number = 0;

        const [filaDatosAAgregar,maxCantDatos] = this.interaccionSchemaConData.obtenerFilasCC(ubicacionSchemaCC,idOpcion);

        //Tengo que agregar las opciones de los selectUsuarioMultiple
        for(let filaDatosCondional of filaDatosAAgregar){
            for(let datoInterno of filaDatosCondional.datos){
                switch (this.mapTipoInput.revGet(datoInterno.tipo)) {
                    case TipoInput.selectUsuarioMultiple:{
                        //Por ejemplo, Padre (modulo) indice 0, Hijo (unidad) indice 1, idDato 2
                        //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},1,2"
                        let claveHijoContCondicional = JSON.stringify(ubicacionModulo)+","+indiceHijo+","+datoInterno.id;

                        let ubicacionDesarmada : Ubicacion = {
                            idEtapa : datoInterno.opciones.referencia.idEtapa
                            ,idGrupo : datoInterno.opciones.referencia.idGrupo
                            ,idAtributo : datoInterno.opciones.referencia.idAtributo
                            ,idDato : null
                        }
                        let opSel = this.cargarOpcionesSelectUsuario(ubicacionDesarmada,datoInterno.opciones.referencia.idDato!,datoInterno.ubicacion,claveHijoContCondicional);
                        opcionesSelect.set(claveHijoContCondicional,opSel);
                    }
                }
            }
        }

        return [filaDatosAAgregar,opcionesSelect,maxCantDatos];
    }

    eliminarUnidadesDeModulo(ubicacionAtr:Ubicacion,arrayIDDato:number[],infoGuardadaModulos:InformacionGuardada,indice:number){
        //Construyo Ubicacion de Unidad
        //2,24,3,[indiceModulo,7,1]
        let ubicacionUnidad : Ubicacion = {
            idEtapa:ubicacionAtr.idEtapa,
            idGrupo:ubicacionAtr.idGrupo,
            idAtributo:ubicacionAtr.idAtributo,
            idDato:[...arrayIDDato]
        }
        ubicacionUnidad.idDato?.unshift(indice);

        //Construyo Ubicacion del map CC
        let ubicacionContCondicional : Ubicacion = {
            idEtapa:ubicacionAtr.idEtapa,
            idGrupo:ubicacionAtr.idGrupo,
            idAtributo:ubicacionAtr.idAtributo,
            idDato:[indice]
        }
        let clavePadreContCondicional = JSON.stringify(ubicacionContCondicional);
        let infoGuardadaUnidadesDeModulo_I : InformacionGuardada | null = this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(ubicacionUnidad,this.versionSeleccionada!);

        if(infoGuardadaModulos.cantidadInstancias === 1){
            
            if(infoGuardadaUnidadesDeModulo_I !== null){
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
                infoGuardadaUnidadesDeModulo_I.cantidadInstancias = 1;
                for(let valsAtrib of infoGuardadaUnidadesDeModulo_I.valoresAtributo){
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
                this.mapContenidoCondicional.set(JSON.stringify(ubicacionContCondicional),[filaDatos]);
            }
        }
        else{
            for (let indiceModulo = indice; indiceModulo < infoGuardadaModulos.cantidadInstancias; indiceModulo++) {
                
                ubicacionUnidad.idDato![0] = indiceModulo;
                ubicacionContCondicional.idDato![0] = indiceModulo;

                if(indiceModulo >= indice){
                    //Elimino dependencias de dato y opciones de selectUsuario
                    let contCondicional = this.mapContenidoCondicional.get(JSON.stringify(ubicacionContCondicional));
                    if(contCondicional !== undefined){
                        this.eliminarEntradasMapsPorCambioEnCC(contCondicional,0,JSON.stringify(ubicacionContCondicional));
                    }
                }

                if(indice === indiceModulo){
                    //Elimino las Unidades del Modulo
                    this.eliminarInformacionGuardada(ubicacionUnidad);
                    //Elimino Contenido Condicional a mostrar en UI
                    this.mapContenidoCondicional.delete(JSON.stringify(ubicacionContCondicional));
                }

                if(indiceModulo > indice){
                    //Muevo las Unidades de Modulos en base un lugar para atras
                    this.corregirIndicesModuloUnidad(ubicacionUnidad);
                    //Muevo las claves de CC
                    let contCondModulo = this.mapContenidoCondicional.get(JSON.stringify(ubicacionContCondicional));
                    this.mapContenidoCondicional.delete(JSON.stringify(ubicacionContCondicional));
                    let nuevaUbicacionContCondicional : Ubicacion = {
                        idEtapa:ubicacionAtr.idEtapa,
                        idGrupo:ubicacionAtr.idGrupo,
                        idAtributo:ubicacionAtr.idAtributo,
                        idDato:[indiceModulo-1]
                    }
                    this.mapContenidoCondicional.set(JSON.stringify(nuevaUbicacionContCondicional),contCondModulo!);
                    //Muevo las claves de los selectUsuario de la UI
                    for(const [indiceHijo,filaDatos] of contCondModulo!.entries()){
                        for(let filaDatosCondional of filaDatos){
                            for(let datoInterno of filaDatosCondional.datos){
                                switch (this.mapTipoInput.revGet(datoInterno.tipo)) {
                                    case TipoInput.selectUsuarioMultiple:{
                                        //Por ejemplo, Padre (modulo) indice 0, Hijo (unidad) indice 1, idDato 2
                                        //"{"idEtapa":2,"idGrupo":24,"idAtributo":3,"idDato":[0]},1,2"
                                        let newClaveHijoContCondicional = JSON.stringify(nuevaUbicacionContCondicional)+","+indiceHijo+","+datoInterno.id;
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

    eliminarInformacionGuardada(ubicacion:Ubicacion){
        if(this.versionActual !== undefined){
            let indiceEliminar = -1;
            for(const [indice, informacionGuardada] of this.versionActual.datosGuardados!.entries()){
                if(JSON.stringify(informacionGuardada.ubicacionAtributo) === JSON.stringify(ubicacion)){
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
                                let claveObservado = JSON.stringify(dat.opciones.referencia);
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
