import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PaginatorService } from '../../services/features/paginator/paginator.service';
import { KlesTableFooterStartDirective } from '../../directives/table-footer-start.directive';
import { TableComponent } from '../table/table.component';
import { PaginateTableComponent } from './paginate-table.component';

@Component({
    selector: 'kles-table',
    standalone: true,
    template: '',
})
class TableStubComponent {}

@Component({
    standalone: true,
    imports: [PaginateTableComponent, KlesTableFooterStartDirective],
    template: `
        <kles-paginate-table>
            <div klesTableFooterStart data-testid="footer-start">12 éléments sélectionnés</div>
        </kles-paginate-table>
    `,
})
class WithFooterStartHostComponent {}

@Component({
    standalone: true,
    imports: [PaginateTableComponent],
    template: '<kles-paginate-table></kles-paginate-table>',
})
class WithoutFooterStartHostComponent {}

describe('PaginateTableComponent', () => {
    const paginatorService = {
        disabled: () => signal(false),
        register: jasmine.createSpy('register'),
    };

    beforeEach(async () => {
        paginatorService.register.calls.reset();

        await TestBed.configureTestingModule({
            imports: [WithFooterStartHostComponent, WithoutFooterStartHostComponent],
            providers: [{ provide: PaginatorService, useValue: paginatorService }],
        })
            .overrideComponent(PaginateTableComponent, {
                remove: { imports: [TableComponent] },
                add: { imports: [TableStubComponent] },
            })
            .compileComponents();
    });

    it('renders the paginator without projected footer content', () => {
        const fixture = TestBed.createComponent(WithoutFooterStartHostComponent);
        fixture.detectChanges();

        const footerStart = fixture.debugElement.query(By.css('.table-footer-start'));
        const paginator = fixture.debugElement.query(By.css('mat-paginator'));

        expect(footerStart.nativeElement.textContent.trim()).toBe('');
        expect(paginator).not.toBeNull();
        expect(paginatorService.register).toHaveBeenCalled();
    });

    it('projects footerStart content before the paginator', () => {
        const fixture: ComponentFixture<WithFooterStartHostComponent> = TestBed.createComponent(WithFooterStartHostComponent);
        fixture.detectChanges();

        const footerStartContent = fixture.debugElement.query(By.css('[data-testid="footer-start"]'));
        const footerStart = fixture.debugElement.query(By.css('.table-footer-start'));
        const paginator = fixture.debugElement.query(By.css('mat-paginator'));

        expect(footerStartContent.nativeElement.textContent.trim()).toBe('12 éléments sélectionnés');
        expect(footerStart.nativeElement.contains(footerStartContent.nativeElement)).toBeTrue();
        expect(
            Boolean(footerStart.nativeElement.compareDocumentPosition(paginator.nativeElement) & Node.DOCUMENT_POSITION_FOLLOWING),
        ).toBeTrue();
    });
});
