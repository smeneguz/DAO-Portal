// lib/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

// Hook for using localStorage with React
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = (): T => {
    // Prevent build error "window is undefined" but keep working
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        try {
          // Always clear the key first to ensure no stale data remains
          window.localStorage.removeItem(key);
          
          // Handle empty arrays specifically
          if (Array.isArray(valueToStore) && valueToStore.length === 0) {
            console.log(`Setting empty array for localStorage key "${key}"`);
            window.localStorage.setItem(key, JSON.stringify([]));
          } else {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          
          // Verify the value was properly stored
          const storedItem = window.localStorage.getItem(key);
          if (!storedItem) {
            console.warn(`Failed to store value for key "${key}"`);
          }
        } catch (storageError) {
          console.error(`Error manipulating localStorage for key "${key}":`, storageError);
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          if (e.newValue) {
            // Item was updated
            const parsedValue = JSON.parse(e.newValue);
            console.log(`Storage event: key "${key}" updated to:`, parsedValue);
            setStoredValue(parsedValue);
          } else {
            // Item was removed
            console.log(`Storage event: key "${key}" was removed, resetting to initial value`);
            setStoredValue(initialValue);
          }
        } catch (parseError) {
          console.error(`Error parsing storage event for key "${key}":`, parseError);
          // As a safety measure, reset to initial value
          setStoredValue(initialValue);
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [key, initialValue]);

  return [storedValue, setValue];
}