import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultadosEncuestaPage } from './resultados-encuesta.page';

describe('ResultadosEncuestaPage', () => {
  let component: ResultadosEncuestaPage;
  let fixture: ComponentFixture<ResultadosEncuestaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultadosEncuestaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
