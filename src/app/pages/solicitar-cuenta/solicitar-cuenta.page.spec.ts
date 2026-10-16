import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SolicitarCuentaPage } from './solicitar-cuenta.page';

describe('SolicitarCuentaPage', () => {
  let component: SolicitarCuentaPage;
  let fixture: ComponentFixture<SolicitarCuentaPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'home', children: [] }])],
    });
    fixture = TestBed.createComponent(SolicitarCuentaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
