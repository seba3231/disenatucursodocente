import { Ubicacion } from './schema.model';

export interface SchemaSavedData {
  id: number;
  nombreCurso: string;
  intitucion?: string;
  versiones: Version[];
}

export interface Version {
  schemaVersion: number;
  autor?: string;
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
  idDato: [number];
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
    ruta:string | null;
}

export interface ComentarioPrivado{
    autor:string| undefined;
    fecha:number | null;
    valor:string| null;
}