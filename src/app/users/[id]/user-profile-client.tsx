

"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Verified, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import type { User, Session } from "@/lib/types";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleSlotDialog } from "@/components/schedule-slot-dialog";


const getInitials = (name: string = "") => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
};

export function UserProfileClient({ userId }: { userId: string }) {
    const { user: authUser, firestore } = useFirebase();
    
    const currentUserDocRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: currentUser } = useDoc<User>(currentUserDocRef);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !userId) return null;
        return doc(firestore, 'users', userId);
    }, [firestore, userId]);

    const { data: user, isLoading, error } = useDoc<User>(userDocRef);

    const sessionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "sessions"), 
            where('teacherId', '==', user.id),
            where('status', '==', 'completed'),
            where('feedback', '!=', null)
        );
    }, [firestore, user]);

    const { data: userSessionsAsTeacher } = useCollection<Session>(sessionsQuery);


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
                            {user.badges?.map(badge => (
                                <Badge key={badge} variant="secondary" className="gap-1">
                                    <Award className="w-3 h-3"/> {badge}
                                </Badge>
                            ))}
                        </div>
                         <ScheduleSlotDialog user={user} currentUser={currentUser} />
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
                                        {user.skillsKnown?.map(skill => (
                                            <div key={skill.skillName} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                                                {skill.isVerified ? <Verified className="w-4 h-4 text-green-500" /> : <Verified className="w-4 h-4 text-muted-foreground/50" />}
                                                <span className="font-medium">{skill.skillName}</span>
                                                <Badge variant="outline" className="capitalize">{skill.level}</Badge>
                                            </div>
                                        ))}
                                        {user.skillsKnown?.length === 0 && <p className="text-xs text-muted-foreground text-center">No skills to teach yet.</p>}
                                    </div>
                                </div>
                                <div className="pt-6 border-t">
                                    <h3 className="text-lg font-medium font-headline">Skills to Learn</h3>
                                     <div className="mt-4 space-y-3">
                                        {user.skillsWanted?.map(skill => (
                                            <div key={skill.skillName} className="flex items-center p-3 bg-secondary rounded-lg">
                                               <span className="font-medium">{skill.skillName}</span>
                                            </div>
                                        ))}
                                        {user.skillsWanted?.length === 0 && <p className="text-xs text-muted-foreground text-center">No skills to learn yet.</p>}
                                    </div>
                                </div>
                             </div>
                        </TabsContent>
                        <TabsContent value="availability" className="p-6">
                            <div>
                                <h3 className="text-lg font-medium font-headline flex items-center gap-2"><Calendar/> Weekly Availability</h3>
                                <p className="text-sm text-muted-foreground">Available time slots for booking.</p>
                                <div className="mt-4 space-y-3">
                                    {user.availability?.map(slot => (
                                        <div key={`${slot.day}-${slot.timeSlot}`} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                            <span className="font-semibold">{slot.day}</span>
                                            <span className="text-muted-foreground">{slot.timeSlot}</span>
                                        </div>
                                    ))}
                                    {user.availability?.length === 0 && <p className="text-xs text-muted-foreground text-center pt-4">No available slots.</p>}
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
                                                    <p className="text-sm text-muted-foreground">Review for: {s.skill}</p>
                                                </div>
                                                 <div className="flex items-center gap-1">
                                                    {[...Array(s.rating || 0)].map((_, i) => (
                                                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2 italic">"{s.feedback}"</p>
                                            <p className="text-xs text-muted-foreground text-right mt-2">{format(new Date(s.sessionDate), "MMMM d, yyyy")}</p>
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
