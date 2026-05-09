export interface Application {
  id?: string;
  fullName: string;
  roll: string;
  regNo: string;
  semester: string;
  shift: string;
  department: string;
  group: string;
  fatherName: string;
  motherName: string;
  dob: string;
  email: string;
  phone: string;
  whatsapp: string;
  motivationLetter: string;
  imageUrl?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}

export interface Message {
  id?: string;
  applicantId: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export type MascotState = 'neutral' | 'questioning' | 'persistent' | 'happy' | 'sad' | 'thinking' | 'excited' | 'pointing' | 'wave' | 'cool' | 'wink' | 'smiling' | 'grin';
