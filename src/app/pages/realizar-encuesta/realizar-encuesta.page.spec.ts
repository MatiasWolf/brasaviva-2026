import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RealizarEncuestaPage } from './realizar-encuesta.page';
import { EncuestaService } from '../../core/services/encuesta.service';

describe('RealizarEncuestaPage', () => {
  let component: RealizarEncuestaPage;
  let fixture: ComponentFixture<RealizarEncuestaPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'home', children: [] },
          { path: 'resultados-encuesta', children: [] },
        ]),
        {
          provide: EncuestaService,
          useValue: {
            verificarEncuestaRespondida: async () => false,
            responder: async () => undefined,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(RealizarEncuestaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('al enviar la encuesta muestra los resultados', async () => {
    const router = TestBed.inject(Router);
    const rutas: any[] = [];
    router.navigate = (async (comandos: any[]) => {
      rutas.push(comandos);
      return true;
    }) as any;

    (component as any).ocupacionId = 1;
    component.setRatingAtencion(4);
    component.encuestaForm.setValue({
      puntaje_comida: 5,
      tiempo_espera: 'rapido',
      recomienda: true,
      aspecto_destacado: 'comida',
      comentario: '',
    });

    await component.enviarEncuesta();

    expect(rutas.at(-1)).toEqual(['/resultados-encuesta']);
  });
});
