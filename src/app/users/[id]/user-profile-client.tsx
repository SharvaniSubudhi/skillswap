
"use client";

import { users, sessions, currentUser } from "@/lib/data";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gem, Star, Award, Verified, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestSession } from "@/ai/flows/request-session";
import type { User } from "@/lib/types";

type RequestSessionInput = {
    teacher: { name: string, email: string };
    learner: { name: string, email: string };
    skill: string;
    sessionDetails: string;
};


const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
};

function BookSessionDialog({ user, children }: { user: User, children: React.ReactNode }) {
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

        setIsLoading(true);
        try {
            const input: RequestSessionInput = {
                teacher: { name: user.name, email: user.email },
                learner: { name: currentUser.name, email: currentUser.email },
                skill: selectedSkill,
                sessionDetails: selectedSlot,
            };

            const result = await requestSession(input);
            if (result.success) {
                toast({
                    title: "Request Sent!",
                    description: result.message,
                });
                // In a real app, you would update the state to show the new 'requested' session.
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
            <div onClick={() => setIsOpen(true)}>{children}</div>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Book a session with {user.name}</DialogTitle>
                    <DialogDescription>
                        Select a skill you want to learn and a time that works for you.
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
                                {user.skillsKnown.map(skill => (
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
                                {user.availability.map(slot => (
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
                        {isLoading ? "Sending Request..." : "Send Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function UserProfileClient({ user }: { user: User }) {
    const userSessionsAsTeacher = sessions.filter(s => s.teacher.id === user.id && s.status === 'completed' && s.feedback);

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
                         <BookSessionDialog user={user}>
                            <Button className="mt-6 w-full">Book Session</Button>
                        </BookSessionDialog>
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
                                                <Verified className="w-4 h-4 text-green-500" />
                                                <span className="font-medium">{skill.skillName}</span>
                                                <Badge variant="outline" className="capitalize">{skill.level}</Badge>
                                            </div>
                                        ))}
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
                                </div>
                            </div>
                        </TabsContent>
                         <TabsContent value="reviews" className="p-6">
                            <div>
                                <h3 className="text-lg font-medium font-headline flex items-center gap-2"><MessageSquare/> Session Feedback</h3>
                                <p className="text-sm text-muted-foreground">What learners are saying about {user.name}.</p>
                                <div className="mt-4 space-y-4">
                                    {userSessionsAsTeacher.map(s => (
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
                                    {userSessionsAsTeacher.length === 0 && (
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

