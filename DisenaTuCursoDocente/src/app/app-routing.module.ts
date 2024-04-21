import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { cursosServidorComponent } from './cursosServidor/cursosServidor';
import { HomeComponent } from './home/home.component';
import { ReporteComponent } from './reporte/reporte.component';

const routes: Routes = [
    { path: '',  component:HomeComponent },
    { path: 'dashboard',  component: DashboardComponent },
    { path: 'cursosServidor',  component: cursosServidorComponent },
    { path: 'reporte',  component: ReporteComponent },
    { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
