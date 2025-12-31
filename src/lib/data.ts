import type { User, Session } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getAvatar = (id: string) => PlaceHolderImages.find(p => p.id === id)?.imageUrl || '';

export const users: User[] = [
  {
    id: '1',
    name: 'Anika Sharma',
    email: 'anika.sharma@edu.in',
    skillsKnown: [
      { skillName: 'Python', level: 'advanced' },
      { skillName: 'Data Analysis', level: 'intermediate' },
    ],
    skillsWanted: [
      { skillName: 'React', level: 'basic' },
      { skillName: 'Graphic Design', level: 'basic' },
    ],
    credits: 10,
    availability: [
      { day: 'Monday', timeSlot: '18:00 - 20:00' },
      { day: 'Wednesday', timeSlot: '19:00 - 21:00' },
    ],
    rating: 4.8,
    badges: ['Top Mentor', '5-Star Teacher'],
    status: 'online',
    avatarUrl: getAvatar('avatar-1'),
  },
  {
    id: '2',
    name: 'Rohan Verma',
    email: 'rohan.verma@edu.in',
    skillsKnown: [
      { skillName: 'React', level: 'advanced' },
      { skillName: 'Node.js', level: 'advanced' },
    ],
    skillsWanted: [
      { skillName: 'Python', level: 'intermediate' },
    ],
    credits: 5,
    availability: [
      { day: 'Tuesday', timeSlot: '17:00 - 19:00' },
      { day: 'Thursday', timeSlot: '18:00 - 20:00' },
    ],
    rating: 4.9,
    badges: ['5-Star Teacher', 'Fast Learner'],
    status: 'offline',
    avatarUrl: getAvatar('avatar-2'),
  },
  {
    id: '3',
    name: 'Priya Singh',
    email: 'priya.singh@edu.in',
    skillsKnown: [
      { skillName: 'Graphic Design', level: 'advanced' },
      { skillName: 'UI/UX Principles', level: 'intermediate' },
    ],
    skillsWanted: [
      { skillName: 'Photography', level: 'basic' },
    ],
    credits: 3,
    availability: [
      { day: 'Friday', timeSlot: '16:00 - 18:00' },
    ],
    rating: 4.7,
    badges: [],
    status: 'online',
    avatarUrl: getAvatar('avatar-3'),
  },
  {
    id: '4',
    name: 'Vikram Mehta',
    email: 'vikram.mehta@edu.in',
    skillsKnown: [
      { skillName: 'Photography', level: 'advanced' },
      { skillName: 'Video Editing', level: 'intermediate' },
    ],
    skillsWanted: [
      { skillName: 'Data Analysis', level: 'basic' },
    ],
    credits: 8,
    availability: [
      { day: 'Monday', timeSlot: '10:00 - 12:00' },
      { day: 'Wednesday', timeSlot: '10:00 - 12:00' },
    ],
    rating: 4.6,
    badges: ['Fast Learner'],
    status: 'offline',
    avatarUrl: getAvatar('avatar-4'),
  },
  {
    id: '5',
    name: 'Sameer Khan',
    email: 'sameer.khan@edu.in',
    skillsKnown: [
        { skillName: 'Public Speaking', level: 'advanced' },
        { skillName: 'Content Writing', level: 'intermediate' },
    ],
    skillsWanted: [
        { skillName: 'Node.js', level: 'basic' },
    ],
    credits: 4,
    availability: [
        { day: 'Saturday', timeSlot: '14:00 - 16:00' },
    ],
    rating: 4.9,
    badges: ['Top Mentor'],
    status: 'online',
    avatarUrl: getAvatar('avatar-5'),
  },
  {
    id: '6',
    name: 'Neha Reddy',
    email: 'neha.reddy@edu.in',
    skillsKnown: [
        { skillName: 'Java', level: 'advanced' },
        { skillName: 'Spring Boot', level: 'intermediate' },
    ],
    skillsWanted: [
        { skillName: 'React', level: 'intermediate' },
    ],
    credits: 7,
    availability: [
        { day: 'Sunday', timeSlot: '11:00 - 13:00' },
    ],
    rating: 4.8,
    badges: ['5-Star Teacher'],
    status: 'offline',
    avatarUrl: getAvatar('avatar-6'),
  },
];

export const currentUser = users[1]; // Let's assume Rohan Verma is the logged in user

export const sessions: Session[] = [
    {
        id: 's0',
        teacher: users[0], // Anika
        learner: users[4], // Sameer
        skill: 'Python',
        duration: 1,
        creditsTransferred: 1,
        status: 'requested',
        sessionDate: new Date("2024-08-26T18:00:00.000Z"),
        disputeRaised: false,
    },
    {
        id: 's1',
        teacher: users[0],
        learner: currentUser,
        skill: 'Python',
        duration: 1,
        creditsTransferred: 1,
        googleMeetLink: '#',
        status: 'scheduled',
        sessionDate: new Date("2024-08-15T10:00:00.000Z"),
        disputeRaised: false,
    },
    {
        id: 's2',
        teacher: currentUser,
        learner: users[3],
        skill: 'React',
        duration: 2,
        creditsTransferred: 2,
        googleMeetLink: '#',
        status: 'completed',
        sessionDate: new Date("2024-08-07T14:00:00.000Z"),
        feedback: 'Rohan is an amazing teacher! Explained React concepts very clearly.',
        rating: 5,
        disputeRaised: false,
    },
    {
        id: 's3',
        teacher: users[2],
        learner: currentUser,
        skill: 'Graphic Design',
        duration: 1,
        creditsTransferred: 1,
        googleMeetLink: '#',
        status: 'cancelled',
        sessionDate: new Date("2024-08-10T11:00:00.000Z"),
        disputeRaised: false,
    },
    {
        id: 's4',
        teacher: currentUser,
        learner: users[0],
        skill: 'Node.js',
        duration: 1,
        creditsTransferred: 1,
        googleMeetLink: '#',
        status: 'completed',
        sessionDate: new Date("2024-08-02T16:00:00.000Z"),
        feedback: 'Great session on Node.js fundamentals.',
        rating: 4,
        disputeRaised: false,
    }
];
