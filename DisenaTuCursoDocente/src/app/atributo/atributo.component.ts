import { Component, OnInit, Input } from '@angular/core';
import { Atributo } from '../modelos/schema.model';
import { DatosFijosService } from '../datos-fijos.service';

@Component({
  selector: 'app-atributo',
  templateUrl: './atributo.component.html',
  styleUrls: ['./atributo.component.css'],
})
export class AtributoComponent implements OnInit {
  @Input() atributo!: Atributo;
  veces: number[];

  constructor(private datosFijos: DatosFijosService) {
    this.veces = [1];
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

  ngOnInit(): void {}
}
