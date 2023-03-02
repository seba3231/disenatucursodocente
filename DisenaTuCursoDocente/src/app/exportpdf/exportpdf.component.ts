import { Component, OnInit } from '@angular/core';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { Ubicacion,Atributo, Esquema, FilaDatos, Dato, Computo, DependenciaDeDatos } from '../modelos/schema.model';
const pdfMakeX = require('pdfmake/build/pdfmake.js');
const pdfFontsX = require('pdfmake-unicode/dist/pdfmake-unicode.js');
pdfMakeX.vfs = pdfFontsX.pdfMake.vfs;
import * as pdfMake from 'pdfmake/build/pdfmake';
import { __values } from 'tslib';
import { InformacionGuardada, SchemaSavedData, ValoresDato, Version } from '../modelos/schemaData.model';
import { Interaccion_Schema_Data } from '../servicios/interaccion-schema-data.service';
import { ValorSelect } from '../atributo/atributo.component';
import { MapTipoInput, TipoInput, TwoWayMap } from '../enumerados/enums';

@Component({
  selector: 'app-exportpdf',
  templateUrl: './exportpdf.component.html',
  styleUrls: ['./exportpdf.component.css']
})
export class ExportpdfComponent{
    
    pdf: any;
    mapTipoInput : TwoWayMap<TipoInput, string>;

    constructor(private initialSchemaService : InitialSchemaLoaderService,
        private interaccionSchemaConData: Interaccion_Schema_Data
    ) { 
        this.mapTipoInput =  MapTipoInput;
        this.loadPDFLibraryAndStyles();
    }

    ngOnInit(): void { }

    loadPDFLibraryAndStyles(){
        var pdfMake = require("pdfmake/build/pdfmake");
        var pdfFonts = require("pdfmake/build/vfs_fonts");
        pdfMake.vfs = pdfFonts.pdfMake.vfs;

        this.pdf = {
            info: {
                title: 'Reporte PDF Curso',
                author: 'Tesis Ingeniería en Computación',
                subject: 'Información Curso',
                keywords: '',
            },
            content: [],
            styles: {
                header: {
                    fontSize: 24,
                    bold: true,
                    lineHeight: 1.2
                },
                subheader: {
                    fontSize: 20,
                    bold: true,
                    lineHeight: 1.2
                },
                subsubheader: {
                    fontSize: 16,
                    bold: true,
                    lineHeight: 1.2
                },
                nombreAtributo: {
                    fontSize: 12,
                    bold: true,
                    lineHeight: 1.2
                },
                title_body: {
                    fontSize: 12
                },
                body: {
                    fontSize: 12
                },
                link: {
                    fontSize: 12,
                    color: '#03A9F4'
                    // margin: [0, 15, 0, 15] 
                }
            }
        };
    }

    newGeneratePdf(savedDataCruso:SchemaSavedData,versionSeleccionada:Version){
        this.pdf.content.push({text: savedDataCruso.nombreCurso,style: 'header' });
        this.pdf.content.push({text: "Autor: " + versionSeleccionada.autor,style: 'body' });
        if (savedDataCruso.institucion){
            this.pdf.content.push({text: "Institución: " + savedDataCruso.institucion,style: 'body' });
        }
        this.pdf.content.push({text: '\n',style: 'body' });
        let schema : Esquema = this.initialSchemaService.defaultSchema!;
        for(let etapa of schema.etapas){
            
            this.pdf.content.push({text: '__________________________________________________________________________________', style: 'body'});
            this.pdf.content.push({text: etapa.nombre, style: 'subheader',margin: [ 0, 15, 0, 5 ] });

            for(let grupo of etapa.grupos){
                
                this.pdf.content.push({text: grupo.nombre, style: 'subsubheader',margin: [ 0, 10, 0, 5 ] });
                
                for(let atributo of grupo.atributos){
                    //Obtengo InformacionGuardada de Atributo
                    let stringUbicacionAtrib = JSON.stringify(this.interaccionSchemaConData.ubicacionAbsolutaDeAtributo(atributo.ubicacion,atributo.id));
                    let datoGuardado : InformacionGuardada | null = null;
                    for(let infoGuardada of versionSeleccionada.datosGuardados!){
                        if (JSON.stringify(infoGuardada.ubicacionAtributo) === stringUbicacionAtrib){
                            datoGuardado = infoGuardada;
                            break;
                        }
                    }

                    //Imprimo Herencia primero
                    if (atributo.herencia){
                        let [atributoHerencia, grupoHerencia, etapaHerencia] = this.interaccionSchemaConData.getAtributoHerencia(atributo.herencia,{idEtapa:atributo.ubicacion.idEtapa,idGrupo:atributo.ubicacion.idGrupo,idAtributo:atributo.id,idDato:null});
                        if(atributoHerencia != null && grupoHerencia != null && etapaHerencia != null){
                            if(atributoHerencia.nombre == null){
                                atributoHerencia.nombre = atributo.nombre;
                            }
                            this.imprimirAtributo(atributoHerencia,datoGuardado,versionSeleccionada);
                        }
                    }

                    //Imprimo datos propios del Atributo
                    if (atributo.filasDatos && !atributo.herencia){
                        this.imprimirAtributo(atributo,datoGuardado,versionSeleccionada);
                    }
                }
            }
        }
        const pdf = pdfMake.createPdf(this.pdf);
        return pdf;
    }

