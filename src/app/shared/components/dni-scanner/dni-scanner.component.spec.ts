import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DniScannerComponent } from './dni-scanner.component';

describe('DniScannerComponent', () => {
  let component: DniScannerComponent;
  let fixture: ComponentFixture<DniScannerComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DniScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
