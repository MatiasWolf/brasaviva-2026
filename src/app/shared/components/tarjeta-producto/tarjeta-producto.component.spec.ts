import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaProductoComponent } from './tarjeta-producto.component';
import { Producto } from '../../../core/models/pedido.models';

const productoDemo: Producto = {
  id: 1,
  nombre: 'Producto de prueba',
  descripcion: 'Descripción de prueba',
  precio: 1000,
  categoria_id: 1,
  foto_url: '',
  foto2_url: '',
  foto3_url: '',
  tiempo_preparacion: 10,
  disponible: true,
  created_at: '',
};

describe('TarjetaProductoComponent', () => {
  let component: TarjetaProductoComponent;
  let fixture: ComponentFixture<TarjetaProductoComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TarjetaProductoComponent);
    component = fixture.componentInstance;
    component.producto = productoDemo;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
