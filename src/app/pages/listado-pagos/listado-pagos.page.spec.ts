import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoPagosPage } from './listado-pagos.page';

describe('ListadoPagosPage', () => {
  let component: ListadoPagosPage;
  let fixture: ComponentFixture<ListadoPagosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListadoPagosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
