import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { EditarEmpleadoPage } from './editar-empleado.page';

const activatedRouteStub = {
  snapshot: { paramMap: { get: (_: string) => 'test-id' } },
} as unknown as ActivatedRoute;

describe('EditarEmpleadoPage', () => {
  let component: EditarEmpleadoPage;
  let fixture: ComponentFixture<EditarEmpleadoPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    });
    fixture = TestBed.createComponent(EditarEmpleadoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
