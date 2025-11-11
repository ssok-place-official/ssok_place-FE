declare module '@react-native-async-storage/async-storage' {
  export interface AsyncStorageStatic {
    /**
     * Fetches an item for a `key` and invokes a callback upon completion.
     */
    getItem(key: string, callback?: (error?: Error, result?: string) => void): Promise<string | null>;

    /**
     * Sets the value for a `key` and invokes a callback upon completion.
     */
    setItem(key: string, value: string, callback?: (error?: Error) => void): Promise<void>;

    /**
     * Removes an item for a `key` and invokes a callback upon completion.
     */
    removeItem(key: string, callback?: (error?: Error) => void): Promise<void>;

    /**
     * Merges an existing `key` value with an input value, assuming both values
     * are stringified JSON. Returns a `Promise` object.
     */
    mergeItem(key: string, value: string, callback?: (error?: Error) => void): Promise<void>;

    /**
     * Erases *all* `AsyncStorage` for all clients, libraries, etc. You probably
     * don't want to call this - use removeItem or multiRemove to clear only your
     * app's keys. Returns a `Promise` object.
     */
    clear(callback?: (error?: Error) => void): Promise<void>;

    /**
     * Gets *all* keys known to the app, for all callers, libraries, etc. Returns a `Promise` object.
     */
    getAllKeys(callback?: (error?: Error, keys?: string[]) => void): Promise<string[]>;

    /**
     * multiGet fetches multiple key-value pairs in a batch.
     */
    multiGet(
      keys: string[],
      callback?: (errors?: Error[], result?: [string, string | null][]) => void
    ): Promise<[string, string | null][]>;

    /**
     * multiSet allows you to set multiple key-value pairs in a batch.
     */
    multiSet(
      keyValuePairs: [string, string][],
      callback?: (errors?: Error[]) => void
    ): Promise<void>;

    /**
     * Use this as a batch operation for deleting multiple keys.
     */
    multiRemove(keys: string[], callback?: (errors?: Error[]) => void): Promise<void>;

    /**
     * Batch operation to merge in existing and new values for a given set of
     * keys. This assumes that the values are stringified JSON.
     */
    multiMerge(
      keyValuePairs: [string, string][],
      callback?: (errors?: Error[]) => void
    ): Promise<void>;
  }

  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}


