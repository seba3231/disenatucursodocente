import { Injectable } from "@angular/core";
import { ComputoValorUbicacion, ValorSelect } from "../atributo/atributo.component";
import { MapTipoInput, TipoInput, TwoWayMap } from "../enumerados/enums";
import { Atributo, Computo, Dato, Etapa, FilaDatos, Grupo, Ubicacion } from "../modelos/schema.model";
import { InformacionGuardada, ValoresAtributo, ValoresDato, Version } from "../modelos/schemaData.model";
import { InitialSchemaLoaderService } from "./initial-schema-loader.service";

@Injectable({
    providedIn: 'root',
})
export class Interaccion_Schema_Data {
    
    mapTipoInput : TwoWayMap<TipoInput, string>;

    constructor(private initialSchemaService : InitialSchemaLoaderService) {
        this.mapTipoInput = MapTipoInput;
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

    ubicacionAbsolutaDeAtributo(ubicacion:Ubicacion,idAtributo:number):Ubicacion{
        return {
            idEtapa : ubicacion.idEtapa,
            idGrupo : ubicacion.idGrupo,
            idAtributo : idAtributo,
            idDato : null
        }
    }

    getAtributoHerencia(ubicacion: Ubicacion, nuevaUbicacion: Ubicacion): [Atributo|null,Grupo|null,Etapa|null]{
        if (this.initialSchemaService.defaultSchema){
            for(let etapa of this.initialSchemaService.defaultSchema?.etapas){
                for(let grupo of etapa.grupos){
                    for(let atributo of grupo.atributos){
                        
                        if (atributo.ubicacion.idEtapa == ubicacion.idEtapa
                            && atributo.ubicacion.idGrupo == ubicacion.idGrupo
                            && atributo.id == ubicacion.idAtributo
                        ){
                            if (atributo.herencia){
                                const [atributoHerencia,,] = this.getAtributoHerencia(atributo.herencia,nuevaUbicacion);
                                return [atributoHerencia, grupo, etapa]
                            }
                            else{
                                //Retornar copia del Atrib, con IDs cambiados
                                let copyAtributoHerencia :  Atributo = JSON.parse(JSON.stringify(atributo));
                                copyAtributoHerencia.ubicacion.idEtapa = nuevaUbicacion.idEtapa;
                                copyAtributoHerencia.ubicacion.idGrupo = nuevaUbicacion.idGrupo;
                                copyAtributoHerencia.id = nuevaUbicacion.idAtributo;

                                for(let filaDato of copyAtributoHerencia.filasDatos){
                                    for(let dato of filaDato.datos){
                                        this.actualizarUbicacionesDatosHeredados(dato,nuevaUbicacion);
                                    }
                                }
                                return [copyAtributoHerencia, grupo, etapa]
                            }
                        }
                    }
                }
            }
        }
        return [null,null,null];
    }

    actualizarUbicacionesDatosHeredados(datoACambiar:Dato,nuevaUbicacion:Ubicacion){
        //Cambio Ubicación de lo Heredado
        datoACambiar.ubicacion.idEtapa=nuevaUbicacion.idEtapa;
        datoACambiar.ubicacion.idGrupo=nuevaUbicacion.idGrupo;
        datoACambiar.ubicacion.idAtributo=nuevaUbicacion.idAtributo;

        //Si depende de otro Dato, debo actualizar la 
        //ubicación en caso de que ese Dato exista en esta Etapa
        if(datoACambiar.opciones != null
            && datoACambiar.opciones.referencia != null
        ){
            let schema = this.initialSchemaService.defaultSchema;
            let ubicacionReferencia = datoACambiar.opciones.referencia;
            let atributosPadreDeReferencia : Atributo[] = [];
            for(let etapa of schema?.etapas!){
                for(let grupo of etapa.grupos){
                    let result = grupo.atributos.filter(atributo=>
                        {
                            return atributo.herencia !== null
                            && atributo.herencia.idEtapa===ubicacionReferencia.idEtapa
                            && atributo.herencia.idGrupo===ubicacionReferencia.idGrupo
                            && atributo.herencia.idAtributo===ubicacionReferencia.idAtributo;
                        }
                    );
                    atributosPadreDeReferencia = atributosPadreDeReferencia.concat(result);
                }
            }
            //Solo puede haber un Atributo en Etapa 3 que Herede de un Atributo de Etapa 2.
            //No puede pasar que 2 Atrubutos de Etapa 3 Hereden de un mismo Atrib de Etapa 2.
            if(atributosPadreDeReferencia.length===1){
                datoACambiar.opciones.referencia.idEtapa=atributosPadreDeReferencia[0].ubicacion.idEtapa;
                datoACambiar.opciones.referencia.idGrupo=atributosPadreDeReferencia[0].ubicacion.idGrupo;
                datoACambiar.opciones.referencia.idAtributo=atributosPadreDeReferencia[0].id;
            }
        }
    }

    obtengoOpcionesSelectUsuario(ubicacionAtr:Ubicacion,idDato:number[],versionActual:Version) : ValorSelect[]{
        let opcionesDevueltas : ValorSelect[] = [];
        let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionAtr,idDato,versionActual);
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
        return opcionesDevueltas;
    }

