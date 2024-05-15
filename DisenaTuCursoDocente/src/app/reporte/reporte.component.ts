import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
imports: [
  NgbModule
]
const pdfMakeX = require('pdfmake/build/pdfmake.js');
const pdfFontsX = require('pdfmake-unicode/dist/pdfmake-unicode.js');
pdfMakeX.vfs = pdfFontsX.pdfMake.vfs;
import { __values } from 'tslib';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';
import { GrupoDatoFijo } from '../modelos/schema.model';
import { InformacionGuardada, SchemaSavedData, Version } from '../modelos/schemaData.model';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';


@Component({
    selector: 'app-reporte',
    templateUrl: './reporte.component.html',
    styleUrls: ['./reporte.component.css'],
})
export class ReporteComponent {
    pdf: any;
    title = 'DisenaTuCursoDocente';
    token:string='';
    urlServidor:string='';
    titulo:string='';
    descripcion:string='';
    categoria:string='';

    constructor(private modalService: NgbModal, private router: Router,
      public initialSchemaService : InitialSchemaLoaderService,
      private route: ActivatedRoute) {}

    ngOnInit(): void {
      // Recuperar los parámetros de la URL
      this.route.queryParams.subscribe(params => {
        this.token = params['token'];
        this.urlServidor = params['servidor'];
        console.log('Token:', this.token);
        console.log('urlServidor:', this.urlServidor);
      });
      //remuevo el mensaje de error que se carga por defecto, se muestra poniendole la clase .show
      const alert = document.querySelector('ngb-alert')
      if(alert)
        alert.classList.remove('show')
    }

    async enviarReporte(event: Event): Promise<void> {
      event.preventDefault(); // Evita que el formulario se envíe automáticamente

      // Aquí puedes acceder a los valores de los campos
      console.log("Título:", this.titulo);
      console.log("Descripción:", this.descripcion);
      console.log("Categoría:", this.categoria);
      console.log("token:", this.token);
      // Puedes hacer más aquí, como enviar los datos a través de un servicio

    const requestBody = { titulo: this.titulo, descripcion: this.descripcion, categoria: this.categoria};
    const apiUrl = this.urlServidor + '/api/nuevaIncidencia';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.token
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        // Si la solicitud fue exitosa, extraer el token de la respuesta
        const responseData = await response.json();
        console.log('Incidencia ', responseData);
      } else {
        // Si la solicitud no fue exitosa, mostrar un mensaje de error
        console.log('Ha ocurrido un error:', response.status);
        console.log('Ha ocurrido un error:', requestBody);
        alert("Error al crear la incidencia. Espere unos minutos y vuelva a intentar.");
      }
    } catch (error) {
      // Manejar errores de la solicitud
      console.error('Error al crear la incidencia. Espere unos minutos y vuelva a intentar.', error);
      alert("Error al crear la incidencia. Espere unos minutos y vuelva a intentar.");
    }
    }

    goHome(){
      this.initialSchemaService.loadedData = undefined
      this.router.navigate(['/']);
  }

}
