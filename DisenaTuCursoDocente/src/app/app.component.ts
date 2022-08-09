import { Component } from '@angular/core';
import { InitialSchemaLoaderService } from './servicios/initial-schema-loader.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'DisenaTuCursoDocente';
    constructor(public initialSchemaService : InitialSchemaLoaderService){ }
}
