import { supabase, isSupabaseConfigured } from './supabase.js';
import { KEYS, LAST_USER_KEY, PENDING_DELETES_KEY, ROW_TABLES, STATIC_TABLES } from './keys.js';

const PENDING_PUSH_KEY = 'pb_pending_push';
const DELAY_MS = 1200;
const RETRY_DELAY_MS = 15000;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function readList(key) {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
}

function tableKey(table) {
  return KEYS[table];
}

async function currentUserId() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

export const Sync = {
  isOnline: typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true,

  init() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.queuePush(null, true);
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.flushNow();
      }
    });
  },

  hasPending() {
    const pending = read(PENDING_PUSH_KEY, []);
    const deletes = read(PENDING_DELETES_KEY, []);
    return pending.length > 0 || deletes.length > 0;
  },

  queuePush(collection = null, force = false) {
    if (!this.isOnline || !isSupabaseConfigured) {
      if (collection) this.markDirty(collection);
      return;
    }
    if (collection) this.markDirty(collection);
    if (typeof window === 'undefined') return;
    if (force) {
      this.flushNow();
      return;
    }
    if (this._timer) window.clearTimeout(this._timer);
    this._timer = window.setTimeout(() => this.flushNow(), DELAY_MS);
  },

  queueDelete(table, id) {
    const deletes = readList(PENDING_DELETES_KEY);
    const entry = { table, id };
    if (!deletes.some((d) => d.table === table && d.id === id)) deletes.push(entry);
    write(PENDING_DELETES_KEY, deletes);
    this.queuePush();
  },

  markDirty(collection) {
    const pending = read(PENDING_PUSH_KEY, []);
    if (collection && !pending.includes(collection)) pending.push(collection);
    write(PENDING_PUSH_KEY, pending);
  },

  async flushNow() {
    if (this._flushing) return this._flushing;
    this._flushing = this.performSync()
      .finally(() => {
        this._flushing = null;
      });
    return this._flushing;
  },

  async performSync() {
    if (!isSupabaseConfigured) return false;
    const userId = await currentUserId();
    if (!userId) return false;
    if (!this.isOnline && !navigator.onLine) return false;

    try {
      await this.applyDeletes(userId);
      await this.pushCollections(userId);
      write(PENDING_PUSH_KEY, []);
      write(PENDING_DELETES_KEY, []);
      return true;
    } catch {
      // Network or server failure: keep pending for the next retry.
      if (this._retryTimer) window.clearTimeout(this._retryTimer);
      this._retryTimer = window.setTimeout(() => this.queuePush(null, true), RETRY_DELAY_MS);
      return false;
    }
  },

  async applyDeletes(userId) {
    const deletes = readList(PENDING_DELETES_KEY);
    for (const entry of deletes) {
      if (STATIC_TABLES.includes(entry.table)) {
        await supabase.from(`pb_${entry.table}`).delete().eq('user_id', userId);
      } else {
        await supabase.from(`pb_${entry.table}`).delete().eq('id', entry.id);
      }
    }
  },

  async pushCollections(userId) {
    const pending = read(PENDING_PUSH_KEY, []);

    for (const table of ROW_TABLES) {
      if (!pending.includes(table)) continue;
      const rows = readList(tableKey(table)).map((data) => ({
        id: data.id,
        user_id: userId,
        data,
        updated_at: new Date().toISOString(),
      }));
      if (rows.length) {
        await supabase.from(`pb_${table}`).upsert(rows, { onConflict: 'id' });
      }
    }

    for (const table of STATIC_TABLES) {
      if (!pending.includes(table)) continue;
      const data = read(tableKey(table), null);
      if (data) {
        await supabase.from(`pb_${table}`).upsert({
          user_id: userId,
          data,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    }
  },

  async pullAll() {
    if (!isSupabaseConfigured) return false;
    const userId = await currentUserId();
    if (!userId) return false;

    for (const table of ROW_TABLES) {
      const { data } = await supabase
        .from(`pb_${table}`)
        .select('data')
        .eq('user_id', userId);
      if (data) write(tableKey(table), data.map((row) => row.data));
    }

    for (const table of STATIC_TABLES) {
      const { data } = await supabase
        .from(`pb_${table}`)
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) write(tableKey(table), data.data);
    }
    return true;
  },

  async loginSync() {
    if (!isSupabaseConfigured) return;
    const userId = await currentUserId();
    if (!userId) return;

    const previousUser = read(LAST_USER_KEY, null);
    try {
      if (previousUser && previousUser !== userId) {
        // Different account on this device: server is the source of truth.
        write(PENDING_PUSH_KEY, []);
        write(PENDING_DELETES_KEY, []);
        await this.pullAll();
      } else {
        // Same account (or first login): upload local changes, then download.
        await this.performSync();
        await this.pullAll();
      }
      write(LAST_USER_KEY, userId);
    } catch {
      // Network failure during initial sync: continue with local data.
    }
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    if (this._timer) window.clearTimeout(this._timer);
    write(PENDING_PUSH_KEY, []);
    write(PENDING_DELETES_KEY, []);
    await supabase.auth.signOut();
  },
};