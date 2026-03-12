'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
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
  const { lang } = useLanguage();
  const { graphData, isLoading, totalLinks } = useNetworkGraph(articleTitle, lang);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Record<string, unknown> | null>(null);
  const [ForceGraph, setForceGraph] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    import('react-force-graph-2d').then((mod) => {
      setForceGraph(() => mod.default);
    });
  }, []);

  useEffect(() => {
    const update = () => {
      const wide = window.innerWidth > 768;
      setIsDesktop(wide);
      setDimensions({
        width: wide ? 430 : window.innerWidth,
        height: window.innerHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const [showNoUrl, setShowNoUrl] = useState(false);

  useEffect(() => {
    const fg = graphRef.current as Record<string, (...args: unknown[]) => unknown> | null;
    if (!fg) return;
    if (typeof fg.d3Force === 'function') {
      const charge = fg.d3Force('charge') as Record<string, (v: number) => unknown> | null;
      if (charge && typeof charge.strength === 'function') {
        charge.strength(-150);
      }
      const link = fg.d3Force('link') as Record<string, (v: number) => unknown> | null;
      if (link && typeof link.distance === 'function') {
        link.distance(45);
      }
    }
  }, [graphData]);

  useEffect(() => {
    if (!isLoading && graphData && graphData.nodes.length <= 1) {
      const timer = setTimeout(() => setShowNoUrl(true), 1500);
      return () => clearTimeout(timer);
    }
    setShowNoUrl(false);
  }, [isLoading, graphData]);

  const displayNodeCount = graphData?.nodes.length ?? 0;
  const extraLinks = totalLinks > 40 ? totalLinks - 40 : 0;

  const graphDataMemo = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };
    return {
      nodes: graphData.nodes.map((n) => ({ ...n })),
      links: graphData.links.map((l) => ({ ...l })),
    };
  }, [graphData]);

  const nodeCanvasObject = useCallback(
    (node: Record<string, unknown>, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x as number;
      const y = node.y as number;
      const label = (node.name as string) || '';
      const isCenter = node.isCenter as boolean;
      const isHovered = hoveredNode === node;
      const radius = isCenter ? (isHovered ? 10 : 8) : (isHovered ? 7 : 5);

      // Add a subtle glow if hovered
      if (isHovered) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isCenter ? '#FF6B35' : '#4ECDC4';
      ctx.fill();

      // Reset shadow for text
      ctx.shadowBlur = 0;

      const baseFontSize = isCenter ? 5 : 3.5;
      const fontSize = Math.max(baseFontSize, Math.min(baseFontSize, 14 / globalScale));
      ctx.font = `${(isCenter || isHovered) ? 'bold ' : ''}${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const maxChars = Math.max(10, Math.floor(40 / Math.max(globalScale * 0.3, 0.5)));
      const truncated = label.length > maxChars ? label.slice(0, maxChars) + '…' : label;

      ctx.fillStyle = isHovered ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)';
      const metrics = ctx.measureText(truncated);
      const pad = 1;
      ctx.fillRect(
        x - metrics.width / 2 - pad,
        y + radius + 1,
        metrics.width + pad * 2,
        fontSize + pad
      );

      ctx.fillStyle = isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.9)';
      ctx.fillText(truncated, x, y + radius + 1.5);
    },
    [hoveredNode]
  );

  const handleRef = useCallback((ref: unknown) => {
    graphRef.current = ref as Record<string, unknown>;
  }, []);

  if (isLoading || !ForceGraph) return <NetworkLoader />;

  if (!graphData || graphData.nodes.length <= 1) {
    if (!showNoUrl) return <NetworkLoader />;
    return (
      <div 
        className="fixed inset-y-0 left-1/2 -translate-x-1/2 z-40 bg-black flex flex-col items-center justify-center gap-4 fade-in"
        style={{
          width: '100%',
          maxWidth: '430px',
          borderLeft: isDesktop ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          borderRight: isDesktop ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        }}
      >
        <p className="text-white/60 text-sm">{lang === 'id' ? 'Artikel ini tidak memiliki tautan' : 'This article has no links'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-full text-sm font-medium text-black"
          style={{ background: 'var(--toggle-active)' }}
        >
          {lang === 'id' ? 'Kembali ke Reels' : 'Back to Reels'}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-y-0 left-1/2 -translate-x-1/2 z-40 bg-black fade-in overflow-hidden"
      style={{
        width: '100%',
        maxWidth: '430px',
        borderLeft: isDesktop ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        borderRight: isDesktop ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
      }}
    >
      <ForceGraph
        ref={handleRef}
        graphData={graphDataMemo}
        width={Math.min(dimensions.width, 430)}
        height={dimensions.height}
        nodeLabel={() => null}
        nodeCanvasObject={nodeCanvasObject}
        onNodeHover={(node: Record<string, unknown> | null) => setHoveredNode(node)}
        nodePointerAreaPaint={(node: Record<string, unknown>, color: string, ctx: CanvasRenderingContext2D) => {
          const x = node.x as number;
          const y = node.y as number;
          const r = (node.isCenter as boolean) ? 10 : 7;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={() => 'rgba(255,255,255,0.12)'}
        linkWidth={0.5}
        backgroundColor="#000000"
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={50}
        onNodeClick={(node: Record<string, unknown>) => {
          if (!node.isCenter) {
            onNodeClick(node.name as string);
          }
        }}
      />

      <div className="absolute bottom-6 left-4 right-4 z-10 flex justify-center">
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 w-full text-center">
          <p className="text-white font-semibold text-sm mb-1">{articleTitle}</p>
          <p className="text-white/50 text-xs">
            {displayNodeCount - 1} {lang === 'id' ? 'tautan ditampilkan' : 'links displayed'}
            {extraLinks > 0 ? (lang === 'id' ? ` (+${extraLinks} lainnya)` : ` (+${extraLinks} more)`) : ''}
          </p>
          <p className="text-white/40 text-xs mt-2">{lang === 'id' ? 'Ketuk node untuk menjelajahi artikel terkait' : 'Tap a node to explore related articles'}</p>
        </div>
      </div>
    </div>
  );
}
