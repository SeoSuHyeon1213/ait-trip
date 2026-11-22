export function createTourResponseCache({ freshSeconds, retainSeconds, maxEntries }) {
  const entries = new Map();

  function remember(key, entry) {
    entries.delete(key);
    if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
    entries.set(key, entry);
  }

  return {
    async get(key, sharedCache) {
      const local = entries.get(key);
      if (local?.freshUntil > Date.now()) return local;

      const shared = await sharedCache?.get(key);
      const entry = shared?.freshUntil > (local?.freshUntil ?? 0) ? shared : local;
      if (!entry || entry.retainUntil <= Date.now()) {
        if (entries.get(key) === local) entries.delete(key);
        return undefined;
      }
      const latest = entries.get(key);
      if (latest?.freshUntil > entry.freshUntil) return latest;
      remember(key, entry);
      return entry;
    },

    set(key, value, sharedCache) {
      const now = Date.now();
      const entry = {
        value,
        freshUntil: now + freshSeconds * 1000,
        retainUntil: now + retainSeconds * 1000,
      };
      remember(key, entry);
      sharedCache?.set(key, entry, retainSeconds);
    },
  };
}
