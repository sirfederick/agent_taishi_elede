const { ClientSecretCredential, DeviceCodeCredential } = require('@azure/identity');

const SCOPE = 'https://api.powerplatform.com/.default';

async function getAccessToken() {
  const {
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
    USE_S2S_CONNECTION
  } = process.env;

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID) {
    throw new Error('Missing AZURE_TENANT_ID or AZURE_CLIENT_ID');
  }

  if (USE_S2S_CONNECTION === 'true') {
    if (!AZURE_CLIENT_SECRET) {
      throw new Error('Missing AZURE_CLIENT_SECRET for S2S connection');
    }
    const credential = new ClientSecretCredential(
      AZURE_TENANT_ID,
      AZURE_CLIENT_ID,
      AZURE_CLIENT_SECRET
    );
    const token = await credential.getToken(SCOPE);
    return token.token;
  } else {
    const credential = new DeviceCodeCredential({
      tenantId: AZURE_TENANT_ID,
      clientId: AZURE_CLIENT_ID,
      userPromptCallback: (info) => {
        console.log(info.message);
      }
    });
    const token = await credential.getToken(SCOPE);
    return token.token;
  }
}

module.exports = { getAccessToken };

if (require.main === module) {
  getAccessToken()
    .then(t => console.log('Token acquired:', t.slice(0, 20) + '...'))
    .catch(e => console.error('Failed to get token:', e.message));
}
