export interface WikipediaSummary {
  type: string;
  title: string;
  displaytitle: string;
  description?: string;
  extract: string;
  extract_html: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls: {
    desktop: { page: string };
    mobile: { page: string };
  };
  lang: string;
  pageid: number;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  articleUrl: string;
  extract: string;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  audioUrl: string;
  duration: number;
}

export interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
  audiodownload: string;
  image: string;
  duration: number;
}

export interface ReelStyle {
  motionPreset: number;
  filterPreset: number;
  trackIndex: number;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

export interface GraphNode {
  id: string;
  name: string;
  thumbnail?: string | null;
  isCenter: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface MotionPreset {
  name: string;
  animation: string;
  duration: number;
}

export interface FilterPreset {
  name: string;
  css: string;
}