    imprimirAtributo(atributo:Atributo,datoGuardado : InformacionGuardada | null, versionSeleccionada:Version){
        let tituloAtributo = "";
        if(atributo.nombre != null){
            tituloAtributo+= atributo.nombre;
        }
        this.pdf.content.push({text: tituloAtributo ,style: 'nombreAtributo', preserveLeadingSpaces: true });
        
        if(datoGuardado!==null){
            //Map con el ContenidoCondicional del Dato, si aplica
            let mapContenidoCondicional : Map<string,FilaDatos[][]> = new Map();

            //Por cada Instancia del Atributo, imprimo sus Datos
            for(let index = 0; index<datoGuardado.cantidadInstancias; index++){
                const [esAtrCC,_unused] = this.interaccionSchemaConData.esAtributoConContenidoCondicional(atributo.ubicacion,atributo.id);
                if(esAtrCC){
                    // this.pdf.content.push({text: "Modulo "+index.toString() ,style: 'body', preserveLeadingSpaces: true });
                }
                for(let filaDatos of atributo.filasDatos){
                    let lineaAImprimir :string;
                    for(let dato of filaDatos.datos){
                        //Computo opciones de los Select del Atributo de contenidoCondicional
                        if(dato.filasDatos !== null){
                            //Cambio la Ubicacion Heredada por la Ubicación del Atributo actual
                            let datoInterior = dato.filasDatos[0].datos[0];
                            datoInterior.ubicacion.idEtapa = atributo.ubicacion.idEtapa;
                            datoInterior.ubicacion.idGrupo = atributo.ubicacion.idGrupo;
                            datoInterior.ubicacion.idAtributo =  atributo.id;
                            
                            //ubicacionAbsInterior = 2,24,3,[7,1]
                            let ubicacionAbsInterior = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(datoInterior.ubicacion,datoInterior.id);
                            //ubicacionUnidadesDeModulo_I = 2,24,3,[i]
                            let ubicacionUnidadesDeModulo_I : Ubicacion = JSON.parse(JSON.stringify(ubicacionAbsInterior));
                            ubicacionUnidadesDeModulo_I.idDato = [index];

                            let retrievedValue = mapContenidoCondicional.get(JSON.stringify(ubicacionUnidadesDeModulo_I));
                            if(!retrievedValue){
                                //Esto no imprime, carga mapOpcionesSelect y mapContenidoCondicional
                                //Que luego son impactados en el PDF
                                this.cargoCC(mapContenidoCondicional,datoInterior,versionSeleccionada);
                            }
                        }

                        if(this.cumpleDependencia(dato.habilitadoSi,versionSeleccionada)){
                            lineaAImprimir = this.obtenerStringDeDato(this.mapTipoInput.revGet(dato.tipo)!,index,null,dato,mapContenidoCondicional,versionSeleccionada,"");

                            if (dato && dato.nombre){
                                lineaAImprimir = dato.nombre + ": " + lineaAImprimir;
                            }
                            this.pdf.content.push({text: lineaAImprimir ,style: 'body', preserveLeadingSpaces: true });
                        }
                    }
                }
                this.pdf.content.push({text: '\n',style: 'body' });
            }
        }
    }

