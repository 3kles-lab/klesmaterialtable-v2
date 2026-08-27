import { Injector } from '@angular/core';
import { DragDropService } from './dragdrop.service';

describe('DragDropService', () => {
    function createService(enable: boolean, handleOnly: boolean): DragDropService {
        return new DragDropService(
            { enable, options: { handleOnly } },
            {} as any,
            {} as any,
            Injector.create({ providers: [] }),
        );
    }

    it('enables the dedicated handle when row drag and handleOnly are enabled', () => {
        expect(createService(true, true).handleOnly).toBeTrue();
    });

    it('does not expose a handle when row drag is disabled', () => {
        expect(createService(false, true).handleOnly).toBeFalse();
    });
});
