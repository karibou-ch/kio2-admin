import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OrdersCustomerPage } from './orders.page';

describe('OrdersCustomerPage', () => {
  let component: OrdersCustomerPage;
  let fixture: ComponentFixture<OrdersCustomerPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrdersCustomerPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersCustomerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
