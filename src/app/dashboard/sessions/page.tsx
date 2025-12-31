
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sessions } from "@/lib/data"; // Keep using mock sessions for now
import { useFirebase } from "@/firebase";
import type { Session, User } from "@/lib/types";
import { formatInTimeZone } from "date-fns-tz";
import { Video, Star, MessageSquare, AlertCircle, Check, X } from "lucide-react";
import { createSession } from "@/ai/flows/create-session";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";

type CreateSessionInput = {
    teacher: { name: string, email: string };
    learner: { name: string, email: string };
    skill: string;
    sessionDate: string;
    duration: number;
};


const getInitials = (name: string) => {
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
    const isTeacher = session.teacher.id === currentUser?.id;
    const otherUser = isTeacher ? session.learner : session.teacher;

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
            const input: CreateSessionInput = {
                teacher: { name: session.teacher.name, email: session.teacher.email },
                learner: { name: session.learner.name, email: session.learner.email },
                skill: session.skill,
                sessionDate: session.sessionDate.toISOString(),
                duration: session.duration,
            };
            const result = await createSession(input);

            if (result.success && result.meetLink) {
                session.googleMeetLink = result.meetLink; // Update session object for immediate use
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
                            {formatInTimeZone(session.sessionDate, 'UTC', "EEEE, MMMM d, yyyy 'at' h:mm a zzz")}
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


const RequestCard = ({ session }: { session: Session }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    // This simulates accepting a request. In a real app, this would update the backend.
    const handleAccept = async () => {
         setIsLoading(true);
         toast({
            title: 'Accepting Request...',
            description: 'Creating calendar event and sending notifications.',
        });
        try {
            const input: CreateSessionInput = {
                teacher: { name: session.teacher.name, email: session.teacher.email },
                learner: { name: session.learner.name, email: session.learner.email },
                skill: session.skill,
                sessionDate: session.sessionDate.toISOString(),
                duration: session.duration,
            };
            const result = await createSession(input);

            if (result.success) {
                toast({
                    title: 'Request Accepted!',
                    description: 'The session has been scheduled.',
                });
                // Here you would typically refetch data or update state to move this card
                // from 'requested' to 'scheduled'. For now, we'll just show the toast.
            } else {
                throw new Error(result.message || 'Failed to accept the request.');
            }
        } catch(error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not accept the request.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // This simulates declining a request.
    const handleDecline = () => {
        toast({
            title: 'Request Declined',
            description: `You have declined the session with ${session.learner.name}.`
        });
    };

    return (
        <Card className="bg-secondary/50">
             <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-lg">{session.skill}</CardTitle>
                        <CardDescription>
                            From: {session.learner.name}
                        </CardDescription>
                    </div>
                     <Badge className={`${statusColors[session.status]} border-0 capitalize`}>{session.status}</Badge>
                </div>
            </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground">
                    Request for a {session.duration}-hour session on {formatInTimeZone(session.sessionDate, 'UTC', "EEEE, MMMM d, yyyy 'at' h:mm a zzz")}.
                </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleDecline} disabled={isLoading}><X className="mr-2 h-4 w-4"/>Decline</Button>
                <Button size="sm" onClick={handleAccept} disabled={isLoading}>
                    {isLoading ? 'Accepting...' : <><Check className="mr-2 h-4 w-4"/>Accept</>}
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function SessionsPage() {
    const { user, firestore } = useFirebase();
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    React.useEffect(() => {
        if(user && firestore) {
            const userDocRef = doc(firestore, "users", user.uid);
            getDoc(userDocRef).then(docSnap => {
                if(docSnap.exists()){
                    setCurrentUser(docSnap.data() as User)
                }
            })
        }
    }, [user, firestore])


    const sessionRequests = sessions.filter(s => currentUser && s.status === 'requested' && s.teacher.id === currentUser.id);
    const scheduledSessions = sessions.filter(s => currentUser && s.status === 'scheduled' && (s.learner.id === currentUser.id || s.teacher.id === currentUser.id));
    const completedSessions = sessions.filter(s => currentUser && s.status === 'completed' && (s.learner.id === currentUser.id || s.teacher.id === currentUser.id));
    const cancelledSessions = sessions.filter(s => currentUser && s.status === 'cancelled' && (s.learner.id === currentUser.id || s.teacher.id === currentUser.id));

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
                        {sessionRequests.map(s => <RequestCard key={s.id} session={s} />)}
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
                            {scheduledSessions.map(s => <SessionCard key={s.id} session={s} currentUser={currentUser} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No scheduled sessions.</p>
                    )}
                </TabsContent>
                <TabsContent value="completed" className="mt-6">
                    {completedSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {completedSessions.map(s => <SessionCard key={s.id} session={s} currentUser={currentUser}/>)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No completed sessions.</p>
                    )}
                </TabsContent>
                <TabsContent value="cancelled" className="mt-6">
                    {cancelledSessions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {cancelledSessions.map(s => <SessionCard key={s.id} session={s} currentUser={currentUser} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">No cancelled sessions.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
