import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import localeFr from '@angular/common/locales/fr';
import { registerLocaleData } from '@angular/common';


registerLocaleData(localeFr);
export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        provideTranslateService({
            fallbackLang: 'en',
            lang: 'en',
        }),
    ],
};
