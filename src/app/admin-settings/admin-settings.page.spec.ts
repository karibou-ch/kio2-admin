import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AdminSettingsPage } from './admin-settings.page';

describe('AdminSettingsPage', () => {
  let component: AdminSettingsPage;
  let fixture: ComponentFixture<AdminSettingsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminSettingsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
