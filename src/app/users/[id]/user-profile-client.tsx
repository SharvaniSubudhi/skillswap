
"use client";

import { sessions } from "@/lib/data";
import * as React from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gem, Star, Award, Verified, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestSession } from "@/ai/flows/request-session";
import type { User, Session } from "@/lib/types";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, getDoc, addDoc, collection, updateDoc, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";


type RequestSessionInput = {
    teacher: { name: string, email: string };
    learner: { name: string, email: string, id: string };
    skill: string;
    sessionDetails: string;
    sessionId: string;
};


const getInitials = (name: string = "") => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
};

function BookSessionDialog({ user: teacher, currentUser: learner }: { user: User, currentUser: User | null }) {
    const { firestore } = useFirebase();
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedSkill, setSelectedSkill] = React.useState('');
    const [selectedSlot, setSelectedSlot] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    const handleBooking = async () => {
        if (!selectedSkill || !selectedSlot) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please select a skill and a time slot.",
            });
            return;
        }

        if (!learner || !firestore) {
             toast({
                variant: "destructive",
                title: "Not Authenticated",
                description: "You must be logged in to book a session.",
            });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Session Record
            const sessionData = {
                teacherId: teacher.id,
                learnerId: learner.id,
                skill: selectedSkill,
                duration: 1, // Assuming 1 hour for now
                creditsTransferred: 1, // Assuming 1 credit for 1 hour
                status: 'requested',
                sessionDate: serverTimestamp(), // Placeholder, should be derived from slot
                disputeRaised: false,
            };
            const sessionsCol = collection(firestore, "sessions");
            const newSessionRef = await addDocumentNonBlocking(sessionsCol, sessionData);

            // 2. Transfer Credits (Deduct from learner)
            const learnerDocRef = doc(firestore, 'users', learner.id);
            await updateDoc(learnerDocRef, {
                credits: learner.credits - 1
            });
            
            // 3. Send notification to teacher
            const input: RequestSessionInput = {
                teacher: { name: teacher.name, email: teacher.email },
                learner: { name: learner.name, email: learner.email, id: learner.id },
                skill: selectedSkill,
                sessionDetails: selectedSlot,
                sessionId: newSessionRef.id
            };

            const result = await requestSession(input);
            if (result.success) {
                toast({
                    title: "Request Sent!",
                    description: result.message,
                });
                setIsOpen(false);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Booking Failed",
                description: error.message || "There was a problem requesting the session.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="mt-6 w-full">Book Session</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Book a session with {teacher.name}</DialogTitle>
                    <DialogDescription>
                        Select a skill you want to learn and a time that works for you. 1 credit will be deducted upon request.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="skill">Skill to Learn</Label>
                        <Select onValueChange={setSelectedSkill} defaultValue={selectedSkill}>
                            <SelectTrigger id="skill">
                                <SelectValue placeholder="Select a skill..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teacher.skillsKnown.map(skill => (
                                    <SelectItem key={skill.skillName} value={skill.skillName}>{skill.skillName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="availability">Available Slots</Label>
                         <Select onValueChange={setSelectedSlot} defaultValue={selectedSlot}>
                            <SelectTrigger id="availability">
                                <SelectValue placeholder="Select a time slot..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teacher.availability.map(slot => (
                                    <SelectItem key={`${slot.day}-${slot.timeSlot}`} value={`${slot.day} at ${slot.timeSlot}`}>
                                        {slot.day} - {slot.timeSlot}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleBooking} disabled={isLoading}>
                        {isLoading ? "Sending Request..." : "Send Request (1 Credit)"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function UserProfileClient({ userId }: { userId: string }) {
    const { user: authUser, firestore } = useFirebase();
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !userId) return null;
        return doc(firestore, 'users', userId);
    }, [firestore, userId]);

    const { data: user, isLoading, error } = useDoc<User>(userDocRef);

    const userSessionsAsTeacher = sessions.filter(s => user && s.teacher.id === user.id && s.status === 'completed' && s.feedback);

    React.useEffect(() => {
        if(authUser && firestore) {
            const userDocRef = doc(firestore, "users", authUser.uid);
            getDoc(userDocRef).then(docSnap => {
                if(docSnap.exists()){
                    setCurrentUser({...(docSnap.data() as Omit<User, 'id'>), id: docSnap.id})
                }
            })
        }
    }, [authUser, firestore])

    if (isLoading) {
        return (
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 md:items-start">
                    <Skeleton className="w-full h-96 md:w-1/3 lg:w-1/4" />
                    <Skeleton className="flex-1 h-96" />
                </div>
            </div>
        )
    }

    if (!user || error) {
        notFound();
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
                <Card className="w-full md:w-1/3 lg:w-1/4">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 mb-4">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-bold font-headline">{user.name}</h2>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                <span className="font-semibold">{user.rating}</span>
                            </div>
                            <div className={`w-2.5 h-2.5 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-sm text-muted-foreground capitalize">{user.status}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {user.badges.map(badge => (
                                <Badge key={badge} variant="secondary" className="gap-1">
                                    <Award className="w-3 h-3"/> {badge}
                                </Badge>
                            ))}
                        </div>
                         <BookSessionDialog user={user} currentUser={currentUser} />
                    </CardContent>
                </Card>

                <Card className="flex-1">
                    <Tabs defaultValue="skills">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="skills">Skills</TabsTrigger>
                            <TabsTrigger value="availability">Availability</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        </TabsList>
                        <TabsContent value="skills" className="p-6">
                             <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium font-headline">Skills to Teach</h3>
                                    <div className="mt-4 space-y-3">
                                        {user.skillsKnown.map(skill => (
                                            <div key={skill.skillName} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                                                {skill.isVerified ? <Verified className="w-4 h-4 text-green-500" /> : <Verified className="w-4 h-4 text-muted-foreground/50" />}
                                                <span className="font-medium">{skill.skillName}</span>
                                                <Badge variant="outline" className="capitalize">{skill.level}</Badge>
                                            </div>
                                        ))}
                                        {user.skillsKnown.length === 0 && <p className="text-xs text-muted-foreground text-center">No skills to teach yet.</p>}
                                    </div>
                                </div>
                                <div className="pt-6 border-t">
                                    <h3 className="text-lg font-medium font-headline">Skills to Learn</h3>
                                     <div className="mt-4 space-y-3">
                                        {user.skillsWanted.map(skill => (
                                            <div key={skill.skillName} className="flex items-center p-3 bg-secondary rounded-lg">
                                               <span className="font-medium">{skill.skillName}</span>
                                            </div>
                                        ))}
                                        {user.skillsWanted.length === 0 && <p className="text-xs text-muted-foreground text-center">No skills to learn yet.</p>}
                                    </div>
                                </div>
                             </div>
                        </TabsContent>
                        <TabsContent value="availability" className="p-6">
                            <div>
                                <h3 className="text-lg font-medium font-headline flex items-center gap-2"><Calendar/> Weekly Availability</h3>
                                <p className="text-sm text-muted-foreground">Available time slots for booking.</p>
                                <div className="mt-4 space-y-3">
                                    {user.availability.map(slot => (
                                        <div key={`${slot.day}-${slot.timeSlot}`} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                            <span className="font-semibold">{slot.day}</span>
                                            <span className="text-muted-foreground">{slot.timeSlot}</span>
                                        </div>
                                    ))}
                                    {user.availability.length === 0 && <p className="text-xs text-muted-foreground text-center pt-4">No available slots.</p>}
                                </div>
                            </div>
                        </TabsContent>
                         <TabsContent value="reviews" className="p-6">
                            <div>
                                <h3 className="text-lg font-medium font-headline flex items-center gap-2"><MessageSquare/> Session Feedback</h3>
                                <p className="text-sm text-muted-foreground">What learners are saying about {user.name}.</p>
                                <div className="mt-4 space-y-4">
                                    {userSessionsAsTeacher && userSessionsAsTeacher.map(s => (
                                        <div key={s.id} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={s.learner.avatarUrl} alt={s.learner.name} />
                                                        <AvatarFallback>{getInitials(s.learner.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-sm">{s.learner.name}</p>
                                                        <p className="text-xs text-muted-foreground">For: {s.skill}</p>
                                                    </div>
                                                </div>
                                                 <div className="flex items-center gap-1">
                                                    {[...Array(s.rating || 0)].map((_, i) => (
                                                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2 italic">"{s.feedback}"</p>
                                            <p className="text-xs text-muted-foreground text-right mt-2">{format(s.sessionDate, "MMMM d, yyyy")}</p>
                                        </div>
                                    ))}
                                    {(!userSessionsAsTeacher || userSessionsAsTeacher.length === 0) && (
                                        <p className="text-center text-muted-foreground py-8">No reviews yet.</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}

    
