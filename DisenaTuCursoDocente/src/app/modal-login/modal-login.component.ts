import { Component, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';


@Component({
  selector: 'app-modal-login',
  templateUrl: './modal-login.component.html',
  styleUrls: ['./modal-login.component.css'],
})
export class ModalLoginComponent implements OnInit {
  @Input() tittle: string = '';
  @Input() body: string = '';
  @Input() inputDisclaimer: string[] = [];
  @Output() salida: string[] = [];
  //@Input() resolveFunction: ((args: any) => void) | undefined;
  servers: string[] = [];

  constructor(private modalService: NgbModal, public activeModal: NgbActiveModal, private router: Router,
    public initialSchemaService: InitialSchemaLoaderService) { }

  togglePassword() {
    const pwdInput = document.querySelector('.pwd') as HTMLInputElement;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
    } else {
      pwdInput.type = 'password';
    }
  }

  async ngOnInit(): Promise<void> {
    let headers = new Headers();
    headers.append('Accept', 'application/json');

    try {
      const response = await fetch('http://localhost:' + this.initialSchemaService.puertoBackend + '/servers', {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      });
      this.servers = await response.json();
      if (response.status === 200)
        console.log('Servidores obtenidos exitosamente', this.servers);
      else console.log('Ha ocurrido un error, ', response.status);
    } catch (e) {
      const alert = document.querySelector('ngb-alert');
      if (alert)
        alert.classList.add('show');
      console.error(e);
    }
  }

  async resolve(): Promise<void> {

    const userValue = (document.querySelector("#user") as HTMLInputElement)?.value;
    const passwordValue = (document.querySelector("#password") as HTMLInputElement)?.value;
    const urlServidorValue = (document.querySelector("#urlServidor") as HTMLInputElement)?.value;


    if (!userValue || !passwordValue || !urlServidorValue) {
      // Mostrar mensaje de error si algún campo está vacío
      alert("Por favor, complete todos los campos.");
      return;
    } else {
      this.salida.push(userValue)
      this.salida.push(passwordValue)
      this.salida.push(urlServidorValue)
    }


    // Verificar si la URL del servidor está presente en this.servers
    if (!this.servers.includes(urlServidorValue)) {
      // Agregar la URL del servidor a this.servers si no está presente
      this.servers.push(urlServidorValue);

      //la actualizo en el archivo de servers
      let headers = new Headers();
      headers.append('Accept', 'application/json');
      headers.append('Content-Type', 'application/json');
      headers.append('Access-Control-Allow-Origin', '*');
      try {
        // no hay convencion sobre los nombres aun asi que paso id para que busque archivo curso_id
        const response = await fetch(urlServidorValue + `/api/login`, {
          method: 'POST',
          mode: 'no-cors',
          headers: headers,
          body: JSON.stringify({
            username: userValue,
            password: passwordValue
          }),
        });
        if (response.status === 200) {
          console.log('Login exitoso');
          console.log(response)
          this.activeModal.close(this.salida);
        } else {
          console.log('Ha ocurrido un error, ', response);
          alert("Error al iniciar sesión")
        }
      } catch (e) {
        console.error(e);
      }
    }

    // login
    // Realizar la solicitud de inicio de sesión al backend
  const requestBody = { username: userValue, password: passwordValue };
  const apiUrl = urlServidorValue + '/api/login';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      // Si la solicitud fue exitosa, extraer el token de la respuesta
      const responseData = await response.json();
      const token = responseData.token;
      console.log('Login exitoso',token);

      this.activeModal.close([userValue, passwordValue, urlServidorValue]);
    } else {
      // Si la solicitud no fue exitosa, mostrar un mensaje de error
      console.log('Ha ocurrido un error:', response.status);
      alert("Error al iniciar sesión.");
    }
  } catch (error) {
    // Manejar errores de la solicitud
    console.error('Error al realizar la solicitud:', error);
    alert("Error al iniciar sesión.");
  }
  }

  cargarServidorEnInput(servidor: string): void {
    // Asignar el valor del servidor al input urlServidor
    const inputServidor = document.querySelector("#urlServidor") as HTMLInputElement;
    if (inputServidor) {
      inputServidor.value = servidor;
    }
  }

  olvidoContrasenia(): void {
    const userValue = (document.querySelector("#user") as HTMLInputElement)?.value;
    const urlServidorValue = (document.querySelector("#urlServidor") as HTMLInputElement)?.value;

    if (!userValue || !urlServidorValue) {
      // Mostrar mensaje de error si algún campo está vacío
      alert("Por favor, ingrese su usuario y la URL del servidor.");
      return;
    }

    // Continuar con el proceso de recuperación de contraseña...
  }


  reject() {
    this.activeModal.dismiss('Cancelar');
  }

}
