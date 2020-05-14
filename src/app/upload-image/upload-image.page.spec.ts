import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { UploadImagePage } from './upload-image.page';

describe('UploadImagePage', () => {
  let component: UploadImagePage;
  let fixture: ComponentFixture<UploadImagePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadImagePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadImagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
