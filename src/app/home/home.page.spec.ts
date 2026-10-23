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

});
