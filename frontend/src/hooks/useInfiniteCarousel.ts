import { useState, useCallback, useRef } from 'react';

interface UseInfiniteCarouselOptions<T> {
  initialItems: T[];
  fetchMore: (page: number) => Promise<T[]>;
  pageSize?: number;
}

/**
 * Hook para paginação infinita em carrosséis
 * Otimizado para performance e UX fluida
 */
export const useInfiniteCarousel = <T extends { id: number }>({
  initialItems,
  fetchMore,
}: UseInfiniteCarouselOptions<T>) => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  /**
   * Carrega próxima página de itens
   */
  const loadMore = useCallback(async () => {
    // Previne múltiplas requisições simultâneas
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const nextPage = currentPage + 1;
      const newItems = await fetchMore(nextPage);

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        // Remove duplicados por ID
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
          return [...prev, ...uniqueNewItems];
        });
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Erro ao carregar mais itens:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, fetchMore, hasMore]);

  /**
   * Shuffle dos itens (aleatorização)
   */
  const shuffleItems = useCallback(() => {
    setItems((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  }, []);

  /**
   * Reset para estado inicial
   */
  const reset = useCallback(() => {
    setItems(initialItems);
    setCurrentPage(1);
    setHasMore(true);
    loadingRef.current = false;
  }, [initialItems]);

  return {
    items,
    isLoading,
    hasMore,
    loadMore,
    shuffleItems,
    reset,
  };
};

export default useInfiniteCarousel;
