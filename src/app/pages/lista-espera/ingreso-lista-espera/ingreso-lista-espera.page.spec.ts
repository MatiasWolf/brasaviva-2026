import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngresoListaEsperaPage } from './ingreso-lista-espera.page';

describe('IngresoListaEsperaPage', () => {
  let component: IngresoListaEsperaPage;
  let fixture: ComponentFixture<IngresoListaEsperaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IngresoListaEsperaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
