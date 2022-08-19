import { Ubicacion } from "./schema.model";

export interface SchemaSavedData{
    id:number;
    schemaVersion:number;
    intitucion:string | null;
    nombreCurso:string;
    version:number;
    fechaCreacion:Date;
    fechaModificacion:Date;
    datosGuardados:DatoGuardado[] | null;
}

export interface DatoGuardado{
    ubicacion:Ubicacion;
    valor:{
        string:string;
        number:number;
        selectFijo:[
            {
                idGrupo:number;
                idOpcion:number;
            }
        ],
        selectUsuario:[
            {
                ubicacion:Ubicacion;
            }
        ],
        archivo:{
            nombre:string;
            ruta:string;
        },
        date:Date;
    }
}
