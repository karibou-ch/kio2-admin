import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { VendorsPage } from './vendors.page';

describe('VendorsPage', () => {
  let component: VendorsPage;
  let fixture: ComponentFixture<VendorsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(VendorsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
