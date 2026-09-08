import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartaBebidasPage } from './carta-bebidas.page';

describe('CartaBebidasPage', () => {
  let component: CartaBebidasPage;
  let fixture: ComponentFixture<CartaBebidasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CartaBebidasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
