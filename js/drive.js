/**
 * BrainBoost Google Drive Sync (100% client-side)
 * Sign in with any Google (Gmail) account to back up BrainBoost progress
 * to your own Google Drive and restore it on any device with the same account.
 *
 * SETUP (one-time, ~5 minutes, free):
 *   1. Go to https://console.cloud.google.com  -> create/select a project
 *   2. Enable the "Google Drive API"
 *   3. OAuth consent screen -> External -> add your Gmail as a Test user
 *   4. Credentials -> Create OAuth Client ID -> type "Web application"
 *      - Add your site to "Authorized JavaScript origins"
 *        (e.g. http://localhost:5500 while testing, then your live domain)
 *   5. Paste the Client ID into GOOGLE_DRIVE_CONFIG.clientId below
 *
 * NOTE: The app must be served over http(s) or http://localhost (not file://).
 */

const GOOGLE_DRIVE_CONFIG = {
  clientId: "",
  backupFileName: "brainboost_backup.json",
  autoSync: true
};

const DRIVE_SCOPES = 'openid email https://www.googleapis.com/auth/drive.file';

class GoogleDriveManager {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.userEmail = null;
    this.ready = false;
  }

  isConfigured() {
    return Boolean(GOOGLE_DRIVE_CONFIG.clientId);
  }

  loadGis() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) return resolve();
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
      document.head.appendChild(script);
    });
  }

  async init() {
    if (!this.isConfigured()) return false;
    try {
      await this.loadGis();
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DRIVE_CONFIG.clientId,
        scope: DRIVE_SCOPES,
        callback: () => {}
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  authenticate() {
    return new Promise((resolve) => {
      if (!this.tokenClient) { resolve(false); return; }
      this.tokenClient.callback = (resp) => {
        if (resp.error || !resp.access_token) { resolve(false); return; }
        this.accessToken = resp.access_token;
        this.ready = true;
        if (resp.id_token) this.userEmail = this.decodeJwt(resp.id_token).email || null;
        this.updateUI();
        resolve(true);
      };
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  disconnect() {
    if (this.accessToken && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try { window.google.accounts.oauth2.revoke(this.accessToken, () => {}); } catch (e) {}
    }
    this.accessToken = null;
    this.userEmail = null;
    this.ready = false;
    this.updateUI();
  }

  decodeJwt(token) {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(json);
    } catch (e) {
      return {};
    }
  }

  async ensureToken() {
    if (!this.isConfigured()) return false;
    if (!this.tokenClient) {
      const ok = await this.init();
      if (!ok) return false;
    }
    if (!this.ready) return await this.authenticate();
    return true;
  }

  async listBackups() {
    const q = `name='${GOOGLE_DRIVE_CONFIG.backupFileName}' and trashed=false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime%20desc`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    if (!res.ok) throw new Error('Drive list request failed.');
    const data = await res.json();
    return data.files || [];
  }

  async upload(json) {
    const files = await this.listBackups();
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    if (files.length > 0) {
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${files[0].id}?uploadType=media`,
        { method: 'PATCH', headers, body: json }
      );
      if (!res.ok) throw new Error('Drive update failed.');
    } else {
      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=media',
        { method: 'POST', headers, body: json }
      );
      if (!res.ok) throw new Error('Drive create failed.');
    }
  }

  async saveToDrive() {
    if (!(await this.ensureToken())) { showToast('Google Drive is not connected.', 'info'); return; }
    try {
      await this.upload(JSON.stringify(storage.get(), null, 2));
      showToast('Progress saved to your Google Drive.', 'success');
      soundSynth.playSuccess();
    } catch (e) {
      console.error(e);
      showToast('Could not save to Google Drive. Check your connection.', 'error');
    }
  }

  async loadFromDrive() {
    if (!(await this.ensureToken())) { showToast('Google Drive is not connected.', 'info'); return; }
    try {
      const files = await this.listBackups();
      if (files.length === 0) {
        showToast('No BrainBoost backup found in Google Drive yet.', 'info');
        return;
      }
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (!res.ok) throw new Error('Drive download failed.');
      const text = await res.text();
      if (storage.importJSON(text)) {
        showToast('Backup restored from Google Drive.', 'success');
        soundSynth.playSuccess();
        dashboardManager.renderDashboard();
      } else {
        showToast('The backup file on Drive is invalid.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not load from Google Drive. Check your connection.', 'error');
    }
  }

  autoSync() {
    if (!GOOGLE_DRIVE_CONFIG.autoSync || !this.ready) return;
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this.saveToDriveSilently(), 3000);
  }

  async saveToDriveSilently() {
    try {
      await this.upload(JSON.stringify(storage.get(), null, 2));
    } catch (e) {
      console.warn('Auto-sync to Google Drive failed:', e);
    }
  }

  updateUI() {
    const statusEl = document.getElementById('drive-status');
    const connectBtn = document.getElementById('drive-connect-btn');
    if (statusEl) {
      statusEl.innerHTML = this.ready
        ? `<i class="fas fa-check-circle" style="color:var(--accent-success);"></i> Connected as <strong>${this.userEmail || 'your Google account'}</strong>`
        : this.isConfigured()
          ? '<i class="fas fa-cloud" style="color:var(--accent-tertiary);"></i> Not connected. Sign in to sync across devices.'
          : '<i class="fas fa-circle-exclamation" style="color:var(--accent-gold);"></i> Not configured yet — add your Google Client ID in <code>js/drive.js</code>.';
    }
    if (connectBtn) {
      connectBtn.innerHTML = this.ready
        ? '<i class="fas fa-right-from-bracket"></i> Disconnect'
        : '<i class="fas fa-google"></i> Sign in with Google';
    }
  }
}

window.driveManager = new GoogleDriveManager();
