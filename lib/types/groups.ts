// lib/types/groups.ts

export type Gender = 'male' | 'female';
export type GroupStatus = 'open' | 'full' | 'closed' | 'cancelled';
export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface Student {
  id: string;
  telegram_username: string;
  full_name: string;
  gender: Gender;
  study_year: string;
  status: 'active' | 'inactive';
  registered_at: string;
}

export interface Group {
  id: string;
  code: string;
  serial: number;
  name: string | null;
  leader_id: string | null;
  target_size: number;
  male_count: number;
  female_count: number;
  status: GroupStatus;
  study_year: string;
  practical_group: string | null; // 👈 أضف هذا السطر
  created_at: string;
}

export interface Member {
  id: string;
  group_id: string;
  student_id: string;
  role: 'leader' | 'member';
  joined_at: string;
}

export interface JoinRequest {
  id: string;
  student_id: string;
  group_id: string;
  status: RequestStatus;
  created_at: string;
  processed_at: string | null;
}

export interface NotificationRow {
  id: string;
  student_id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Settings {
  id: number;
  target_size: number;
  preferred_male: number;
  preferred_female: number;
  registration_open: boolean;
  allow_create: boolean;
  allow_join: boolean;
  session_expires_at: string | null;
  updated_at: string;
}

// Types مع بيانات مدمجة (joins)
export interface GroupWithLeader extends Group {
  leader?: Pick<Student, 'id' | 'full_name' | 'telegram_username'> | null;
}

export interface MemberWithStudent extends Member {
  student: Student;
}

export interface RequestWithStudent extends JoinRequest {
  student: Student;
}

export interface RequestWithGroup extends JoinRequest {
  group: Group;
}

// Types للردود
export interface MeResponse {
  student: Student;
  group: Group | null;
  membership: Member | null;
  members: MemberWithStudent[]; // فقط إذا كان عضواً
  isLeader: boolean;
  pendingRequests: number; // عدد طلبات معلّقة (للقائد فقط)
}

// أضف هذا في نهاية الملف
export interface PublicMember {
  id: string;
  full_name: string;
  telegram_username: string;
  gender: string;
  role: string;
}

export interface PublicGroup extends Group {
  leader_name: string | null;
  leader_username: string | null;
  spots_left: number;
  members?: PublicMember[]; // 👈 إضافة قائمة الأعضاء
}