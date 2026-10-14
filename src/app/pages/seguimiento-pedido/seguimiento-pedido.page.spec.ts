import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { SeguimientoPedidoPage } from './seguimiento-pedido.page';

const activatedRouteStub = {
  snapshot: { paramMap: { get: (_: string) => 'test-id' } },
} as unknown as ActivatedRoute;

describe('SeguimientoPedidoPage', () => {
  let component: SeguimientoPedidoPage;
  let fixture: ComponentFixture<SeguimientoPedidoPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    });
    fixture = TestBed.createComponent(SeguimientoPedidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
