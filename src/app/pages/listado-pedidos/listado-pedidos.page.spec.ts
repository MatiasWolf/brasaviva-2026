import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ListadoPedidosPage } from './listado-pedidos.page';

const activatedRouteStub = {
  snapshot: { paramMap: { get: (_: string) => 'test-id' } },
} as unknown as ActivatedRoute;

describe('ListadoPedidosPage', () => {
  let component: ListadoPedidosPage;
  let fixture: ComponentFixture<ListadoPedidosPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    });
    fixture = TestBed.createComponent(ListadoPedidosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
