/**
 * Imam Malik College - Cloud Sync Service
 * Replaces Supabase with a local-first system that prepares data for Google Drive syncing.
 * Primary contact: maitechitservices@gmail.com
 */

const STORAGE_KEYS = {
  APPLICATIONS: 'imst_applications',
  POSTS: 'imst_posts',
  STUDENTS: 'imst_students'
};

export const driveService = {
  // Authentication Mock (Simulating Drive/Cloud Access)
  async signIn(email: string, pass: string) {
    if (email === 'admin@school.com' && pass === 'admin') return { user: { email, id: 'admin' } };
    if (email === 'applicant@school.com' && pass === 'applicant') return { user: { email, id: 'demo-app' } };
    return { error: 'Invalid credentials' };
  },

  async signOut() {
    localStorage.removeItem('imst_session');
    window.location.reload();
  },

  // Generic Data CRUD
  async getTable(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  async upsert(key: string, item: any, matchField: string = 'id') {
    const current = await this.getTable(key);
    const index = current.findIndex((i: any) => i[matchField] === item[matchField]);
    if (index > -1) {
      current[index] = { ...current[index], ...item, updated_at: new Date().toISOString() };
    } else {
      current.push({ ...item, id: item.id || Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() });
    }
    localStorage.setItem(key, JSON.stringify(current));
    return { data: item };
  },

  async delete(key: string, id: string) {
    const current = await this.getTable(key);
    const filtered = current.filter((i: any) => i.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // Google Drive Sync Helper
  async exportToDrive() {
    const fullData = {
      applications: await this.getTable(STORAGE_KEYS.APPLICATIONS),
      posts: await this.getTable(STORAGE_KEYS.POSTS),
      timestamp: new Date().toISOString(),
      owner: 'maitechitservices@gmail.com'
    };
    
    // In a real implementation, this would use the Google Drive API.
    // Here we trigger a download of the "Cloud Backup"
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMST_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    return true;
  }
};