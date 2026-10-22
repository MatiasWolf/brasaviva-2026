import { TestBed } from '@angular/core/testing';
import { CuentaService } from './cuenta.service';
import { SupabaseService } from './supabase.service';
import { ClienteService } from './cliente.service';
import { AuthService } from './auth.service';
import { AnonymousSessionService } from './anonymous-session.service';

describe('CuentaService', () => {
  let service: CuentaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: {} },
        { provide: ClienteService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: AnonymousSessionService, useValue: {} },
      ],
    });
    service = TestBed.inject(CuentaService);
  });

  it('calcula la propina sobre el subtotal sin descuento', () => {
    service.itemsEntregados.set([
      { producto_nombre: 'Bife', cantidad: 1, precio_unitario: 10000, importe: 10000 },
    ]);
    service.juegoDescuentoPorcentaje.set(10);
    service.propinaPorcentaje.set(20);

    expect(service.propinaMonto()).toBe(2000);
    expect(service.totalFinal()).toBe(11000);
  });
});
