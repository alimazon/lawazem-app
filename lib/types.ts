// lib/types.ts

export type Stage = 'المرحلة الأولى' | 'المرحلة الثانية' | 'المرحلة الثالثة';

export type ContentType = 'assignment' | 'lecture_note' | 'summary' | 'task';

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
  file_path: string;
  status?: string;
  created_at?: string;
  subjects?: { name: string } | null;
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