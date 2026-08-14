import { Injectable } from '@angular/core';
import { KlesTableIntl } from 'projects/kles-material-table/src/public-api';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CustomTableIntl extends KlesTableIntl {
    emptyStateTitle = 'Pas de donnée';
    emptyStateDescription = 'Aucune ligne a afficher.';
}
