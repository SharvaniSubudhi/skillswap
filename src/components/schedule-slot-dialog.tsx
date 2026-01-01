
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestSession } from "@/ai/flows/request-session";
import type { User } from "@/lib/types";
import { useFirebase } from "@/firebase";
import { serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection } from "firebase/firestore";

type RequestSessionInput = {
    teacher: { name: string, email: string };
    learner: { name: string, email: string, id: string };
    skill: string;
    sessionDetails: string;
    sessionId: string;
};

export function ScheduleSlotDialog({ user: teacher, currentUser: learner }: { user: User, currentUser: User | null }) {
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

        if (learner.credits < 1) {
            toast({
                variant: "destructive",
                title: "Insufficient Credits",
                description: "You do not have enough credits to book this session.",
            });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Session Record with 'requested' status
            const sessionData = {
                teacherId: teacher.id,
                learnerId: learner.id,
                skill: selectedSkill,
                duration: 1, // Assuming 1 hour for now
                creditsTransferred: 1, // Assuming 1 credit for 1 hour
                status: 'requested',
                sessionDate: serverTimestamp(), // This will be set on the server
                disputeRaised: false,
            };
            const sessionsCol = collection(firestore, "sessions");
            const newSessionRef = await addDocumentNonBlocking(sessionsCol, sessionData);

            // 2. Send notification to teacher via AI flow
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
                    description: "The teacher has been notified. Your credits will be deducted upon their acceptance.",
                });
                setIsOpen(false);
            } else {
                // If notification fails, we should ideally delete the session request.
                // For MVP, we'll show an error.
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
                <Button className="w-full mt-4">Schedule Slot</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Book a session with {teacher.name}</DialogTitle>
                    <DialogDescription>
                        Select a skill and a time slot. 1 credit will be transferred when the teacher accepts your request.
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
                                {teacher.skillsKnown?.map(skill => (
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
                                {teacher.availability?.map(slot => (
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
