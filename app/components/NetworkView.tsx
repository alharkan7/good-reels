'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useNetworkGraph } from '@/app/hooks/useNetworkGraph';
import NetworkLoader from './NetworkLoader';

interface NetworkViewProps {
  articleTitle: string;
  onNodeClick: (title: string) => void;
  onBack: () => void;
}

export default function NetworkView({
  articleTitle,
  onNodeClick,
  onBack,
}: NetworkViewProps) {
  const { graphData, isLoading, totalLinks } = useNetworkGraph(articleTitle);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ForceGraph, setForceGraph] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    import('react-force-graph-3d').then((mod) => {
      setForceGraph(() => mod.default);
    });
  }, []);

  useEffect(() => {
    const update = () => {
      setDimensions({
        width: window.innerWidth > 768 ? 430 : window.innerWidth,
        height: window.innerHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const displayNodeCount = graphData?.nodes.length ?? 0;
  const extraLinks = totalLinks > 40 ? totalLinks - 40 : 0;

  const graphDataMemo = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };
    return {
      nodes: graphData.nodes.map((n) => ({ ...n })),
      links: graphData.links.map((l) => ({ ...l })),
    };
  }, [graphData]);

  if (isLoading || !ForceGraph) return <NetworkLoader />;

  if (!graphData || graphData.nodes.length <= 1) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-4 fade-in">
        <p className="text-white/60 text-sm">
          Artikel ini tidak memiliki tautan
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-full text-sm font-medium text-black"
          style={{ background: 'var(--toggle-active)' }}
        >
          Kembali ke Reels
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 bg-black fade-in"
      style={{ maxWidth: dimensions.width > 430 ? '430px' : '100%', margin: '0 auto' }}
    >
      <ForceGraph
        graphData={graphDataMemo}
        width={Math.min(dimensions.width, 430)}
        height={dimensions.height}
        nodeLabel="name"
        nodeColor={(node: Record<string, unknown>) =>
          node.isCenter ? '#FF6B35' : '#4ECDC4'
        }
        nodeRelSize={6}
        nodeVal={(node: Record<string, unknown>) => (node.isCenter ? 3 : 1)}
        linkColor={() => 'rgba(255,255,255,0.15)'}
        linkWidth={1}
        backgroundColor="#000000"
        onNodeClick={(node: Record<string, unknown>) => {
          if (!node.isCenter) {
            onNodeClick(node.name as string);
          }
        }}
        enableNavigationControls={true}
        showNavInfo={false}
      />

      {/* Info overlay */}
      <div className="absolute bottom-6 left-4 right-4 z-10">
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-4">
          <p className="text-white font-semibold text-sm mb-1">
            {articleTitle}
          </p>
          <p className="text-white/50 text-xs">
            {displayNodeCount - 1} tautan ditampilkan
            {extraLinks > 0 ? ` (+${extraLinks} lainnya)` : ''}
          </p>
          <p className="text-white/40 text-xs mt-2">
            Ketuk node untuk menjelajahi artikel terkait
          </p>
        </div>
      </div>
    </div>
  );
}
