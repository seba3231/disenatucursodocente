import { Component, OnInit } from '@angular/core';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { Ubicacion } from '../modelos/schema.model';


const pdfMakeX = require('pdfmake/build/pdfmake.js');
const pdfFontsX = require('pdfmake-unicode/dist/pdfmake-unicode.js');
pdfMakeX.vfs = pdfFontsX.pdfMake.vfs;
import * as pdfMake from 'pdfmake/build/pdfmake';
import { __values } from 'tslib';

@Component({
  selector: 'app-exportpdf',
  templateUrl: './exportpdf.component.html',
  styleUrls: ['./exportpdf.component.css']
})
export class ExportpdfComponent{
  pdf: any;

  constructor(private initialSchemaService : InitialSchemaLoaderService) {
    
}

  ngOnInit(): void {
    
  }

  getDatoInfo(ubicacion: Ubicacion, idDato: number): any{ //retorna un Dato completo
    if (this.initialSchemaService.defaultSchema)
        for(let etapa of this.initialSchemaService.defaultSchema?.etapas){
            for(let grupo of etapa.grupos){
                for(let atributo of grupo.atributos){
                    for(let filaDato of atributo.filasDatos){
                        for(let dato of filaDato.datos){
                           if (dato.id == idDato)
                              if (dato.ubicacion.idEtapa == ubicacion.idEtapa
                                  && dato.ubicacion.idGrupo == ubicacion.idGrupo
                                  && dato.ubicacion.idAtributo == ubicacion.idAtributo){
                                    
                                  return dato;
                              }
                        }
                    }
                }
            }
        }
    // return  undefined;
  }
  getDatoInfoAtributo(ubicacion: Ubicacion): any{ //retorna un Dato completo
    if (this.initialSchemaService.defaultSchema)
        for(let etapa of this.initialSchemaService.defaultSchema?.etapas){
            for(let grupo of etapa.grupos){
                for(let atributo of grupo.atributos){
                    
                    if (atributo.ubicacion.idEtapa == ubicacion.idEtapa
                        && atributo.ubicacion.idGrupo == ubicacion.idGrupo){
                          
                        return grupo;
                    }
                }
            }
        }
    // return  undefined;
  }
  getValueDatoFijo(idGrupoDatoFijo: number, datofijoIn: []): string{
    var grupoDatosFijos = this.initialSchemaService.defaultSchema?.gruposDatosFijos;
    var nombre = '';
    if (grupoDatosFijos)
      for (let grupoDatofijo of grupoDatosFijos){
        if (grupoDatofijo.id == idGrupoDatoFijo)
          for (let datoFijo of grupoDatofijo.opciones){
            for (let id of datofijoIn)
              if (datoFijo.id == id)
                if (nombre==='')
                  nombre = datoFijo.valor
                else
                  nombre = nombre + ', ' + datoFijo.valor
          }
      }

    
    return  nombre;
  }
  
  getValueDatoFijoRef(referencia: any, datofijoIn: [], datosGuardados: any): string{
    var nombre = '';
    
    for (let dato of datosGuardados){
      if (dato.ubicacionAtributo.idEtapa == referencia.idEtapa &&
        dato.ubicacionAtributo.idGrupo == referencia.idGrupo &&
        dato.ubicacionAtributo.idAtributo == referencia.idAtributo){
          for (let valoreAtributo of dato.valoresAtributo){
            for (let atr of  valoreAtributo.idDato){
              if (atr ==dato.ubicacionAtributo.idAtributo){
                for(let datofijo of datofijoIn){
                  if(valoreAtributo.valoresDato[datofijo]){
                    let valorDato = valoreAtributo.valoresDato[datofijo];
                    let valueString;
                    if (valorDato.string){
                        valueString = valorDato.string;
                    }else if(valorDato.number){
                        valueString = valorDato.number.toString() ;
                    }else if(valorDato.date){
                        valueString = valorDato.date.toString();
                    }else if(valorDato.selectFijo){
                      if (dato.opciones.idGrupoDatoFijo)
                        valueString = this.getValueDatoFijo(dato.opciones.idGrupoDatoFijo,valorDato.selectFijo);
                      else{
                        if(dato.opciones.referencia)
                          valueString = this.getValueDatoFijoRef(dato.opciones.referencia,valorDato.selectFijo, datosGuardados);
                      }
                    }else if(valorDato.selectUsuario){
                        valueString = valorDato.selectFijo.toString();
                    }else if(valorDato.archivo){
                      valueString = valorDato.archivo.texto
                    }else{
                        valueString = ''
                    }
                    if (nombre==='')
                      nombre = valueString
                    else
                      nombre = nombre + ', ' + valueString
                  }
                }
              }
            }

          }

      }
    }
    
    return  nombre;
  }
  

