import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RealizarEncuestaPage } from './realizar-encuesta.page';

describe('RealizarEncuestaPage', () => {
  let component: RealizarEncuestaPage;
  let fixture: ComponentFixture<RealizarEncuestaPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'home', children: [] }])],
    });
    fixture = TestBed.createComponent(RealizarEncuestaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
