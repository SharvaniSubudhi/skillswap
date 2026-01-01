
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import type { Session, User } from "@/lib/types";
import { formatInTimeZone } from "date-fns-tz";
import { Video, Star, MessageSquare, AlertCircle, Check, X } from "lucide-react";
import { createSession } from "@/ai/flows/create-session";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc, collection, query, where, writeBatch, serverTimestamp, getDocs } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type CreateSessionInput = {
    teacher: { name: string, email: string };
    learner: { name: string, email: string };
    skill: string;
    sessionDate: string;
    duration: number;
};


const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
};

const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
};


const SessionCard = ({ session, currentUser }: { session: Session, currentUser: User | null }) => {
    const { toast } = useToast();
    const isTeacher = session.teacherId === currentUser?.id;

    // These user objects are partial, fetched from the session doc.
    const [teacher, setTeacher] = React.useState<any>(null);
    const [learner, setLearner] = React.useState<any>(null);
    const { firestore } = useFirebase();

    React.useEffect(() => {
        if (firestore && session) {
            const teacherRef = doc(firestore, 'users', session.teacherId);
            const learnerRef = doc(firestore, 'users', session.learnerId);

            getDoc(teacherRef).then(docSnap => {
                if (docSnap.exists()) setTeacher({id: docSnap.id, ...docSnap.data()});
            });
            getDoc(learnerRef).then(docSnap => {
                if (docSnap.exists()) setLearner({id: docSnap.id, ...docSnap.data()});
            });
        }
    }, [firestore, session]);

    const getFormattedDate = () => {
        if (!session.sessionDate) return "Date not set";
        const date = session.sessionDate.toDate ? session.sessionDate.toDate() : new Date(session.sessionDate);
        if (isNaN(date.getTime())) return "Invalid date";
        return formatInTimeZone(date, 'UTC', "EEEE, MMMM d, yyyy 'at' h:mm a zzz");
    }

    if (!teacher || !learner) return null; // Or a loading skeleton
    
    const otherUser = isTeacher ? learner : teacher;

    const handleJoinNow = async () => {
        if (session.googleMeetLink) {
            window.open(session.googleMeetLink, '_blank');
            return;
        }

        toast({
            title: 'Creating Google Meet link...',
            description: 'Please wait a moment.',
        });

        try {
            const sessionDate = session.sessionDate.toDate ? session.sessionDate.toDate() : new Date(session.sessionDate);
            const input: CreateSessionInput = {
                teacher: { name: teacher.name, email: teacher.email },
                learner: { name: learner.name, email: learner.email },
                skill: session.skill,
                sessionDate: sessionDate.toISOString(),
                duration: session.duration,
            };
            const result = await createSession(input);

            if (result.success && result.meetLink) {
                // Update session doc with the meet link
                const sessionRef = doc(firestore, 'sessions', session.id);
                updateDocumentNonBlocking(sessionRef, { googleMeetLink: result.meetLink });

                toast({
                    title: 'Meet link created!',
                    description: 'Redirecting you to the meeting.',
                });
                window.open(result.meetLink, '_blank');
            } else {
                throw new Error(result.message || 'Failed to create Meet link.');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not create the Google Meet link.',
            });
        }
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-lg">{session.skill}</CardTitle>
                        <CardDescription>
                            {getFormattedDate()}
                        </CardDescription>
                    </div>
                    <Badge className={`${statusColors[session.status]} border-0 capitalize`}>{session.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                    <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{otherUser.name}</p>
                    <p className="text-sm text-muted-foreground">{isTeacher ? 'Learner' : 'Teacher'}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {session.duration} hr session
                </div>
                {session.status === 'scheduled' && (
                    <Button onClick={handleJoinNow}>
                        <Video className="mr-2 h-4 w-4" /> Join Now
                    </Button>
                )}
                {session.status === 'completed' && !session.feedback && (
                    <Button variant="outline">
                        <Star className="mr-2 h-4 w-4" /> Rate Session
                    </Button>
                )}
                 {session.status === 'completed' && session.feedback && (
                    <Button variant="ghost" className="text-muted-foreground">
                        <MessageSquare className="mr-2 h-4 w-4" /> View Feedback
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};


const RequestCard = ({ session, currentUser }: { session: Session, currentUser: User | null }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const { firestore } = useFirebase();

    const [teacher, setTeacher] = React.useState<User | null>(null);
    const [learner, setLearner] = React.useState<User | null>(null);

     React.useEffect(() => {
        if (firestore && session) {
            const teacherRef = doc(firestore, 'users', session.teacherId);
            const learnerRef = doc(firestore, 'users', session.learnerId);

            getDoc(teacherRef).then(docSnap => {
                if (docSnap.exists()) setTeacher({id: docSnap.id, ...docSnap.data()} as User);
            });
            getDoc(learnerRef).then(docSnap => {
                if (docSnap.exists()) setLearner({id: docSnap.id, ...docSnap.data()} as User);
            });
        }
    }, [firestore, session]);

    const getFormattedDate = () => {
        if (!session.sessionDate) return "Date not set";
        // Firestore timestamps might not be converted to Date objects yet.
        const date = session.sessionDate.toDate ? session.sessionDate.toDate() : new Date(session.sessionDate);
        if (isNaN(date.getTime())) return "Invalid date";
        return formatInTimeZone(date, 'UTC', "EEEE, MMMM d, yyyy 'at' h:mm a zzz");
    }

    const handleAccept = async () => {
         if (!firestore || !learner || !teacher) return;
         setIsLoading(true);
         toast({
            title: 'Accepting Request...',
            description: 'Updating status and creating calendar event.',
        });
        try {
            // 1. Transaction to update credits and session status
            const learnerRef = doc(firestore, 'users', learner.id);
            const teacherRef = doc(firestore, 'users', teacher.id);
            const sessionRef = doc(firestore, 'sessions', session.id);

            const batch = writeBatch(firestore);

            // Deduct credits from learner, add to teacher
            batch.update(learnerRef, { credits: learner.credits - session.creditsTransferred });
            batch.update(teacherRef, { credits: teacher.credits + session.creditsTransferred });
            
            // Update session status to scheduled
            batch.update(sessionRef, { status: 'scheduled' });

            await batch.commit();

            toast({
                title: 'Request Accepted!',
                description: 'The session has been scheduled and credits transferred.',
            });

            // 2. Create calendar event and send notification
            const sessionDate = session.sessionDate.toDate ? session.sessionDate.toDate() : new Date(session.sessionDate);
            const input: CreateSessionInput = {
                teacher: { name: teacher.name, email: teacher.email },
                learner: { name: learner.name, email: learner.email },
                skill: session.skill,
                sessionDate: sessionDate.toISOString(),
                duration: session.duration,
            };
            const result = await createSession(input);
            
            if (result.success && result.meetLink) {
                 // 3. Update session with meet link
                updateDocumentNonBlocking(sessionRef, { googleMeetLink: result.meetLink });
            } else {
                // If this fails, we should ideally roll back the credit transfer.
                // For MVP, we'll show an error.
                throw new Error(result.message || 'Failed to create calendar event.');
            }
        } catch(error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Accepting Request',
                description: error.message || 'Could not accept the request.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // This simulates declining a request.
    const handleDecline = () => {
        if (!firestore) return;
        const sessionRef = doc(firestore, 'sessions', session.id);
        updateDocumentNonBlocking(sessionRef, { status: 'cancelled' });
        toast({
            title: 'Request Declined',
            description: `You have declined the session request.`
        });
    };
    
    if (!learner || !teacher) return null;

    return (
        <Card className="bg-secondary/50">
             <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-lg">{session.skill}</CardTitle>
                        <CardDescription>
                            From: {learner.name}
                        </CardDescription>
                    </div>
                     <Badge className={`${statusColors[session.status]} border-0 capitalize`}>{session.status}</Badge>
                </div>
            </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground">
                    Request for a {session.duration}-hour session on {getFormattedDate()}.
                </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleDecline} disabled={isLoading}><X className="mr-2 h-4 w-4"/>Decline</Button>
                <Button size="sm" onClick={handleAccept} disabled={isLoading}>
                    {isLoading ? 'Accepting...' : <><Check className="mr-2 h-4 w-4"/>Accept & Transfer Credit</>}
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function SessionsPage() {
    const { user: authUser, firestore } = useFirebase();
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    React.useEffect(() => {
        if(authUser && firestore) {
            const userDocRef = doc(firestore, "users", authUser.uid);
            getDoc(userDocRef).then(docSnap => {
                if(docSnap.exists()){
                    setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User)
                }
            })
        }
    }, [authUser, firestore]);
    
    const sessionsAsLearnerQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, "sessions"), where('learnerId', '==', authUser.uid));
    }, [firestore, authUser]);

    const sessionsAsTeacherQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(collection(firestore, "sessions"), where('teacherId', '==', authUser.uid));
    }, [firestore, authUser]);

    const { data: learnerSessions } = useCollection<Session>(sessionsAsLearnerQuery);
    const { data: teacherSessions } = useCollection<Session>(sessionsAsTeacherQuery);

    const allSessions = React.useMemo(() => {
        const combined = new Map<string, Session>();
        (learnerSessions || []).forEach(s => combined.set(s.id, s));
        (teacherSessions || []).forEach(s => combined.set(s.id, s));
        return Array.from(combined.values());
    }, [learnerSessions, teacherSessions]);
    
    const sessionRequests = allSessions.filter(s => s.status === 'requested' && currentUser && s.teacherId === currentUser.id);
    const scheduledSessions = allSessions.filter(s => s.status === 'scheduled');
    const completedSessions = allSessions.filter(s => s.status === 'completed');
    const cancelledSessions = allSessions.filter(s => s.status === 'cancelled');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Sessions</h1>
                <p className="text-muted-foreground">Manage your learning and teaching schedule.</p>
            </div>

            {sessionRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                        <AlertCircle className="text-accent" />
                        Pending Requests
                    </h2>
                     <div className="grid gap-4 md:grid-cols-2">
                        {sessionRequests.map(s => <RequestCard key={s.id} session={s} currentUser={currentUser} />)}
                    </div>
                </div>
            )}


            <Tabs defaultValue="scheduled" className="pt-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
                <TabsContent value="scheduled" className="mt-6">
                    {scheduledSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {scheduledSessions.sort((a,b) => b.sessionDate.toDate() - a.sessionDate.toDate()).map(s => <SessionCard key={s.id} session={s} currentUser={currentUser} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No scheduled sessions.</p>
                    )}
                </TabsContent>
                <TabsContent value="completed" className="mt-6">
                    {completedSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {completedSessions.sort((a,b) => b.sessionDate.toDate() - a.sessionDate.toDate()).map(s => <SessionCard key={s.id} session={s} currentUser={currentUser}/>)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No completed sessions.</p>
                    )}
                </TabsContent>
                <TabsContent value="cancelled" className="mt-6">
                    {cancelledSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {cancelledSessions.sort((a,b) => b.sessionDate.toDate() - a.sessionDate.toDate()).map(s => <SessionCard key={s.id} session={s} currentUser={currentUser} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No cancelled sessions.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
