import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EventsService } from '../events/events.service';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
    let service: ValidationService;
    let emit: jasmine.Spy;
    const row = () => new FormGroup({ _id: new FormControl('same-id'), name: new FormControl('valid') });
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [ValidationService, EventsService] });
        service = TestBed.inject(ValidationService);
        emit = spyOn(TestBed.inject(EventsService), 'emit');
    });

    it('reports initial group-only errors without requiring cell errors', () => {
        const group = row();
        group.setValidators(() => ({ crossField: true }));
        group.updateValueAndValidity();
        service.listen([group], ['name']);
        expect(emit).toHaveBeenCalledWith('rowValidationError', jasmine.objectContaining({ errors: { crossField: true }, controlsErrors: {} }));
    });

    it('does not duplicate subscriptions and uses the current visible row index', () => {
        const first = row();
        const second = row();
        service.listen([first, second], ['name']);
        service.listen([second, first], ['name']);
        first.setErrors({ rule: true });
        expect(emit.calls.count()).toBe(1);
        expect(emit).toHaveBeenCalledWith('rowValidationError', jasmine.objectContaining({ row: first, rowIndex: 1 }));
    });

    it('subscribes to replacement forms with the same id and releases old forms', () => {
        const previous = row();
        const replacement = row();
        service.listen([previous], ['name']);
        service.listen([replacement], ['name']);
        previous.setErrors({ old: true });
        expect(emit).not.toHaveBeenCalled();
        replacement.get('name')!.setValidators(Validators.required);
        replacement.get('name')!.setValue('');
        expect(emit).toHaveBeenCalledWith('cellValidationError', jasmine.objectContaining({ controlsErrors: { name: { required: true } } }));
        expect(emit.calls.allArgs().filter(([type]) => type === 'rowValidationError').length).toBe(1);
        emit.calls.reset();
        service.listen([], []);
        replacement.setErrors({ removed: true });
        expect(emit).not.toHaveBeenCalled();
    });
});
