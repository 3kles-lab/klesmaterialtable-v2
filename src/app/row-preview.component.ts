import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DragDropRowContext, KLES_DRAG_DROP_ROW_CONTEXT } from 'kles-material-table';

interface PreviewRow {
    _id: string | number;
    name?: string | number;
    provider?: {
        label?: string;
    };
}

@Component({
    selector: 'app-row-preview',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="row-preview">
            <span class="drag-icon" aria-hidden="true">⠿</span>

            <div class="content">
                <strong>{{ context.rawValue.name ?? 'Ligne ' + (context.rowIndex + 1) }}</strong>
                <span>ID : {{ context.rawValue._id }}</span>

                @if (context.rawValue.provider?.label; as providerLabel) {
                    <span>{{ providerLabel }}</span>
                }
            </div>
        </div>
    `,
    styles: `
        :host {
            display: block;
            width: 100%;
        }

        .row-preview {
            display: flex;
            align-items: center;
            gap: 12px;
            box-sizing: border-box;
            min-height: 56px;
            padding: 8px 16px;
            color: var(--mat-sys-on-surface);
            background: var(--mat-sys-surface-container-high);
            border: 1px solid var(--mat-sys-primary);
            border-radius: var(--mat-sys-corner-small);
        }

        .drag-icon {
            color: var(--mat-sys-primary);
            font-size: 24px;
            line-height: 1;
        }

        .content {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        .content span {
            color: var(--mat-sys-on-surface-variant);
            font-size: 12px;
        }
    `,
})
export class RowPreviewComponent {
    readonly context = inject(KLES_DRAG_DROP_ROW_CONTEXT) as DragDropRowContext<PreviewRow>;
}
