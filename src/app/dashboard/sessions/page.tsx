
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
import { Video, Star, MessageSquare, AlertCircle, Check, X, LogOut, Clock } from "lucide-react";
import { createSession } from "@/ai/flows/create-session";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc, collection, query, where } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

type CreateSessionInput = {
    sessionId: string;
};


const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
};

const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    ongoing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
};


const SessionCard = ({ session, currentUser }: { session: Session, currentUser: User | null }) => {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const isTeacher = session.teacherId === currentUser?.id;
    const [teacher, setTeacher] = React.useState<any>(null);
    const [learner, setLearner] = React.useState<any>(null);
    const [showCountdown, setShowCountdown] = React.useState(false);
    const [countdown, setCountdown] = React.useState("");
    const [isJoining, setIsJoining] = React.useState(false);

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

     const calculateCountdown = React.useCallback(() => {
        if (!session.sessionDate) return;
        const now = new Date().getTime();
        const startTime = session.sessionDate.toDate().getTime();
        const distance = startTime - now;

        if (distance < 0) {
            setCountdown("Session has started!");
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        let countdownString = "";
        if (days > 0) countdownString += `${days}d `;
        if (hours > 0) countdownString += `${hours}h `;
        if (minutes > 0) countdownString += `${minutes}m `;
        countdownString += `${seconds}s`;

        setCountdown(countdownString);
    }, [session.sessionDate]);

    React.useEffect(() => {
        if (showCountdown) {
            calculateCountdown();
            const interval = setInterval(calculateCountdown, 1000);
            return () => clearInterval(interval);
        }
    }, [showCountdown, calculateCountdown]);


    const getFormattedDate = () => {
        if (!session.sessionDate) return "Date not set";
        const date = session.sessionDate?.toDate ? session.sessionDate.toDate() : new Date(session.sessionDate);
        if (isNaN(date.getTime())) return "Invalid date";
        return formatInTimeZone(date, 'UTC', "EEEE, MMMM d, yyyy 'at' h:mm a zzz");
    }
    
    const handleJoinNow = async () => {
        if (!firestore) return;
    
        const now = new Date();
        const startTime = session.sessionDate.toDate();
    
        if (now < startTime) {
            setShowCountdown(true);
            return;
        }
    
        setIsJoining(true);
    
        try {
            let meetLink = session.googleMeetLink;
    
            // 1. If link doesn't exist, only the teacher can create it.
            if (!meetLink) {
                if (isTeacher) {
                    toast({ title: 'Creating meeting room...', description: 'Please wait a moment.' });
                    const sessionInput: CreateSessionInput = { sessionId: session.id };
                    const sessionResult = await createSession(sessionInput);
    
                    if (!sessionResult.success || !sessionResult.meetLink) {
                        throw new Error(sessionResult.message || 'Failed to create Google Meet link.');
                    }
                    meetLink = sessionResult.meetLink;
                    
                    // 2. Save the newly created link and update status to ongoing
                    const sessionRef = doc(firestore, 'sessions', session.id);
                    await updateDoc(sessionRef, { 
                        googleMeetLink: meetLink,
                        status: 'ongoing'
                    });
                } else {
                    // Learner tries to join before teacher has created the link
                    toast({
                        variant: 'destructive',
                        title: 'Not ready yet',
                        description: 'The teacher has not started the session. Please try again shortly.',
                    });
                    setIsJoining(false);
                    return;
                }
            } else {
                 // If link exists, just update status to ongoing if it's not already
                 if (session.status !== 'ongoing') {
                    const sessionRef = doc(firestore, 'sessions', session.id);
                    await updateDoc(sessionRef, { status: 'ongoing' });
                }
            }
    
            // 3. Redirect user to the meeting link
            window.open(meetLink, '_blank');
    
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Joining Session',
                description: error.message || 'Could not join the session.',
            });
        } finally {
            setIsJoining(false);
        }
    };
    
    const handleEndSession = async () => {
        if (!firestore) return;
        try {
            const sessionRef = doc(firestore, 'sessions', session.id);
            updateDocumentNonBlocking(sessionRef, { status: 'completed' });
            toast({
                title: 'Session Ended',
                description: 'The session has been marked as complete.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Ending Session',
                description: error.message || 'Could not end the session.',
            });
        }
    };

    if (!teacher || !learner) return null; // Or a loading skeleton
    
    const otherUser = isTeacher ? learner : teacher;

    return (
        <>
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
                    {['scheduled', 'ongoing'].includes(session.status) && (
                        <div className="flex gap-2">
                             {isTeacher && session.status === 'ongoing' && (
                                <Button variant="destructive" size="sm" onClick={handleEndSession}>
                                    <LogOut className="mr-2 h-4 w-4" /> End Session
                                </Button>
                            )}
                            <Button onClick={handleJoinNow} disabled={isJoining}>
                                <Video className="mr-2 h-4 w-4" /> 
                                {isJoining ? 'Joining...' : 'Join Now'}
                            </Button>
                        </div>
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

            <Dialog open={showCountdown} onOpenChange={setShowCountdown}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Session Not Started Yet</DialogTitle>
                        <DialogDescription>
                            Your session is scheduled to begin soon.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8 flex flex-col items-center justify-center gap-4">
                        <Clock className="w-16 h-16 text-primary" />
                        <p className="text-2xl font-bold font-mono">{countdown}</p>
                        <p className="text-muted-foreground">The "Join Now" button will work once the session starts.</p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
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
        const date = session.sessionDate?.toDate ? session.sessionDate.toDate() : new Date(session.sessionDate);
        if (isNaN(date.getTime())) return "Invalid date";
        return formatInTimeZone(date, 'UTC', "EEEE, MMMM d, yyyy 'at' h:mm a zzz");
    }

    const handleAccept = async () => {
         if (!firestore || !learner || !teacher) return;
         setIsLoading(true);
         toast({
            title: 'Accepting Request...',
            description: 'Scheduling session.',
        });
        try {
            // Update session status to 'scheduled'. The Meet link will be created
            // by the teacher when they click "Join Now".
            const sessionRef = doc(firestore, 'sessions', session.id);
            updateDocumentNonBlocking(sessionRef, { 
                status: 'scheduled',
            });

            // The learner's credits are deducted when they send the request.
            // The teacher's credits are awarded upon session completion.
            // So, no credit transaction happens here.

            toast({
                title: 'Request Accepted!',
                description: 'The session has been scheduled.',
            });

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
    
    const handleDecline = () => {
        if (!firestore || !learner) return;
        
        const sessionRef = doc(firestore, 'sessions', session.id);
        updateDocumentNonBlocking(sessionRef, { status: 'cancelled' });

        // Return credits to the learner
        const learnerRef = doc(firestore, 'users', learner.id);
        getDoc(learnerRef).then(docSnap => {
            if (docSnap.exists()) {
                const currentCredits = docSnap.data().credits || 0;
                updateDocumentNonBlocking(learnerRef, { credits: currentCredits + session.creditsTransferred });
            }
        });

        toast({
            title: 'Request Declined',
            description: `You have declined the session request. The credits have been returned to the learner.`
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
                    {isLoading ? 'Accepting...' : <><Check className="mr-2 h-4 w-4"/>Accept Request</>}
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
    const scheduledSessions = allSessions.filter(s => ['scheduled', 'ongoing'].includes(s.status));
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
                    <TabsTrigger value="scheduled">Scheduled & Ongoing</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
                <TabsContent value="scheduled" className="mt-6">
                    {scheduledSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {scheduledSessions.sort((a,b) => ((a.sessionDate?.toDate()?.getTime() || 0) - (b.sessionDate?.toDate()?.getTime() || 0))).map(s => <SessionCard key={s.id} session={s} currentUser={currentUser} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No scheduled sessions.</p>
                    )}
                </TabsContent>
                <TabsContent value="completed" className="mt-6">
                    {completedSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {completedSessions.sort((a,b) => ((b.sessionDate?.toDate()?.getTime() || 0) - (a.sessionDate?.toDate()?.getTime() || 0))).map(s => <SessionCard key={s.id} session={s} currentUser={currentUser}/>)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No completed sessions.</p>
                    )}
                </TabsContent>
                <TabsContent value="cancelled" className="mt-6">
                    {cancelledSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {cancelledSessions.sort((a,b) => ((b.sessionDate?.toDate()?.getTime() || 0) - (a.sessionDate?.toDate()?.getTime() || 0))).map(s => <SessionCard key={s.id} session={s} currentUser={currentUser} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No cancelled sessions.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

    