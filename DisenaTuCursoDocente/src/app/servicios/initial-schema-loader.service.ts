import { Injectable } from '@angular/core';
import { Esquema } from 'src/app/modelos/schema.model';
import { SchemaSavedData } from '../modelos/schemaData.model';

@Injectable({
  providedIn: 'root',
})
export class InitialSchemaLoaderService {
  defaultSchema?: Esquema;
  loadedData?: SchemaSavedData = undefined;
  allData?: SchemaSavedData[] = undefined;
  constructor() {}

  loadInitialSchema() {
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

  // loadDataFile(fileName: string) {
  //   //Leo información de archivo
  //   const xmlhttp = new XMLHttpRequest();
  //   const method = 'GET';
  //   const url = 'assets/schemasData/' + fileName;
  //   xmlhttp.open(method, url, true);
  //   xmlhttp.onload = () => {
  //     if (xmlhttp.status === 200) {
  //       this.loadedData = JSON.parse(xmlhttp.responseText);
  //       console.log(this.loadedData);
  //     }
  //   };
  //   xmlhttp.send();
  // }

  loadAllDataFile(fileName: string) {
    //Leo información de archivo
    const xmlhttp = new XMLHttpRequest();
    const method = 'GET';
    const url = 'assets/schemasData/' + fileName;
    xmlhttp.open(method, url, true);
    xmlhttp.onload = () => {
      if (xmlhttp.status === 200) {
        this.allData = JSON.parse(xmlhttp.responseText);
        console.log(this.allData);
      }
    };
    xmlhttp.send();
  }

  async loadAllDataFile2() {
    let headers = new Headers();
    headers.append('Accept', 'application/json');

    try {
      //levantar electron: cmd: node ElectronEntry.js
      const response = await fetch('http://localhost:8081/cursos', {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      });
      const cursos = await response.json();
      if (response.status === 200){
        if (cursos.length > 0)
          this.allData = cursos;
        else
          this.allData = undefined;
      }
        
    
      else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      const alert = document.querySelector('ngb-alert')
      if(alert)
        alert.classList.add('show')
      console.error(e);
    }
  }
}
