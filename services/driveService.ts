import { supabase } from './supabaseClient';

/**
 * Imam Malik College - High-Performance Cloud Sync Service
 */

const STORAGE_KEYS = {
  APPLICATIONS: 'imst_applications',
  POSTS: 'imst_posts',
  STUDENTS: 'imst_students',
  TEACHERS: 'imst_teachers',
  CLASSES: 'imst_classes',
  SUBJECTS: 'imst_subjects',
  RESULTS: 'imst_results',
  LAST_SYNC: 'imst_last_sync_time'
};

export const driveService = {
  // Real Supabase Authentication with Hardcoded Demo Accounts
  async signIn(email: string, pass: string) {
    // Admin Demo
    if (email === 'admin@school.com' && pass === 'admin') {
        return { user: { email, id: 'admin-id-001' } };
    }
    
    // Applicant Demo - Added for user request
    if (email === 'applicant@school.com' && pass === 'applicant') {
        return { user: { email, id: 'demo-applicant-id' } };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) return { error: error.message };
      return { user: data.user };
    } catch (err) {
      return { error: 'Connection failed. Check your internet or try the demo accounts.' };
    }
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('imst_session');
    // Using reload to clear all states safely
    window.location.reload();
  },

  /**
   * Optimized getTable:
   * 1. Returns local cache immediately for instant UI
   * 2. Fetches fresh data from Supabase in background
   */
  async getTable(key: string) {
    let cachedData = [];
    try {
      const local = localStorage.getItem(key);
      if (local) {
        cachedData = JSON.parse(local);
      }
    } catch (e) {
      console.warn(`Failed to parse cache for ${key}`, e);
      localStorage.removeItem(key); // Clear bad data
    }

    // Background fetch to update cache for next time
    this.refreshCache(key).catch(console.error);

    return cachedData;
  },

  // Helper to fetch fresh data and update storage without blocking
  async refreshCache(key: string) {
    try {
      const { data, error } = await supabase.from(key).select('*');
      if (!error && data) {
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(`Failed to refresh cache for ${key}`);
    }
    return null;
  },

  async upsert(key: string, item: any, matchField: string = 'id') {
    try {
      const { id, created_at, ...updateData } = item;
      
      const { data, error } = await supabase
        .from(key)
        .upsert({ 
            ...(id ? { id } : {}), 
            ...updateData, 
            updated_at: new Date().toISOString() 
        })
        .select()
        .single();

      if (error) throw error;
      
      // Force refresh cache after write
      await this.refreshCache(key);
      return { data };
    } catch (err) {
      console.error("Upsert failed:", err);
      return { data: item };
    }
  },

  async delete(key: string, id: string) {
    try {
      const { error } = await supabase.from(key).delete().eq('id', id);
      if (!error) await this.refreshCache(key);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  },

  async computePositions(classLevel: string, term: string, session: string) {
    const allResults = await this.getTable(STORAGE_KEYS.RESULTS);
    const classResults = allResults.filter((r: any) => r.classLevel === classLevel && r.term === term && r.session === session);
    
    if (classResults.length === 0) return;

    const sorted = [...classResults].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    const population = sorted.length;

    for (let i = 0; i < sorted.length; i++) {
      const res = sorted[i];
      const pos = i + 1;
      let suffix = "th";
      if (pos === 1) suffix = "st";
      else if (pos === 2) suffix = "nd";
      else if (pos === 3) suffix = "rd";
      
      await this.upsert(STORAGE_KEYS.RESULTS, {
        ...res,
        position: `${pos}${suffix}`,
        classPopulation: population
      }, 'id');
    }
  },

  async exportToDrive() {
    const tables = Object.values(STORAGE_KEYS).filter(k => k !== STORAGE_KEYS.LAST_SYNC);
    const fullData: any = { manifest: { institution: "IMST", timestamp: new Date().toISOString() }, data: {} };
    
    for (const table of tables) {
      fullData.data[table] = await this.getTable(table);
    }
    
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMST_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);

    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    return true;
  },

  getLastSyncTime() {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }
};