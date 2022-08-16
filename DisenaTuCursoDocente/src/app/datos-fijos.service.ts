import { Injectable } from '@angular/core';
import { GrupoDatoFijo } from './modelos/schema.model';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';

@Injectable({
  providedIn: 'root',
})
export class DatosFijosService {
  datosFijos: GrupoDatoFijo[] | undefined = [];

  constructor(public initialSchemaService: InitialSchemaLoaderService) {
    this.datosFijos = initialSchemaService.defaultSchema?.gruposDatosFijos;
  }

  getDatosFijos() {
    return this.datosFijos;
  }
}
