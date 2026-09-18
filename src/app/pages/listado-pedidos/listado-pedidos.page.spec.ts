import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoPedidosPage } from './listado-pedidos.page';

describe('ListadoPedidosPage', () => {
  let component: ListadoPedidosPage;
  let fixture: ComponentFixture<ListadoPedidosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListadoPedidosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
