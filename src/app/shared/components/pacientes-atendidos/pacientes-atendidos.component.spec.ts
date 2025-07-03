import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacientesAtendidosComponent } from './pacientes-atendidos.component';

describe('PacientesAtendidosComponent', () => {
  let component: PacientesAtendidosComponent;
  let fixture: ComponentFixture<PacientesAtendidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacientesAtendidosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PacientesAtendidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
