import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MozosChatPage } from './mozos-chat.page';

describe('MozosChatPage', () => {
  let component: MozosChatPage;
  let fixture: ComponentFixture<MozosChatPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MozosChatPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
