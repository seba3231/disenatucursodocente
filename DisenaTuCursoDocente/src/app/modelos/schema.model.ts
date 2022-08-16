//TODO en InstanciacionEsquima.ts
//quedé en 2,5,1
//agregar "multiInstanciable" a Dato
//agregar "idContenidoCondicional" a Dato
//cambiar Ubicacion.idDato a []
//agregar "herencia" a Dato
export interface Esquema{
    etapas:Etapa[];
    version:number;
    institucion:string;
    gruposDatosFijos:GrupoDatoFijo[];
    contenidoCondicional:ContenidoCondicional[];
}

export interface ContenidoCondicional{
    id:number;
    herencia:number;
    muestroSi:DependenciaDeDatos;
    filaDatos:FilaDatos[];
}

export interface Etapa {
    id:number;
    nombre:string;
    grupos:Grupo[];
}

export interface GrupoDatoFijo{
    id:number;
    nombre:string;
    opciones:OpcionSelect[];
}

export interface OpcionSelect{
    id:number;
    idGrupo:number;
    valor:string;
    muestroSi:DependenciaDeDatos;
}

export interface Grupo{
    id:number;
    nombre:string;
    ubicacion:Ubicacion;
    relacionesGrafo:Ubicacion[];
    atributos:Atributo[];
}

export interface Ubicacion{
    idEtapa:number;
    idGrupo:number;
    idAtributo:number;
    idDato:number[];
}

export interface Atributo{
    id:number;
    nombre:string;
    ubicacion:Ubicacion;
    herencia:Ubicacion;
    multiInstanciable:boolean;
    puntoCritico:PuntoCritico;
    comentariosPrivados:ComentarioPrivado[];
    ayuda:string;
    obligatorio:boolean;
    filasDatos:FilaDatos[];
}

export interface ComentarioPrivado{
    autor:string;
    fecha:Date;
    valor:string;
}

export interface Dato{
    id:number;
    nombre:string;
    ubicacion:Ubicacion;
    herencia:Ubicacion;
    ayuda:string;
    tipo:string;
        //'selectFijoUnico'
        //'selectFijoMultiple'
        //'selectUsuarioUnico'
        //'selectUsuarioMultiple'
    opciones:Opciones;
    habilitadoSi:DependenciaDeDatos;
    multiInstanciable:boolean;
    idContenidoCondicional:number[];
    tamaño:number;
    filasDatos:FilaDatos[];
}

export interface Opciones{
    //Las opciones referencian a un conjunto de Datos de usuario (referencia)
    //O las opciones son un GrupoDatoFijo (idGrupoDatoFijo)
    referencia:Ubicacion;
    idGrupoDatoFijo:number;
}

export interface DependenciaDeDatos{
    referencia:Ubicacion;
    valorSeleccionado:{
        idGrupoDatoFijo:number;
        idOpcion:number;
    }
}

export interface FilaDatos{
    datos:Dato[]
}

export interface PuntoCritico{
    normativa:string;
    informacionAmpliatoria:string;
    aporteConceptual:string;
}
