const TOKEN_STORAGE_KEY = 'jwt-token-storage-key';

export class Client {
  constructor(config) {
    this._config = config;
  }

  async getUserInfo() {
    const response = await fetch(`${this._config.getUserInfoUri}?token=${this.token}`);
    if (response.status === 401) {
      this.cleanToken();
      throw new Error('Unauthorized');
    }
    if (response.status !== 200) {
      throw new Error('Fetch data error please retry later')
    }
    const data = await response.json();
    return data;
  }

  async authorize(callbackUri) {
      const response = await fetch(this._config.generateTokenUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callbackUri: callbackUri,
        rcWebhookUri: this._config.rcWebhookUri
      }),
    });
    if (response.status !== 200) {
      throw new Error('Authorization error')
    }
    const tokenData = await response.json();
    if (tokenData.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenData.token);
    }
  }

  async subscribe() {
    const response = await fetch(this._config.subscribeUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: this.token,
        rcWebhookUri: this._config.rcWebhookUri
      }),
    });
    if (response.status !== 200) {
      throw new Error('Subscription error');
    }
  }

  async logout() {
    const resp = await fetch(this._config.authRevokeUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: this.token,
      }),
    });
    if (resp.status !== 200) {
      throw new Error('unauthorize error');
    }
    this.cleanToken();
  }

  get authorized() {
    return !!this.token;
  }

  get authPageUri() {
    return this._config.authPageUri;
  }

  cleanToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  get token() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

}
