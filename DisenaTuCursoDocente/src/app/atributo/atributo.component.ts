import { Component, EventEmitter, Input } from '@angular/core';
import { Atributo, Dato, DependenciaDeDatos, Ubicacion } from '../modelos/schema.model';
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
    
    mapOpcionesSelect : Map<string,any> = new Map();
    mapOpcionSeleccionada : Map<string,number> = new Map();

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
                            let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
                            let retrievedValue = this.mapOpcionesSelect.get(JSON.stringify(ubicacionAbsoluta));
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
                                    JSON.stringify(ubicacionAbsoluta),
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

    addLinkHTML(string: string){
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return string.replace(urlRegex, function(url) {
            return '<a href="javascript:void">' + url + '</a>';
        })
    }
    
    obtenerOpciones(dato:Dato){
        
        let ubicacionAbsoluta = this.computoUbicacionAbsoluta(dato.ubicacion,dato.id);
        let opciones = this.mapOpcionesSelect.get(JSON.stringify(ubicacionAbsoluta));
        if(opciones !== null){
            return opciones;
        }
        console.log("No se enecontro array de opciones");
        return [];
    }

    muestroOpcion(muestroSi:DependenciaDeDatos){
        if(muestroSi){
            let clave = JSON.stringify(muestroSi.referencia);
            let opcionSeleccionada = this.mapOpcionSeleccionada.get(clave);
            if(opcionSeleccionada !== undefined){

                return opcionSeleccionada === muestroSi.valorSeleccionado.idOpcion
            }
        }
        return true;
    }

    cambioSelect(event:any,ubicacion:Ubicacion,multiInstanciable:boolean,indice:number){
        if(!multiInstanciable){
            let clave = JSON.stringify(ubicacion);
            let valor = event.selectedIndex;
            this.mapOpcionSeleccionada.set(
                clave,
                valor
            );
        }
        else{
            //TODO: escribir variable de datos guardados
        }
    }

    a(ubicacion:Ubicacion,id:number){
        console.log(ubicacion,id);
        //console.log("opa");
    }

    cargarInfoPrevia(ubicacion:Ubicacion, indice:number, tipoInput: TipoInput,multiInstanciable:boolean){
        if(this.valoresAtributo){
            for(let valoresDato of this.valoresAtributo){

                if(valoresDato.idDato.length === ubicacion.idDato.length && valoresDato.idDato.every(function(value, index) { return value === ubicacion.idDato[index]})){
                    switch (tipoInput) {
                        case TipoInput.text:
                            return valoresDato.valoresDato[indice].string;
                        case TipoInput.number:
                            return valoresDato.valoresDato[indice].number;
                        case TipoInput.selectFijoUnico:
                                                 
                            let indiceRetorno=0;

                            if(multiInstanciable){
                                if(valoresDato.valoresDato[indice].selectFijo){
                                    indiceRetorno = valoresDato.valoresDato[indice].selectFijo![0].idOpcion;
                                }
                            }
                            else{
                                let key = JSON.stringify({
                                    idEtapa:this.atributo.ubicacion.idEtapa,
                                    idGrupo:this.atributo.ubicacion.idGrupo,
                                    idAtributo:this.atributo.id,
                                    idDato:ubicacion.idDato
                                });
                                let value = this.mapOpcionSeleccionada.get(key);
                                //Checkeo que solo se compute una vez este codigo
                                if(!value){
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

                        default:
                            return "null";
                    }
                }
            }
        }
        return "";
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
