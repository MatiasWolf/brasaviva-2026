import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MenuProductosPage } from './menu-productos.page';

const modalControllerStub = {
  create: () => Promise.resolve({ present: () => Promise.resolve() }),
} as unknown as ModalController;

const activatedRouteStub = {
  snapshot: { paramMap: { get: (_: string) => 'test-id' } },
} as unknown as ActivatedRoute;

describe('MenuProductosPage', () => {
  let component: MenuProductosPage;
  let fixture: ComponentFixture<MenuProductosPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: ModalController, useValue: modalControllerStub },
      ],
    });
    fixture = TestBed.createComponent(MenuProductosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
