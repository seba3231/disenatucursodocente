import { Ubicacion } from "./schema.model";

export interface SchemaSavedData{
    id:number;
    schemaVersion:number;
    intitucion?:string;
    nombreCurso:string;
    version:number;
    fechaCreacion:Date;
    fechaModificacion:Date;
    datosGuardados?:DatoGuardado[];
}

export interface DatoGuardado{
    ubicacionAtributo:Ubicacion;
    cantidadInstancias:number;
    valoresAtributo:ValoresAtributo[]
}

export interface ValoresAtributo{
    idDato:[number];
    valoresDato:ValoresDato[];
}

export interface ValoresDato{
    string:string | null;
    number:number | null;
    selectFijo:[
        {
            idGrupo:number;
            idOpcion:number;
        }
    ] | null,
    selectUsuario:[
        {
            ubicacion:Ubicacion;
        }
    ] | null,
    archivo:{
        nombre:string;
        ruta:string;
    } | null,
    date:Date | null;
}