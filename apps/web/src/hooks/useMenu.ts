import { useEffect, useState } from 'react';
import type { MenuItem } from '@foodjet/shared';
import { api } from '../lib/api-client';
import { ApiError } from '../lib/api-error';

interface MenuState {
  items: MenuItem[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads the menu once and filters client-side.
 *
 * The catalogue is small enough that round-tripping every keystroke to the API
 * would add latency without adding correctness. The server-side filters exist
 * for API consumers; the UI just needs the list.
 */
export function useMenu(): MenuState {
  const [state, setState] = useState<MenuState>({
    items: [],
    categories: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await api.getMenu({}, controller.signal);
        setState({
          items: response.items,
          categories: response.categories,
          isLoading: false,
          error: null,
        });
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;

        setState({
          items: [],
          categories: [],
          isLoading: false,
          error:
            caught instanceof ApiError
              ? caught.message
              : 'Could not load the menu right now',
        });
      }
    })();

    return () => controller.abort();
  }, []);

  return state;
}
