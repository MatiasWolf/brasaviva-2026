import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { SolicitarCuentaPage } from './solicitar-cuenta.page';

describe('SolicitarCuentaPage', () => {
  let component: SolicitarCuentaPage;
  let fixture: ComponentFixture<SolicitarCuentaPage>;
  let alertas: any[];

  beforeEach(() => {
    alertas = [];
    const alertCtrlFalso = {
      create: async (opciones: any) => {
        alertas.push(opciones);
        return { present: async () => undefined };
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'home', children: [] }]),
        { provide: AlertController, useValue: alertCtrlFalso },
      ],
    });
    fixture = TestBed.createComponent(SolicitarCuentaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('pide confirmar la propina antes de mostrar la factura', async () => {
    component.faseActual.set('bloqueo_propina');

    await component.onPropinaEscaneada('Excelente');

    expect(alertas.length).toBe(1);
    expect(alertas[0].message).toBe('Ingresaste 20% de propina (Excelente). ¿Es correcto?');
    expect(component.faseActual()).toBe('bloqueo_propina');
    expect(component.cuentaService.propinaPorcentaje()).toBeNull();

    alertas[0].buttons.find((b: any) => b.role !== 'cancel').handler();

    expect(component.faseActual()).toBe('detalle_factura');
    expect(component.cuentaService.propinaPorcentaje()).toBe(20);
  });

  it('si no confirma la propina se queda para volver a escanear', async () => {
    component.faseActual.set('bloqueo_propina');

    await component.onPropinaEscaneada('Bueno');

    const cancelar = alertas[0].buttons.find((b: any) => b.role === 'cancel');
    cancelar.handler?.();

    expect(component.faseActual()).toBe('bloqueo_propina');
    expect(component.cuentaService.propinaPorcentaje()).toBeNull();
  });
});
