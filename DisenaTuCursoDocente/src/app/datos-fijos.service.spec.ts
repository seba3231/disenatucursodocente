import { TestBed } from '@angular/core/testing';

import { DatosFijosService } from './datos-fijos.service';

describe('DatosFijosService', () => {
  let service: DatosFijosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatosFijosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