    obtenerStringDeDato(tipoInput: TipoInput,indexPadre:number,indexHijo:number|null,dato:Dato,mapContenidoCondicional: Map<string, FilaDatos[][]>,versionSeleccionada:Version,indent:string):string{
        let vuelta : string = "";
        let valoresDato : ValoresDato[] = [];
        if(indexHijo === null){
            valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(
                {idEtapa:dato.ubicacion.idEtapa,idGrupo:dato.ubicacion.idGrupo,idAtributo:dato.ubicacion.idAtributo,idDato:null},
                [dato.id],
                versionSeleccionada
            );
        }
        else{
            let ubicacionUnidad : Ubicacion = JSON.parse(JSON.stringify(dato.ubicacion));
            ubicacionUnidad.idDato!.unshift(indexPadre);

            let arrayDato : number[] = [...dato.ubicacion.idDato!];
            arrayDato.push(dato.id);
            valoresDato = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(
                ubicacionUnidad,
                arrayDato,
                versionSeleccionada
            );
            indexPadre=indexHijo;
        }

        let opcionesDevueltas : ValorSelect[] = [];
        if(dato.opciones !== null){
            let todasLasOpciones : ValorSelect[] = [];
            if(dato.opciones.referencia){
                //Busco en los datos guardados la Ubicación dato.opciones.referencia
                //let ubicacionAtr : Ubicacion = {idEtapa : dato.opciones.referencia.idEtapa,idGrupo : dato.opciones.referencia.idGrupo,idAtributo : dato.opciones.referencia.idAtributo,idDato : null}
                todasLasOpciones = this.interaccionSchemaConData.obtengoOpcionesSelectUsuario({idEtapa : dato.opciones.referencia.idEtapa,idGrupo : dato.opciones.referencia.idGrupo,idAtributo : dato.opciones.referencia.idAtributo,idDato : null},dato.opciones.referencia.idDato!,versionSeleccionada);
            }
            else{
                todasLasOpciones = this.interaccionSchemaConData.obtenerOpcionesSelectFijo(dato.opciones.idGrupoDatoFijo);
            }
            //Quito las opciones que no se muestran
            for(let valorSelect of todasLasOpciones){
                if(this.cumpleDependencia(valorSelect.muestroSi,versionSeleccionada)){
                    opcionesDevueltas.push(valorSelect);
                }
            }
        }

        if(tipoInput === undefined){
            //Es Unidad de Modulo - Devuelvo TODA la Unidad
            let datoInterior = dato.filasDatos[0].datos[0];
            
            //ubicacionAbsInterior = 2,24,3,[i,7,1]
            let ubicacionAbsInterior = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(datoInterior.ubicacion,datoInterior.id);
            ubicacionAbsInterior.idDato!.unshift(indexPadre);

            //ubicacionUnidadesDeModulo_I = 2,24,3,[i]
            let ubicacionUnidadesDeModulo_I : Ubicacion = JSON.parse(JSON.stringify(ubicacionAbsInterior));
            ubicacionUnidadesDeModulo_I.idDato = [indexPadre];

            let retrievedValue = mapContenidoCondicional!.get(JSON.stringify(ubicacionUnidadesDeModulo_I));
            if(retrievedValue){
                /*                                                         [  Unidad 0   ,  Unidad 1   ,  Unidad 2  ,  Unidad 3   ] -->
                mapContenidoCondicional.get( 2,24,3,[instanciaModulo] ) -> [ FilaDatos[] , FilaDatos[] , FilaDatos[], FilaDatos[] ] */
                for(const [indiceUnidad,value] of retrievedValue.entries()){
                    vuelta+="\n    Unidad "+indiceUnidad.toString();
                    for(let filaDatos of value){
                        for(let datoCC of filaDatos.datos){
                            vuelta+="\n    ";
                            if (datoCC && datoCC.nombre){
                                vuelta+=datoCC.nombre + ": ";
                            }
                            vuelta+=this.obtenerStringDeDato(this.mapTipoInput.revGet(datoCC.tipo)!,indexPadre,indiceUnidad,datoCC,mapContenidoCondicional,versionSeleccionada,"    ");
                        }
                    }
                    vuelta+="\n    ";
                }
            }
            else{
                vuelta+="Error en Unidades de Modulo "+indexPadre.toString();
            }
        }
        else if(valoresDato.length !== 0){
            switch (tipoInput) {
                case TipoInput.text:{
                    if(valoresDato[indexPadre].string !== null){
                        vuelta+=valoresDato[indexPadre].string;
                    }
                    else{
                        vuelta+="-";
                    }
                    break;
                }
                case TipoInput.date:{
                    vuelta+=this.dateToString(valoresDato[indexPadre].date);
                    break;
                }
                case TipoInput.porcentaje:
                case TipoInput.number:{
                    if(valoresDato[indexPadre].number !== null){
                        vuelta+=valoresDato[indexPadre].number!.toString();
                    }
                    else{
                        vuelta+="-";
                    }
                    break;
                }
                case TipoInput.selectUsuarioMultiple:{
                    vuelta+=this.opcionesSeleccionadasAString(valoresDato[indexPadre!]?.selectUsuario,opcionesDevueltas);
                    break;
                }
                case TipoInput.selectFijoMultiple:{
                    vuelta+=this.opcionesSeleccionadasAString(valoresDato[indexPadre!]?.selectFijo,opcionesDevueltas);
                    break;
                }
                case TipoInput.selectFijoUnico:
                case TipoInput.radio:{
                    if(valoresDato[indexPadre!]?.selectFijo){
                        let opcionSeleccionada = valoresDato[indexPadre!].selectFijo![0];
                        let valorSelect = opcionesDevueltas.find((opcion) => opcion.valor === opcionSeleccionada);
                        if(valorSelect != undefined){
                            vuelta+=valorSelect.string;
                        }
                    }
                    else{
                        vuelta+="-";
                    }
                    break;
                }
                case TipoInput.archivo:{
                    if(valoresDato[indexPadre!]?.archivo !== null){
                        vuelta+="\n    "+indent+"Nombre: ";
                        if(valoresDato[indexPadre!]?.archivo?.texto !== null){
                            vuelta+=valoresDato[indexPadre!]?.archivo?.texto;
                        }
                        else{
                            vuelta+="-";
                        }
                        
                        if(valoresDato[indexPadre!]?.archivo?.ruta !== null){
                            vuelta+="\n    "+indent+"Enlace: ";
                            vuelta+=valoresDato[indexPadre!]?.archivo?.ruta;
                        }
                        
                        if(valoresDato[indexPadre!]?.archivo?.fileName !== null){
                            vuelta+="\n    "+indent+"Nombre de Archivo: ";
                            vuelta+=valoresDato[indexPadre!]?.archivo?.fileName;
                        }
                    }
                    break;
                }
                case TipoInput.computo:{
                    let datoComputo : Computo = dato.computo;
                    let op1 = this.interaccionSchemaConData.calcularValorOperando(datoComputo.op1,versionSeleccionada);
                    let op2 = this.interaccionSchemaConData.calcularValorOperando(datoComputo.op2,versionSeleccionada);
                    let op3 = this.interaccionSchemaConData.calcularValorOperando(datoComputo.op3,versionSeleccionada);
                    vuelta+=this.interaccionSchemaConData.calcularResultadoOperacion(op1,op2,op3,datoComputo).toString();
                    break;
                }
                default:
                    return "null_default";
            }
        }
        else{
            vuelta+="Sin Datos: "+JSON.stringify(dato.ubicacion);
        }
        return vuelta;
    }

