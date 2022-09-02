import { Ubicacion } from "./schema.model";

export interface SchemaSavedData{
    id:number;
    schemaVersion:number;
    intitucion?:string;
    autor?:string;
    nombreCurso:string;
    version:number;
    fechaCreacion:Date;
    fechaModificacion:Date;
    datosGuardados?:InformacionGuardada[];
}

export interface InformacionGuardada{
    ubicacionAtributo:Ubicacion;
    cantidadInstancias:number;
    valoresAtributo:ValoresAtributo[]
}

export interface ValoresAtributo{
    idDato:number[];
    valoresDato:ValoresDato[];
}

export interface ValoresDato{
    string:string | null;
    number:number | null;
    selectFijo:number[] | null, //Colección de IdOpcion
    selectUsuario:number[] | null, //Indice de instancias del Dato de Usuario
    archivo:DatoArchivo | null,
    date:Date | null;
}

export interface DatoArchivo{
    texto:string | null;
    fileName:string | null;
    ruta:string | null;
}

/*export interface InstanciasDeUbicacion{
    ubicacion:Ubicacion;
    indicesInstancias:number[];
}*/
/*export interface ValorSelectFijo{
    idOpcion:number;
}*/