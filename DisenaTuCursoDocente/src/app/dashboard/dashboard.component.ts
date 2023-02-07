import { Component, OnInit, HostListener } from '@angular/core';
import { Etapa, Grupo,Esquema } from '../modelos/schema.model';
import { SchemaSavedData, Version } from '../modelos/schemaData.model';
import { InitialSchemaLoaderService } from '../servicios/initial-schema-loader.service';
import { AccionesCursosService } from '../servicios/acciones-cursos.service';
import {ExportpdfComponent} from   '../exportpdf/exportpdf.component'
import { Router } from '@angular/router';
import { ModalComentariosComponent } from '../modal/comentarios/modal-comentarios.component';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Interaccion_Schema_Data } from '../servicios/interaccion-schema-data.service';
imports: [
  NgbModule
]

declare function createGraph(graph : any): any;

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
    title = 'DisenaTuCursoDocente';
    gruposDeEtapa : Grupo[] | undefined = undefined;
    grupoCargado : Grupo | undefined = undefined;
    mostrarUIVersiones: boolean = false;

    savedDataCurso : SchemaSavedData = this.initialSchemaService.loadedData!;
    versionSeleccionada: Version = this.savedDataCurso.versiones.at(-1)!;

    constructor(public initialSchemaService : InitialSchemaLoaderService,
        private router: Router,
        private modalService: NgbModal,
        public accionesCursosService: AccionesCursosService,
        public interaccionSchemaConData: Interaccion_Schema_Data
    ){ }


    ngOnInit() {

        const palette = ["#c0392b","#2980b9","#27ae60","#708284"] //rojo, azul, verde, gris
        setTimeout(()=>{
            // tiene que estar en el timeout sino da undefined
            var schemaEtapas = this.initialSchemaService.defaultSchema?.etapas;

            let graph: any = {nodes:[],links:[]};

            if (schemaEtapas)
                for (var i=0; i < schemaEtapas.length; i++) {
                    //recorrida de etapas -> nodos principales (grado 1)
                    let node: any = {id:'',name:''};
                    node.id = schemaEtapas[i].id;
                    node.name = schemaEtapas[i].nombre;
                    node.grado = 1
                    node.Descripcion = schemaEtapas[i].descripcion
                    node.color = palette[i]

                    node.childrens = []
                    node.childrenLinks = []
                    if (schemaEtapas[i].grupos)
                        for (var j=0; j < schemaEtapas[i].grupos.length; j++) {
                            //recorrida de grupos -> nodos secundarios (grado 2)
                            var grupoNodo = schemaEtapas[i].grupos[j]
                            let childrenNode: any = {id:'',name:''};
                            childrenNode.id = grupoNodo.id
                            childrenNode.name = grupoNodo.nombre
                            childrenNode.color = node.color
                            childrenNode.grado = 2
                            childrenNode.parent = []
                            if (grupoNodo.relacionesGrafo)
                                childrenNode.parent = grupoNodo.relacionesGrafo
                            childrenNode.parent.push(node.id)
                            node.childrens.push(childrenNode)

                            //por cada hijo hago un link al padre
                            let childrenLink: any = {source:'',target:''};
                            childrenLink.source = node.id
                            childrenLink.target = grupoNodo.id
                            childrenLink.grado = 2
                            node.childrenLinks.push(childrenLink)
                        }
                    
                    // agrego link con el resto de los de grado 1
                    for (var j=0; j < graph.nodes.length; j++) {
                        let link: any = {source:'',target:''};
                        link.source = node.id
                        link.target = graph.nodes[j].id
                        link.grado = 1

                        graph.links.push(link)
                    }    

                    graph.nodes.push(node)

                }
                createGraph(graph); // function en script.js
          }, 0);
        
    }

    @HostListener('window:grupoOnClick', ['$event.detail.grupoId'])
    grupoOnClick(grupoId:number){
        var schemaEtapas = this.initialSchemaService.defaultSchema?.etapas;
        var grupoSeleccionado;
        if (schemaEtapas)
            for (var i=0; i < schemaEtapas.length; i++) {
                if (schemaEtapas[i].grupos)
                    for (var j=0; j < schemaEtapas[i].grupos.length; j++) {
                        if (schemaEtapas[i].grupos[j].id == grupoId)
                            grupoSeleccionado = schemaEtapas[i].grupos[j]
                    }
            }
        this.grupoCargado = grupoSeleccionado; 
        this.mostrarUIVersiones = false
    }
    
    mostrarGruposDeEtapa(etapa: Etapa){
        console.log(etapa.grupos)
        this.gruposDeEtapa = etapa.grupos;
        this.mostrarUIVersiones = false
    }

    cargarGrupo(grupo:Grupo){
        console.log(grupo)
        this.grupoCargado = grupo;
        this.mostrarUIVersiones = false
    }

    openModal(opcion: string){
        if (opcion == 'nuevo'){
            // MODAL PARA CREAR NUEVA VERSION
            const modalRef = this.modalService.open(ModalComentariosComponent, {
                scrollable: false,
            });
            modalRef.componentInstance.tittle = 'Nueva version';
            modalRef.componentInstance.body = "Se creará una nueva versión del curso a partir de la version actual."
            modalRef.componentInstance.inputDisclaimer[0] = 'Nombre de la nueva versión';
            
            //Control Resolve with Observable
            modalRef.closed.subscribe({
                next: (resp) => {
                    if (resp.length > 0){
                        this.nuevaVersion(resp[0])
                    }
                },
                error: () => {
                    //Nunca se llama aca
                },
            });
        }else{
            if (opcion == 'eliminar'){
                // MODAL PARA CREAR NUEVA VERSION
                const modalRef = this.modalService.open(ModalComentariosComponent, {
                    scrollable: false,
                });
                modalRef.componentInstance.tittle = 'Eliminar curso';
                modalRef.componentInstance.body = "¿Confirma que desea eliminar éste curso?"
                
                //Control Resolve with Observable
                modalRef.closed.subscribe({
                    next: (resp) => {
                        console.log("eliminar curso")
                        this.accionesCursosService.eliminarCurso()

                    },
                    error: () => {
                        //Nunca se llama aca
                    },
                });
            }
        }
        
    }

    descargarArchivo(){
        let a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.initialSchemaService.loadedData, null, 4)));
        a.setAttribute('download', "file.json");
        a.click();
    }

    public descargarCurso(event: any):void{
        event.stopPropagation();
        let a = document.createElement('a');
        a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.initialSchemaService.loadedData, null, 4)));
        a.setAttribute('download', this.initialSchemaService.loadedData?.nombreCurso + ".json");
        a.click();
        
    }

    public descargarPDF(event: any):void{
        event.stopPropagation();
        const exportPdf = new ExportpdfComponent(this.initialSchemaService,this.interaccionSchemaConData);
        var pdf;
        if(this.versionSeleccionada){
            //pdf = exportPdf.generatePdf(this.initialSchemaService.loadedData?.id!);
            pdf = exportPdf.newGeneratePdf(this.savedDataCurso,this.versionSeleccionada);
            pdf.open();
        }
    }

    goHome(){
        this.initialSchemaService.loadedData = undefined
        this.router.navigate(['/']);
    }

    invertirMostrarVersiones(){
        this.mostrarUIVersiones = !this.mostrarUIVersiones;
    }

    nuevaVersion(nombreVersion:string){
        const curso = this.initialSchemaService.loadedData;
        let nuevaVersion = structuredClone(curso?.versiones.find(v => v.version === this.versionSeleccionada!.version));
        const ultimaVersion = curso?.versiones.at(-1)?.version;
        nuevaVersion!.version = ultimaVersion!+1;
        let fechaMod = new Date();
        nuevaVersion!.fechaCreacion = fechaMod;
        nuevaVersion!.fechaModificacion = fechaMod;
        nuevaVersion!.nombre = nombreVersion;
        curso?.versiones.push(nuevaVersion!);
        this.versionSeleccionada = nuevaVersion!;
        this.accionesCursosService.modificarCurso();
    }

    seleccionarVersion(version: number, e:any){
        const curso = this.initialSchemaService.loadedData;
        this.versionSeleccionada = curso?.versiones.find(v => v.version === version)!;
    }
}
