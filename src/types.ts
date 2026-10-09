export interface ScriptItem {
  id: string;
  fileName: string;
  category: 'bridge' | 'lore' | 'refiner' | 'utility' | 'helper' | 'archive';
  tag: string;
  fileSize: number;
  lineCount: number;
  metaName: string;
  version: string;
  description: string;
  author: string;
  matches: string[];
  requires: string[];
}

export interface LoreEntry {
  id: string;
  keys: string[];
  content: string;
  priority: number;
  scope: 'global' | 'character' | 'scene';
  matchType: 'contains' | 'exact' | 'regex';
  enabled: boolean;
  notes?: string;
}

export interface RefinerRule {
  id: string;
  name: string;
  description: string;
  category: 'formatting' | 'dialogue' | 'roleplay' | 'custom';
  pattern: string;
  replacement: string;
  enabled: boolean;
  isRegex: boolean;
}

export interface BookmarkItem {
  id: string;
  text: string;
  color: string; // hex
  note: string;
  createdAt: string;
  tags: string[];
}

export interface KeywordNoteItem {
  id: string;
  keyword: string;
  summary: string;
  frequency: number;
  updatedAt: string;
}
