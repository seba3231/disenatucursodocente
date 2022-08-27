import { Injectable } from "@angular/core";
import { Esquema } from "src/app/modelos/schema.model";
import { SchemaSavedData } from "../modelos/schemaData.model";

@Injectable({
    providedIn: 'root',
})
export class InitialSchemaLoaderService {
    
    defaultSchema?:Esquema;
    loadedData?:SchemaSavedData = undefined;
    constructor() { }

    loadInitialSchema(){
        //Leo default Schema
        const xmlhttp = new XMLHttpRequest();
        const method = 'GET';
        const url = 'assets/schemas/defaultSchema.json';
        xmlhttp.open(method, url, true);
        xmlhttp.onload = () => {
            if (xmlhttp.status === 200) {
                let parsedJson = JSON.parse(xmlhttp.responseText);
                this.defaultSchema = parsedJson;
                console.log(this.defaultSchema);
            }
        };
        xmlhttp.send();
    }

    loadDataFile(fileName:string){
        //Leo información de archivo
        const xmlhttp = new XMLHttpRequest();
        const method = 'GET';
        const url = 'assets/schemasData/'+fileName;
        xmlhttp.open(method, url, true);
        xmlhttp.onload = () => {
            if (xmlhttp.status === 200) {
                this.loadedData = JSON.parse(xmlhttp.responseText);
                console.log(this.loadedData);
            }
        };
        xmlhttp.send();
    }
}