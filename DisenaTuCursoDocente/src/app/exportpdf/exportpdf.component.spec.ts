import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportpdfComponent } from './exportpdf.component';

describe('ExportpdfComponent', () => {
  let component: ExportpdfComponent;
  let fixture: ComponentFixture<ExportpdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportpdfComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportpdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