  generatePdf(cursoId:number) : any {
    var htmlToPdfmake = require("html-to-pdfmake");
    var pdfMake = require("pdfmake/build/pdfmake");
    var pdfFonts = require("pdfmake/build/vfs_fonts");
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    this.pdf = {
      content: [
      //   {text: 'PdfComponent Example', style: 'header'},
      //   {text: 'This was generated using Angular and PdfMake', style: 'body'},
      //   {text: 'PdfMake', link: 'https://pdfmake.github.io/docs/', style: 'link'}
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true
        },
        subheader: {
          fontSize: 18,
          bold: true
        },
        subsubheader: {
          fontSize: 14,
          bold: true
        },
        body: {
          fontSize: 12
        },
        link: {
          fontSize: 12,
          color: '#03A9F4'
          // margin: [0, 15, 0, 15] 
        }
      }
    };

    var cursos = this.initialSchemaService.allData;
    if (cursos){
        var cursosDatos: any;
        for (var i=0; i < cursos.length; i++) {
          if (cursos[i].id == cursoId){
            // cargo la informacion de los atributos del curso que quiere exportar
            cursosDatos = cursos[i].versiones.at(-1);
            console.log(cursos[i])
            console.log(cursosDatos)
            this.pdf.content.push({text: cursos[i].nombreCurso,style: 'header' });
            this.pdf.content.push({text: "Autor: " + cursosDatos.autor,style: 'body' });
            if (cursosDatos.intitucion)
              this.pdf.content.push({text: "Institución: " + cursosDatos.intitucion,style: 'body' });
            this.pdf.content.push({text: '\n',style: 'body' });
            if (cursosDatos){  
              if (cursosDatos){
                  var valueString = null;
                  var ultimoGrupo;
                  for(let datoGuardado of cursosDatos!.datosGuardados){
                    var cantidadInstancias = datoGuardado.cantidadInstancias;
                    // datoGuardado.
                    var grupoInfo = this.getDatoInfoAtributo(datoGuardado.ubicacionAtributo)
                    
                    for (var cant=0; cant < cantidadInstancias; cant++) {
                      for (var j=0; j < datoGuardado.valoresAtributo.length; j++) { //array 4
                          var columna = datoGuardado.valoresAtributo[j]
                          var idDato = columna.idDato[0]
                          for (var m=0; m < columna.valoresDato.length; m++) {
                            if (m == cant){
                                let valorDato = columna.valoresDato[m]
                                var dato = this.getDatoInfo(datoGuardado.ubicacionAtributo, columna.idDato[0])

                                if (valorDato.string){
                                    valueString = valorDato.string;
                                }else if(valorDato.number){
                                    valueString = valorDato.number.toString() ;
                                }else if(valorDato.date){
                                    valueString = valorDato.date.toString();
                                }else if(valorDato.selectFijo){
                                  if (dato.opciones.idGrupoDatoFijo)
                                    valueString = this.getValueDatoFijo(dato.opciones.idGrupoDatoFijo,valorDato.selectFijo);
                                  else{
                                    console.log(cursosDatos!.datosGuardados)
                                    if(dato.opciones.referencia)
                                      valueString = this.getValueDatoFijoRef(dato.opciones.referencia,valorDato.selectFijo, cursosDatos.datosGuardados);
                                  }
                              

                                }else if(valorDato.selectUsuario){
                                  valueString = this.getValueDatoFijoRef(dato.opciones.referencia,valorDato.selectUsuario, cursosDatos.datosGuardados);
                                  
                                }else if(valorDato.archivo){
                                  valueString = valorDato.archivo.texto
                                }else{
                                    valueString = ''
                                }

                                
                                if (ultimoGrupo === undefined || ultimoGrupo !== datoGuardado.ubicacionAtributo.idGrupo){
                                  ultimoGrupo = datoGuardado.ubicacionAtributo.idGrupo
                                  grupoInfo = this.getDatoInfoAtributo(datoGuardado.ubicacionAtributo)
                                  this.pdf.content.push({text: grupoInfo.nombre, style: 'subsubheader' });
                                }
                                
                                if (dato.nombre)
                                  this.pdf.content.push({text: dato.nombre + ": " + valueString,style: 'body' });
                                else
                                  this.pdf.content.push({text: valueString,style: 'body' });
                                
                                if (j == datoGuardado.valoresAtributo.length - 1)
                                  this.pdf.content.push({text: '\n',style: 'body' });
                            }
                          }
                      }
                      
                    }
                          
                  }
                        
              }
              const pdf = pdfMake.createPdf(this.pdf);
              return pdf;                    
            }

          }   
        }
    }
  }
}