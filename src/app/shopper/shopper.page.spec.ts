import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ShopperPage } from './shopper.page';

describe('ShopperPage', () => {
  let component: ShopperPage;
  let fixture: ComponentFixture<ShopperPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShopperPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ShopperPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
