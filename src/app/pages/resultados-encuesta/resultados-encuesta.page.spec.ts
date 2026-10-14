import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResultadosEncuestaPage } from './resultados-encuesta.page';

describe('ResultadosEncuestaPage', () => {
  let component: ResultadosEncuestaPage;
  let fixture: ComponentFixture<ResultadosEncuestaPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ResultadosEncuestaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
