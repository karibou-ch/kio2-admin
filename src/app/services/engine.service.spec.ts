import { TestBed } from '@angular/core/testing';

import { EngineService } from './engine.service';

describe('EngineService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EngineService = TestBed.get(EngineService);
    expect(service).toBeTruthy();
  });
});
