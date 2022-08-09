export interface Esquema{
    etapas:Etapa[];
    version:number;
    institucion:string;
    datosFijos:DatoFijo[];
}

interface Etapa {
    id:number;
    nombre:string;
    grupos:Grupo[];
}

interface DatoFijo{
    id:number;
    valor:string;
    padres:number[];
}

interface Grupo{
    id:number;
    nombre:string;
    idEtapa:number;
    relaciones:number[];
    atributos:Atributo[];
}

interface Atributo{
    id:number;
    nombre:string;
    multiInstanciable:boolean;
    puntoCritico:PuntoCritico;
    comentarioPrivado:ComentarioPrivado[];
    ayuda:string;
    tipo:string;
        //'simple'
        //'compuesto'
    obligatorio:boolean;
    datos:Dato[];
}

interface ComentarioPrivado{
    autor:string;
    fecha:Date;
    valor:string;
}

interface Dato{
    id:number;
    nombre:string;
    ayuda:string;
    tipo:string;
        //'selectFijoUnico'
        //'selectFijoMultiple'
        //'selectUsuarioUnico'
        //'selectUsuarioMultiple'
    filaDatos:FilasDato[];
    idAtributo:number;
    idSelect:Opciones[];
    tamaño:number;
    dependencia:Dependencia;
}

interface Opciones{
    idReferencia:number;
    idValor:number;
}

interface Dependencia{
    idDato:number;
    valorDato:string;
}

interface FilasDato{
    datos:Dato[]
}

interface PuntoCritico{
    normativa:string;
    informacionAmpliatoria:string;
    aporteConceptual:string;
}
