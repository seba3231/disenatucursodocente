export interface Esquema{
    etapas:Etapa[];
    version:number;
    institucion:string;
    autor: string;
    gruposDatosFijos:GrupoDatoFijo[];
    contenidoCondicional:ContenidoCondicional[];
    constantes:Constante[];
}

export interface Constante{
    id:number;
    valor:number;
    descripcion:string;
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
    descripcion:string;
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
    autor:string| undefined;
    fecha:number | null;
    valor:string| null;
}

export interface Dato{
    id:number;
    nombre:string;
    ubicacion:Ubicacion;
    herencia:Ubicacion;
    ayuda:string;
    tipo:string;
    computo:Computo;
    opciones:Opciones;
    habilitadoSi:DependenciaDeDatos;
    multiInstanciable:boolean;
    idContenidoCondicional:number[];
    tamanio:number;
    filasDatos:FilaDatos[];
}

export interface Computo{
    //operacion puede ser: '+','-','*','/'
    //la operacion a realizar es op1 {operacion} op2
    operacion:string;
    //Si Ubicacion es multiInstanciable, se suman los valores
    //de todas sus instancias previo a realizar la operacion
    op1:number | Ubicacion;
    //number indica ID de Constante
    op2:number | Ubicacion;
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
