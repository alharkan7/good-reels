'use client';

import { useState, useEffect, useRef } from 'react';
import { GraphData } from '@/app/lib/types';

export function useNetworkGraph(articleTitle: string) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalLinks, setTotalLinks] = useState(0);
  const cache = useRef<Record<string, GraphData & { total: number }>>({});

  useEffect(() => {
    if (!articleTitle) return;

    if (cache.current[articleTitle]) {
      setGraphData(cache.current[articleTitle]);
      setTotalLinks(cache.current[articleTitle].total);
      return;
    }

    setIsLoading(true);
    setGraphData(null);

    fetch(`/api/links?title=${encodeURIComponent(articleTitle)}`)
      .then((res) => res.json())
      .then((data) => {
        const nodes = [
          { id: articleTitle, name: articleTitle, isCenter: true, thumbnail: null },
          ...(data.links || []).map(
            (link: { title: string; thumbnailUrl?: string }) => ({
              id: link.title,
              name: link.title,
              thumbnail: link.thumbnailUrl || null,
              isCenter: false,
            })
          ),
        ];

        const links = (data.links || []).map(
          (link: { title: string }) => ({
            source: articleTitle,
            target: link.title,
          })
        );

        const result: GraphData & { total: number } = {
          nodes,
          links,
          total: data.totalLinksInArticle || 0,
        };
        cache.current[articleTitle] = result;
        setGraphData(result);
        setTotalLinks(data.totalLinksInArticle || 0);
      })
      .catch((err) => {
        console.error('Network graph error:', err);
        setGraphData(null);
      })
      .finally(() => setIsLoading(false));
  }, [articleTitle]);

  return { graphData, isLoading, totalLinks };
}