    dateToString(dateValue:Date|null):string{
        if(dateValue == null || Object.entries(dateValue).length == 0){
          return "--/--/----"
        }
        
        let date : Date = new Date(dateValue);
        /*getFullYear: Gets 4-digit year according to local time
        getMonth: Gets month of the year (0-11) according to local time. Month is zero-indexed.
        getDate: Gets day of the month (1-31) according to local time.*/
        let diaCalculado = date.getDate();
        let dia :string = diaCalculado.toString();
        if(diaCalculado <= 9){
            dia = "0"+diaCalculado.toString();
        }
        let mesCalculado = date.getMonth()+1;
        let mes :string = mesCalculado.toString();
        if(mesCalculado <= 9){
            mes = "0"+mesCalculado.toString();
        }

        return dia+"/"+mes+"/"+date.getFullYear();
    }

    cumpleDependencia(dependencia:DependenciaDeDatos|null,versionSeleccionada:Version):boolean{
        if(dependencia !== null){
            let atribRef : Ubicacion = {idEtapa : dependencia.referencia.idEtapa,idGrupo : dependencia.referencia.idGrupo, idAtributo : dependencia.referencia.idAtributo,idDato : null};
            let idDato : number[] = dependencia.referencia.idDato!;
            let valoresGuardados : ValoresDato[] = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(atribRef,idDato,versionSeleccionada);
            if(valoresGuardados[0].selectFijo != null){
                let opcionSeleccionada : number = valoresGuardados[0].selectFijo[0];
                if(opcionSeleccionada == dependencia.valorSeleccionado.idOpcion){
                    return true;
                }
            }
            return false;
        }
        return true;
    }

    opcionesSeleccionadasAString(indicesSeleccionados:number[]|null,opcionesDevueltas : ValorSelect[]):string{
        let vuelta="";
        if(indicesSeleccionados){
            vuelta+="[ ";
            let primero=true;
            for(let value of indicesSeleccionados.values()){
                if(primero){
                    primero=false;
                }
                else{
                    vuelta+=", ";
                }
                vuelta+=opcionesDevueltas[value].string                
            }
            vuelta+=" ]";
        }
        else{
            vuelta+="-";
        }
        return vuelta;
    }

