import { Component, OnInit, Input } from '@angular/core';
import { Etapa } from '../modelos/schema.model';

@Component({
  selector: 'app-etapa',
  templateUrl: './etapa.component.html',
  styleUrls: ['./etapa.component.css'],
})
export class EtapaComponent implements OnInit {
  @Input() etapa!: Etapa;

  constructor() {}

  ngOnInit(): void {}
}