    obtenerOpcionesSelectFijo(idGrupoDatoFijo:number) : ValorSelect[] {
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

    buscoValoresDatoDeAtributo(ubicacion:Ubicacion,idDato:number[] | null, versionActual:Version) : ValoresDato[]{
        //Busco por "ubicacionAtributo"
        let valsAtrib : ValoresAtributo[] = this.buscoValoresAtributoDeAtributo(ubicacion,versionActual);
        //Busco por "idDato" dentro de "valoresAtributo"
        for(let valorDato of valsAtrib){
            if(JSON.stringify(valorDato.idDato) === JSON.stringify(idDato)){
                return valorDato.valoresDato;
            }
        }
        return [];
    }

    buscoValoresAtributoDeAtributo(ubicacion:Ubicacion, versionActual:Version) : ValoresAtributo[]{
        let inforGuardada : InformacionGuardada | null = this.buscoInformacionGuardadaDeAtributo(ubicacion,versionActual);
        if(inforGuardada !== null){
            return inforGuardada.valoresAtributo;
        }
        return [];
    }

    buscoInformacionGuardadaDeAtributo(ubicacion:Ubicacion, versionActual:Version) : InformacionGuardada | null{
        if(versionActual !== undefined){
            for(let datoGuardado of versionActual.datosGuardados!){
                //Busco por "ubicacionAtributo"
                //ordeno los atributos dentro del objeto para asegurar que no de distinto por un orden diferente
                var ordered = Object.keys(datoGuardado.ubicacionAtributo).sort().reduce(
                    (obj, key) => { 
                      obj[key] = datoGuardado.ubicacionAtributo[key]; 
                      return obj;
                    }, 
                    {}
                  );
        
                let datoUbiAtr = JSON.stringify(ordered)

                ordered = Object.keys(ubicacion).sort().reduce(
                    (obj, key) => { 
                      obj[key] = ubicacion[key]; 
                      return obj;
                    }, 
                    {}
                  );
                let claveUbiAtr = JSON.stringify(ordered)

                if(datoUbiAtr === claveUbiAtr){
                    return datoGuardado;
                }
            }
        }
        return null;
    }

    calcularValorOperando(operandoObservado:Ubicacion|number,versionSeleccionada:Version):number{
        let resultado=0;
        if(typeof operandoObservado === "object"){
            //Busco en los datos guardados la Ubicación dato.computo.op1
            let ubicacionDesarmada : Ubicacion = {
                idEtapa : operandoObservado.idEtapa
                ,idGrupo : operandoObservado.idGrupo
                ,idAtributo : operandoObservado.idAtributo
                ,idDato : null
            }
            let valoresDato = this.buscoValoresDatoDeAtributo(ubicacionDesarmada,operandoObservado.idDato,versionSeleccionada);
            for(let valorDato of valoresDato){
                //Si hay valor válido
                if(valorDato.number){
                    resultado = resultado + valorDato.number;
                }
            }
            return resultado;
        }
        else{
            //Busco el valor constante con id dato.computo.op1
            let constantes = this.initialSchemaService.defaultSchema?.constantes;
            let constanteSeleccionada = constantes?.find((constante) => constante.id === operandoObservado);
            resultado = constanteSeleccionada?.valor!;
            return resultado;
        }
    }

    calcularResultadoOperacion(op1: number, op2: number, op3: number,datoComputo:Computo):number{
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
        return Math.ceil(nuevoValorComputado);
    }

    obtenerFilasCC(ubicacionSchemaCC:Ubicacion,idOpcion:number):[FilaDatos[],number]{

        let filaDatosAAgregar : FilaDatos[] = [];
        let maxCantDatos : number = 0;

        //Todos los ContCond
        let contenidoCondicional = this.initialSchemaService.defaultSchema?.contenidoCondicional;
        //Los ContCond que son de este Dato - 2,24,3,[7,1]
        let contenidosMatchean = contenidoCondicional?.filter((contMacth) => JSON.stringify(contMacth.muestroSi.referencia) === JSON.stringify(ubicacionSchemaCC));

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

                for(let filaDato of filaDatosHeredadas){
                    for(let dato of filaDato.datos){
                        this.actualizarUbicacionesDatosHeredados(dato,ubicacionSchemaCC);
                    }
                    //Lo agrego al FilaDatos retorno
                    filaDatosAAgregar.push(filaDato);
                }

                //FilaDatos del "Original", luego de lo heredado
                if(contenidoEncontrado.filasDatos){
                    let copiaFilaDatosAAgregar = JSON.parse(JSON.stringify(contenidoEncontrado.filasDatos));
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
        let contenidosMatchean = contenidoCondicional?.find((contMacth) => JSON.stringify(contMacth.id) === JSON.stringify(idCC));
        if(contenidosMatchean){
            if(contenidosMatchean.herencia != null){
                let filaDatosRecursivo = this.obtenerFilasCCHeredadas(contenidosMatchean.herencia);
                for(let fila of filaDatosRecursivo){
                    filaDatosAAgregar.push(fila);
                }
            }
            let copiaFilaDatosAAgregar = JSON.parse(JSON.stringify(contenidosMatchean.filasDatos));
            for(let fila of copiaFilaDatosAAgregar){
                filaDatosAAgregar.push(fila);
            }
        }

        return filaDatosAAgregar;
    }

    obtengoIngredientesContCond(ubicacionSchemaCC:Ubicacion,ubicacionModulo:Ubicacion,idOpcion:number,indiceHijo:number,versionSeleccionada:Version):[FilaDatos[],Map<string,ValorSelect[]>,number]{
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
                        let claveHijoContCondicional = JSON.stringify(ubicacionModulo)+","+indiceHijo+","+datoInterno.id;

                        let ubicacionDesarmada : Ubicacion = {
                            idEtapa : datoInterno.opciones.referencia.idEtapa
                            ,idGrupo : datoInterno.opciones.referencia.idGrupo
                            ,idAtributo : datoInterno.opciones.referencia.idAtributo
                            ,idDato : null
                        }
                        opcionesSelect.set(claveHijoContCondicional,this.obtengoOpcionesSelectUsuario(ubicacionDesarmada,datoInterno.opciones.referencia.idDato!,versionSeleccionada));
                    }
                }
            }
        }

        return [filaDatosAAgregar,opcionesSelect,maxCantDatos];
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
}