    cargoCC(mapContenidoCondicional : Map<string,FilaDatos[][]>,
        datoInterior:Dato,
        versionSeleccionada:Version
    ){

        //ubicacionAbsInterior = 2,24,3,[7,1]
        let ubicacionAbsInterior = this.interaccionSchemaConData.ubicacionAbsolutaDeDato(datoInterior.ubicacion,datoInterior.id);
       
        //Cantidad de instancias de Modulo
        let cantidadInstanciasAtributo = this.interaccionSchemaConData.buscoInformacionGuardadaDeAtributo(
            {idEtapa : datoInterior.ubicacion.idEtapa,idGrupo : datoInterior.ubicacion.idGrupo,idAtributo : datoInterior.ubicacion.idAtributo,idDato : null},
            versionSeleccionada
        )?.cantidadInstancias;
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
            let contCondicional = mapContenidoCondicional.get(clavePadreContCondicional);
            if(contCondicional === undefined){
                mapContenidoCondicional.set(
                    clavePadreContCondicional,
                    []
                );
                contCondicional = mapContenidoCondicional.get(clavePadreContCondicional);
            }
                                        
            ubicacionAbsInterior.idDato![0] = i;
            //ubicacionAbsInterior = 2,24,3,[i,7,1]
            let valoresSelectCondicional : ValoresDato[] = this.interaccionSchemaConData.buscoValoresDatoDeAtributo(ubicacionAbsInterior,arrayDato,versionSeleccionada);
            for(let [indexSelCond,valSelCond] of valoresSelectCondicional.entries()){

                let idOpcion = 0;
                if(valSelCond.selectFijo !== null){
                    idOpcion = valSelCond.selectFijo[0];
                }

                //UbSchema = 2,24,3,[7,1]
                //UbModulo = 2,24,3,[indiceMod]
                const [filaDatos,opciones,maxCantDatos] = this.interaccionSchemaConData.obtengoIngredientesContCond(
                    {idEtapa : ubicacionAbsInterior.idEtapa,idGrupo : ubicacionAbsInterior.idGrupo,idAtributo : ubicacionAbsInterior.idAtributo,idDato:[...arrayDato]},
                    {idEtapa : ubicacionAbsInterior.idEtapa,idGrupo : ubicacionAbsInterior.idGrupo,idAtributo : ubicacionAbsInterior.idAtributo,idDato:[i]},
                    idOpcion,
                    indexSelCond,
                    versionSeleccionada
                );

                //Agrego FilaDatos a mapCC
                contCondicional?.push(filaDatos);
            }
        }
    }

  getAtributoHerencia(ubicacion: Ubicacion): any{ //retorna un Dato completo
    if (this.initialSchemaService.defaultSchema){
        for(let etapa of this.initialSchemaService.defaultSchema?.etapas){
            for(let grupo of etapa.grupos){
                for(let atributo of grupo.atributos){
                    
                    if (atributo.ubicacion.idEtapa == ubicacion.idEtapa
                        && atributo.ubicacion.idGrupo == ubicacion.idGrupo
                        && atributo.id == ubicacion.idAtributo){
                        if (atributo.herencia){
                          return this.getAtributoHerencia(atributo.herencia)
                        }else{
                          return atributo
                        }
                    }
                }
            }
        }
    }
}

  getDatoInfo(ubicacion: Ubicacion, idDato: number): any{ //retorna un Dato completo
    if (this.initialSchemaService.defaultSchema)
        for(let etapa of this.initialSchemaService.defaultSchema?.etapas){
            for(let grupo of etapa.grupos){
                for(let atributo of grupo.atributos){
                  if (atributo.ubicacion.idEtapa == ubicacion.idEtapa
                    && atributo.ubicacion.idGrupo == ubicacion.idGrupo
                    && atributo.id == ubicacion.idAtributo){

                      console.log(atributo)
                      if (atributo.herencia){
                        var atributoHerencia : Atributo | undefined;
                        atributoHerencia = this.getAtributoHerencia(atributo.herencia)
                        if (atributoHerencia){
                            // atributoHerencia.ubicacion = atributo.ubicacion
                            for(let filaDatos of atributoHerencia.filasDatos){
                                for(let dato of filaDatos.datos){
                                  if (dato.id == idDato)
                                    return dato;
                                }
                            }
                        }
                      }
                      if (atributo.filasDatos){
                        for(let filaDato of atributo.filasDatos){
                            for(let dato of filaDato.datos){
                              if (dato.id == idDato)
                                  if (dato.ubicacion.idEtapa == ubicacion.idEtapa
                                      && dato.ubicacion.idGrupo == ubicacion.idGrupo
                                      && dato.ubicacion.idAtributo == ubicacion.idAtributo){
                                        
                                      return dato;
                                  }
                            }
                        }
                      }
                    }
                }
            }
        }
    // return  undefined;
  }

  getDatoInfoAtributo(ubicacion: Ubicacion): any{ //retorna un Dato completo
    if (this.initialSchemaService.defaultSchema)
        for(let etapa of this.initialSchemaService.defaultSchema?.etapas){
            for(let grupo of etapa.grupos){
                for(let atributo of grupo.atributos){
                    
                    if (atributo.ubicacion.idEtapa == ubicacion.idEtapa
                        && atributo.ubicacion.idGrupo == ubicacion.idGrupo){
                          
                        return [grupo,etapa];
                    }
                }
            }
        }
    // return  undefined;
  }

  getDatoGuardadoInfo(ubicacion: Ubicacion, datosGuardados: [InformacionGuardada]): any{
    for (let dato of datosGuardados ){
      if (dato.ubicacionAtributo.idEtapa== ubicacion.idEtapa && 
        dato.ubicacionAtributo.idGrupo == ubicacion.idGrupo &&
        dato.ubicacionAtributo.idAtributo == ubicacion.idAtributo){
          for (let valoresAtributo of dato.valoresAtributo){
            if(valoresAtributo.idDato[0] == ubicacion.idDato![0]){
              return valoresAtributo;
            }
          }
      }
    }
  }

  getValueDatoFijo(idGrupoDatoFijo: number, datofijoIn: []): string{
    var grupoDatosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;
    var nombre = '';
    if (grupoDatosFijos)
      for (let grupoDatofijo of grupoDatosFijos){
        if (grupoDatofijo.id == idGrupoDatoFijo)
          for (let datoFijo of grupoDatofijo.opciones){
            for (let id of datofijoIn)
              if (datoFijo.id == id)
                if (nombre==='')
                  nombre = datoFijo.valor
                else
                  nombre = nombre + ', ' + datoFijo.valor
          }
      }

    
    return  nombre;
  }
  
    getValueDatoFijoRef(referencia: any, datofijoIn: [], datosGuardados: any): string{
        var nombre = '';
        
        for (let dato of datosGuardados){
            if(referencia != null){
                if (dato.ubicacionAtributo.idEtapa == referencia.idEtapa &&
                    dato.ubicacionAtributo.idGrupo == referencia.idGrupo &&
                    dato.ubicacionAtributo.idAtributo == referencia.idAtributo
                ){
                    for (let valoreAtributo of dato.valoresAtributo){
                        for (let atr of  valoreAtributo.idDato){
                            if (atr ==dato.ubicacionAtributo.idAtributo){
                                for(let datofijo of datofijoIn){
                                    if(valoreAtributo.valoresDato[datofijo]){
                                        let valorDato = valoreAtributo.valoresDato[datofijo];
                                        let valueString;
                                        if (valorDato.string){
                                            valueString = valorDato.string;
                                        }else if(valorDato.number){
                                            valueString = valorDato.number.toString() ;
                                        }else if(valorDato.date){
                                            valueString = valorDato.date.toString();
                                        }else if(valorDato.selectFijo){
                                        if (dato.opciones.idGrupoDatoFijo)
                                            valueString = this.getValueDatoFijo(dato.opciones.idGrupoDatoFijo,valorDato.selectFijo);
                                        else{
                                            if(dato.opciones.referencia)
                                                valueString = this.getValueDatoFijoRef(dato.opciones.referencia,valorDato.selectFijo, datosGuardados);
                                        }
                                        }else if(valorDato.selectUsuario){
                                            valueString = valorDato.selectFijo.toString();
                                        }else if(valorDato.archivo){
                                            valueString = valorDato.archivo.texto
                                        }else{
                                            valueString = ''
                                        }
                                        if (nombre==='')
                                            nombre = valueString
                                        else
                                            nombre = nombre + ', ' + valueString
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return  nombre;
    }
  

  generatePdf(cursoId:number) : any {
    var htmlToPdfmake = require("html-to-pdfmake");
    var pdfMake = require("pdfmake/build/pdfmake");
    var pdfFonts = require("pdfmake/build/vfs_fonts");
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    this.pdf = {
      content: [
      //   {text: 'PdfComponent Example', style: 'header'},
      //   {text: 'This was generated using Angular and PdfMake', style: 'body'},
      //   {text: 'PdfMake', link: 'https://pdfmake.github.io/docs/', style: 'link'}
      ],
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          lineHeight: 1.2
        },
        subheader: {
          fontSize: 20,
          bold: true,
          lineHeight: 1.2
        },
        subsubheader: {
          fontSize: 16,
          bold: true,
          lineHeight: 1.2
        },
        title_body: {
          fontSize: 12
        },
        body: {
          fontSize: 12
        },
        link: {
          fontSize: 12,
          color: '#03A9F4'
          // margin: [0, 15, 0, 15] 
        }
      }
    };

    var cursos = this.initialSchemaService.allData;
    if (cursos){
        var cursosDatos: any;
        for (var i=0; i < cursos.length; i++) {
          if (cursos[i].id == cursoId){
            // cargo la informacion de los atributos del curso que quiere exportar
            cursosDatos = cursos[i].versiones.at(-1);

            this.pdf.content.push({text: cursos[i].nombreCurso,style: 'header' });
            this.pdf.content.push({text: "Autor: " + cursosDatos.autor,style: 'body' });
            if (cursosDatos.intitucion)
              this.pdf.content.push({text: "Institución: " + cursosDatos.intitucion,style: 'body' });
            this.pdf.content.push({text: '\n',style: 'body' });
            if (cursosDatos){  
              if (cursosDatos){
                  var valueString:string|null = null;
                  var ultimoGrupo;
                  var ultimaEtapa;
                  for(let datoGuardado of cursosDatos!.datosGuardados){
                    var cantidadInstancias = datoGuardado.cantidadInstancias;
                    
                    for (var cant=0; cant < cantidadInstancias; cant++) {
                      for (var j=0; j < datoGuardado.valoresAtributo.length; j++) { //array 4
                          var columna = datoGuardado.valoresAtributo[j]
                          var idDato = columna.idDato[0]
                          for (var m=0; m < columna.valoresDato.length; m++) {
                            if (m == cant){
                                let valorDato = columna.valoresDato[m]
                                var dato = this.getDatoInfo(datoGuardado.ubicacionAtributo, columna.idDato[0])
                                if (dato.filasDatos == null){
                                  // no tiene contenido condicional
                                  var cumpleHabilitado = false;
                                  if (dato && dato.habilitadoSi){
                                    var datoHabilitadoSi = this.getDatoGuardadoInfo(dato.habilitadoSi.referencia,cursosDatos!.datosGuardados)
                                    if (datoHabilitadoSi.valoresDato[0].selectFijo && datoHabilitadoSi.valoresDato[0].selectFijo[0] == dato.habilitadoSi.valorSeleccionado.idOpcion){
                                      cumpleHabilitado = true
                                    }else{
                                      cumpleHabilitado = false
                                    }
                                  }else{
                                    cumpleHabilitado = true
                                  }

                                  if (cumpleHabilitado){
                                    if (valorDato.string){
                                      valueString = valorDato.string;
                                    }else if(valorDato.number){
                                        valueString = valorDato.number.toString() ;
                                    }else if(valorDato.date){
                                        valueString = valorDato.date.toString();
                                    }else if(valorDato.selectFijo){
                                      if (dato.opciones.idGrupoDatoFijo)
                                        valueString = this.getValueDatoFijo(dato.opciones.idGrupoDatoFijo,valorDato.selectFijo);
                                      else{
                                        
                                        if(dato.opciones.referencia)
                                          valueString = this.getValueDatoFijoRef(dato.opciones.referencia,valorDato.selectFijo, cursosDatos.datosGuardados);
                                      }
                                  

                                    }else if(valorDato.selectUsuario){
                                      valueString = this.getValueDatoFijoRef(dato.opciones.referencia,valorDato.selectUsuario, cursosDatos.datosGuardados);
                                      
                                    }else if(valorDato.archivo){
                                      console.log(valorDato)
                                      valueString = valorDato.archivo.texto
                                      if (valorDato.archivo.ruta){
                                        valueString += ' [' +  valorDato.archivo.ruta + ']'
                                      }else{
                                        if(valorDato.archivo.fileName)
                                          valueString += ' [' +  valorDato.archivo.fileName + ']'
                                      }
                                      
                                    }else{
                                        valueString = ''
                                    }

                                    var [grupoInfo, etapaInfo] = this.getDatoInfoAtributo(datoGuardado.ubicacionAtributo)
                                    if (ultimaEtapa === undefined || ultimaEtapa !== datoGuardado.ubicacionAtributo.idEtapa){
                                      ultimaEtapa = datoGuardado.ubicacionAtributo.idEtapa
                                      
                                      if (etapaInfo.nombre)
                                        this.pdf.content.push({text: '__________________________________________________________________________________', style: 'body'});
                                        this.pdf.content.push({text: etapaInfo.nombre, style: 'subheader',margin: [ 0, 15, 0, 5 ] });
                                    }
                                  
                                    if (ultimoGrupo === undefined || ultimoGrupo !== datoGuardado.ubicacionAtributo.idGrupo){
                                      ultimoGrupo = datoGuardado.ubicacionAtributo.idGrupo
                                      if (grupoInfo.nombre)
                                        this.pdf.content.push({text: grupoInfo.nombre, style: 'subsubheader',margin: [ 0, 10, 0, 5 ] });
                                    }
                                    
                                    if (dato && dato.nombre)
                                      this.pdf.content.push({text: dato.nombre + ": " + valueString,style: 'body' });
                                    else
                                      if (valueString)
                                        this.pdf.content.push({text: valueString,style: 'body' });
                                    
                                    if (j == datoGuardado.valoresAtributo.length - 1)
                                      this.pdf.content.push({text: '\n',style: 'body' });
                                  }
                                }else{
                                  //con contenido condicional
                                  for (let datofilasDatos of dato.filasDatos){
                                    for (let datoCondicional of datofilasDatos.datos){
                                      var cumpleHabilitado = false;
                                      if (datoCondicional && dato.habilitadoSi){
                                        var datoHabilitadoSi = this.getDatoGuardadoInfo(datoCondicional.habilitadoSi.referencia,cursosDatos!.datosGuardados)
                                        if (datoHabilitadoSi.valoresDato[0].selectFijo && datoHabilitadoSi.valoresDato[0].selectFijo[0] == datoCondicional.habilitadoSi.valorSeleccionado.idOpcion){
                                          cumpleHabilitado = true
                                        }else{
                                          cumpleHabilitado = false
                                        }
                                      }else{
                                        cumpleHabilitado = true
                                      }

                                      if (cumpleHabilitado){
                                        if (valorDato.string){
                                          valueString = valorDato.string;
                                        }else if(valorDato.number){
                                            valueString = valorDato.number.toString() ;
                                        }else if(valorDato.date){
                                            valueString = valorDato.date.toString();
                                        }else if(valorDato.selectFijo){
                                          if (datoCondicional.opciones.idGrupoDatoFijo)
                                            valueString = this.getValueDatoFijo(datoCondicional.opciones.idGrupoDatoFijo,valorDato.selectFijo);
                                          else{
                                            if(datoCondicional.opciones.referencia)
                                              valueString = this.getValueDatoFijoRef(datoCondicional.opciones.referencia,valorDato.selectFijo, cursosDatos.datosGuardados);
                                          }
                                      

                                        }else if(valorDato.selectUsuario){
                                          if(datoCondicional.opciones.referencia)
                                            valueString = this.getValueDatoFijoRef(datoCondicional.opciones.referencia,valorDato.selectUsuario, cursosDatos.datosGuardados);
                                          
                                        }else if(valorDato.archivo){
                                          console.log(valorDato)
                                          valueString = valorDato.archivo.texto
                                          if (valorDato.archivo.ruta){
                                            valueString += ' [' +  valorDato.archivo.ruta + ']'
                                          }else{
                                            if(valorDato.archivo.fileName)
                                              valueString += ' [' +  valorDato.archivo.fileName + ']'
                                          }
                                          
                                        }else{
                                            valueString = ''
                                        }

                                        var [grupoInfo, etapaInfo] = this.getDatoInfoAtributo(datoGuardado.ubicacionAtributo)
                                        if (ultimaEtapa === undefined || ultimaEtapa !== datoGuardado.ubicacionAtributo.idEtapa){
                                          ultimaEtapa = datoGuardado.ubicacionAtributo.idEtapa
                                          
                                          if (etapaInfo.nombre)
                                            this.pdf.content.push({text: '__________________________________________________________________________________', style: 'body'});
                                            this.pdf.content.push({text: etapaInfo.nombre, style: 'subheader',margin: [ 0, 15, 0, 5 ] });
                                        }
                                      
                                        if (ultimoGrupo === undefined || ultimoGrupo !== datoGuardado.ubicacionAtributo.idGrupo){
                                          ultimoGrupo = datoGuardado.ubicacionAtributo.idGrupo
                                          if (grupoInfo.nombre)
                                            this.pdf.content.push({text: grupoInfo.nombre, style: 'subsubheader',margin: [ 0, 10, 0, 5 ] });
                                        }
                                        
                                        if (datoCondicional && datoCondicional.nombre)
                                          this.pdf.content.push({text: datoCondicional.nombre + ": " + valueString,style: 'body' });
                                        else
                                          if (valueString)
                                            this.pdf.content.push({text: valueString,style: 'body' });
                                        
                                        if (j == datoGuardado.valoresAtributo.length - 1)
                                          this.pdf.content.push({text: '\n',style: 'body' });
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
              const pdf = pdfMake.createPdf(this.pdf);
              return pdf;                    
            }

          }   
        }
    }
  }
}