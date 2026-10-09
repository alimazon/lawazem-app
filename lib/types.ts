// lib/types.ts

export type Stage = 'المرحلة الأولى' | 'المرحلة الثانية' | 'المرحلة الثالثة';

export type Group = 'A' | 'B';

export type ContentType = 'assignment' | 'lecture_note' | 'summary' | 'task';

export type Track = 'نظري' | 'عملي';

export type MedicalCategory =
  | 'general'
  | 'anatomy'
  | 'physiology'
  | 'pathology'
  | 'pharmacology'
  | 'microbiology'
  | 'biochemistry'
  | 'histology'
  | 'embryology'
  | 'immunology'
  | 'clinical';

export interface Subject {
  id: string;
  name: string;
  stage: Stage;
  units: number | null;
  created_at?: string;
}

export interface LectureNote {
  id: string;
  subject_id: string;
  title: string;
  professor_name: string | null;
  lecture_number: number | null;
  track: Track | null;
  tags: string[];
  year: number | null;
  group_name: Group | null;
  file_path: string;
  status?: string;
  created_at?: string;
  subjects?: { name: string } | null;
}

export type ReportReason = 'dead_link' | 'outdated';

export interface LectureNoteReport {
  id: string;
  lecture_note_id: string;
  reason: ReportReason;
  note: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_action: 'deleted' | 'ignored' | null;
  lecture_notes?: {
    id: string;
    title: string;
    subject_id: string;
    professor_name: string | null;
    year: number | null;
    file_path: string;
    subjects?: { name: string } | null;
  } | null;
}

export interface FileEntry {
  label: string | null;
  url: string;
}

export interface Channel {
  id: string;
  name: string;
  stage: Stage;
  description: string | null;
  telegram_link: string;
  channel_password: string | null;
  image_url: string | null;
  views: number;
  created_at?: string;
}

export interface ChannelContent {
  id: string;
  channel_id: string;
  content_type: ContentType;
  title: string;
  description: string | null;
  due_date: string | null;
  track: Track | null;
  tags: string[];
  file_urls: FileEntry[];
  folder: string | null;
  pinned: boolean;
  created_at?: string;
}

export interface Schedule {
  stage: Stage;
  image_url: string | null;
  updated_at?: string;
}

export interface ChannelListItem {
  id: string;
  name: string;
}

// ==================== Dictionary v2 ====================
export interface DictionaryDeepExplanation {
  overview: string;
  mechanism: string;
  clinical: string;
  confusions: string[];
  mnemonic: string | null;
}