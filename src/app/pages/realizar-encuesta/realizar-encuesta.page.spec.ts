import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RealizarEncuestaPage } from './realizar-encuesta.page';

describe('RealizarEncuestaPage', () => {
  let component: RealizarEncuestaPage;
  let fixture: ComponentFixture<RealizarEncuestaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RealizarEncuestaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
