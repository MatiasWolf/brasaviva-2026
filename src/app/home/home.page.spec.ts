import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'ingreso-lista-espera', children: [] }])],
    });
    component = TestBed.createComponent(HomePage).componentInstance;
  });

  it('avisa si con el lector de ingreso se escanea otro QR', async () => {
    await component.ejecutar({ clave: 'escanear-qr-ingreso' } as any);

    await component.onQrEscaneado('3f1c2a9e-mesa-1');

    expect(component.mostrandoResultadoQr()).toBe(true);
    expect(component.resultadoQrTipo()).toBe('error');
    expect(component.resultadoQrTitulo()).toBe('QR inválido');
  });

  it('con el QR de ingreso sigue yendo a la lista de espera', async () => {
    await component.ejecutar({ clave: 'escanear-qr-ingreso' } as any);

    await component.onQrEscaneado('BRASA_VIVA_INGRESO');

    expect(component.mostrandoResultadoQr()).toBe(false);
    expect(component.procesandoQr()).toBe(true);
  });

  describe('encuestas previas', () => {
    const botonesCliente = [
      { clave: 'escanear-qr-ingreso', ruta: '/ingreso-lista-espera', contexto: 'sin_estadia' },
      { clave: 'encuestas-previas', ruta: '/resultados-encuesta', contexto: 'en_espera' },
      { clave: 'encuesta', ruta: '/realizar-encuesta', contexto: 'pedido_entregado' },
    ];

    const clavesVisibles = () => component.botonesVisibles().map((b) => b.clave);

    beforeEach(() => {
      component.sesionAnonima.set({ id: 'x', nombre: 'Ana' } as any);
      (component as any).botones.set(botonesCliente);
    });

    it('se ven antes de anotarse en la lista de espera', () => {
      component.estadiaEstado.set('sin_estadia');
      expect(clavesVisibles()).toEqual(['escanear-qr-ingreso', 'encuestas-previas']);
    });

    it('se siguen viendo en la lista de espera', () => {
      component.estadiaEstado.set('en_espera');
      expect(clavesVisibles()).toEqual(['encuestas-previas']);
    });

    it('no aparecen con el pedido entregado', () => {
      component.estadiaEstado.set('pedido_entregado');
      expect(clavesVisibles()).toEqual(['encuesta']);
    });
  });
});
