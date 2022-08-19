import { Component, OnInit, Input } from '@angular/core';
import { Grupo } from '../modelos/schema.model';
import { SchemaSavedData } from '../modelos/schemaData.model';

@Component({
  selector: 'app-grupo',
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css'],
})
export class GrupoComponent implements OnInit {
  @Input() grupo!: Grupo;
  //@Input() savedData!: SchemaSavedData;

  constructor() {}

  ngOnInit(): void {}
}
