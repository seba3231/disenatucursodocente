export interface Esquema{
    etapas:Etapa[];
    version:number;
    institucion:string;
    gruposDatosFijos:GrupoDatoFijo[];
    contenidoCondicional:ContenidoCondicional[];
}

interface ContenidoCondicional{
    id:number;
    herencia:number;
    muestroSi:DependenciaDeDatos;
    filaDatos:FilaDatos[];
}

interface Etapa {
    id:number;
    nombre:string;
    grupos:Grupo[];
}

interface GrupoDatoFijo{
    id:number;
    nombre:string;
    opciones:OpcionSelect[];
}

interface OpcionSelect{
    id:number;
    idGrupo:number;
    valor:string;
    muestroSi:DependenciaDeDatos;
}

interface Grupo{
    id:number;
    nombre:string;
    ubicacion:Ubicacion;
    relacionesGrafo:Ubicacion[];
    atributos:Atributo[];
}

interface Ubicacion{
    idEtapa:number;
    idGrupo:number;
    idAtributo:number;
    idDato:number[];
}

interface Atributo{
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

interface ComentarioPrivado{
    autor:string;
    fecha:Date;
    valor:string;
}

interface Dato{
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

interface Opciones{
    //Las opciones referencian a un conjunto de Datos de usuario (referencia)
    //O las opciones son un GrupoDatoFijo (idGrupoDatoFijo)
    referencia:Ubicacion;
    idGrupoDatoFijo:number;
}

interface DependenciaDeDatos{
    referencia:Ubicacion;
    valorSeleccionado:{
        idGrupoDatoFijo:number;
        idOpcion:number;
    }
}

interface FilaDatos{
    datos:Dato[]
}

interface PuntoCritico{
    normativa:string;
    informacionAmpliatoria:string;
    aporteConceptual:string;
}
