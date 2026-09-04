import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoEmpleadosPage } from './listado-empleados.page';

describe('ListadoEmpleadosPage', () => {
  let component: ListadoEmpleadosPage;
  let fixture: ComponentFixture<ListadoEmpleadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListadoEmpleadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
