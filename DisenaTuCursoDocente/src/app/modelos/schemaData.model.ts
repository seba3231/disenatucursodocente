import { Ubicacion } from './schema.model';

export interface SchemaSavedData {
  id: number;
  idGlobal: number | null;
  nombreCurso: string;
  institucion?: string;
  versiones: Version[];
  archivos: Archivo[];
}

export interface Archivo {
    id:number;
    b64: string;
}

export interface Version {
  schemaVersion: number;
  autor?: string;
  nombre: string;
  version: number;
  fechaCreacion: Date;
  fechaModificacion: Date;
  datosGuardados?: InformacionGuardada[];
}

export interface InformacionGuardada {
  ubicacionAtributo: Ubicacion;
  cantidadInstancias: number;
  comentariosPrivados:ComentarioPrivado[];
  valoresAtributo: ValoresAtributo[];
}

export interface ValoresAtributo {
  idDato: number[];
  valoresDato: ValoresDato[];
}

export interface ValoresDato {
  string: string | null;
  number: number | null;
  selectFijo:number[] | null, //Colección de IdOpcion
  selectUsuario:number[] | null, //Indice de instancias del Dato de Usuario
  archivo:DatoArchivo | null,
  date: Date | null;
}

export interface DatoArchivo{
    texto:string | null;
    fileName:string | null;
    fileId:number | null;
    ruta:string | null;
}

export interface ComentarioPrivado{
    autor:string| undefined;
    fecha:number | null;
    valor:string| null;
}
