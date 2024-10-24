import { MSAL_INSTANCE, MsalService } from '@azure/msal-angular';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '4b82ffdd-bac7-42c8-b3bb-6effe0bf2e38',  // Aus deinem Screenshot
      redirectUri: 'http://localhost:4200',  // Lokale Entwicklungsumgebung
      authority: 'https://login.microsoftonline.com/8986d6f1-1331-4e4a-b7a1-20c4b2b50b61'  // Deine Verzeichnis-ID
    }
  });
}

export function provideMSAL() {
  return [
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    MsalService
  ];
}
