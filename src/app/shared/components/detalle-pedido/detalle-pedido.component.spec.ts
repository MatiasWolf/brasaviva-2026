import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';

import { DetallePedidoComponent } from './detalle-pedido.component';

const modalControllerStub = {
  create: () => Promise.resolve({ present: () => Promise.resolve() }),
  dismiss: () => Promise.resolve(true),
} as unknown as ModalController;

const toastControllerStub = {
  create: () => Promise.resolve({ present: () => Promise.resolve() }),
} as unknown as ToastController;

describe('DetallePedidoComponent', () => {
  let component: DetallePedidoComponent;
  let fixture: ComponentFixture<DetallePedidoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ModalController, useValue: modalControllerStub },
        { provide: ToastController, useValue: toastControllerStub },
      ],
    });
    fixture = TestBed.createComponent(DetallePedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
