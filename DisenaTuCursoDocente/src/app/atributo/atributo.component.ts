import { Component, OnInit, Input } from '@angular/core';
import { Atributo } from '../modelos/schema.model';
import { DatosFijosService } from '../datos-fijos.service';
//import { MapTipoInput, TipoInput } from '../enumerados/enums';

@Component({
  selector: 'app-atributo',
  templateUrl: './atributo.component.html',
  styleUrls: ['./atributo.component.css'],
})
export class AtributoComponent implements OnInit {
  @Input() atributo!: Atributo;
  //mapTipoInput : Map<TipoInput, string>;
  veces: number[];

    constructor(private datosFijos: DatosFijosService) {
        this.veces = [1];
        //this.mapTipoInput = MapTipoInput;
    }

  agregarAtributo() {
    this.veces?.push(1);
  }

  parsearTipo(tipo: string) {
    //0: normal
    //1: select fijo
    //2: radio
    //3: select no fijo
    //poner todos los que hagan diferencia en el rendereo
    switch (tipo) {
      case 'selectFijoUnico':
        return [1, 'unico'];
        break;
      case 'selectFijoMultiple':
        return [1, 'multiple'];
        break;
      case 'radio':
        return [2, null];
      default:
        return [0, null];
        break;
    }
  }

  obtenerOpcionesFijas(idDatoFijo: number) {
    const datosFijos = this.datosFijos.getDatosFijos();
    const datoFijo = datosFijos?.find((datoFijo) => datoFijo.id === idDatoFijo);
    const opciones = datoFijo?.opciones.map((opcion) => opcion.valor);
    return opciones;
  }

    addLinkHTML(string: string){
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return string.replace(urlRegex, function(url) {
            return '<a href="javascript:void">' + url + '</a>';
        })
    }

  ngOnInit(): void {}
}
