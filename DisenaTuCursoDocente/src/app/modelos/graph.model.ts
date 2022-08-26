
export interface Graph{
    nodes: Nodes[]
    links: Links[]
}

export interface Nodes{
    id:number;
    nombre:string;
}

export interface Links{
    id:number;
    nombre:string;
}