import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeguimientoPedidoPage } from './seguimiento-pedido.page';

describe('SeguimientoPedidoPage', () => {
  let component: SeguimientoPedidoPage;
  let fixture: ComponentFixture<SeguimientoPedidoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SeguimientoPedidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
