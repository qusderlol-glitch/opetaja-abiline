/* Õpetaja Abiline – site settings.
   sharedUrl = the address of the Cloudflare Worker that holds the site's own Gemini key (see worker/README.md).
   While it is empty, the "site key" mode shows "not set up yet". The key itself is NEVER stored here. */
window.OA_CONFIG = {
  sharedUrl: 'https://opetaja-abiline.opetajahelper.workers.dev'
};
