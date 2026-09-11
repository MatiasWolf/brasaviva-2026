import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoClientesPendientesPage } from './listado-clientes-pendientes.page';

describe('ListadoClientesPendientesPage', () => {
  let component: ListadoClientesPendientesPage;
  let fixture: ComponentFixture<ListadoClientesPendientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListadoClientesPendientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
