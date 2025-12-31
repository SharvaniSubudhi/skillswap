
export type Skill = {
  skillName: string;
  level: 'basic' | 'intermediate' | 'advanced';
};

export type Availability = {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: string; // e.g., "09:00 - 10:00"
};

export type User = {
  id: string;
  name: string;
  email: string;
  skillsKnown: Skill[];
  skillsWanted: Skill[];
  credits: number;
  availability: Availability[];
  rating: number; // e.g., 4.5
  badges: string[]; // e.g., ["Top Mentor", "Fast Learner"]
  status: 'online' | 'offline';
  avatarUrl: string;
  studentIdProof?: string;
};

export type Session = {
  id: string;
  teacher: User;
  learner: User;
  skill: string;
  duration: number; // in hours
  creditsTransferred: number;
  googleMeetLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'requested';
  feedback?: string;
  rating?: number;
  disputeRaised: boolean;
  sessionDate: Date;
};

export type Dispute = {
    id: string;
    sessionId: string;
    raisedBy: string; // user id
    reason: string;
    status: 'open' | 'resolved' | 'rejected';
    resolution?: string;
    createdAt: Date;
}
