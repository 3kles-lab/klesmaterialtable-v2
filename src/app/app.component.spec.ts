import { TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideZoneChangeDetection } from '@angular/core';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideZoneChangeDetection({ ignoreChangesOutsideZone: true })],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'KlesMaterialTable'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('KlesMaterialTable');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain('KlesMaterialTable app is running!');
  });
});
