
"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirebase } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gem, Star, Award, Verified, X, CalendarPlus, CheckCircle, BookOpen } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { generateSkillQuiz, type GenerateSkillQuizOutput } from "@/ai/flows/skill-verification-quiz";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


const skillKnownSchema = z.object({
    skillName: z.string().min(1, "Skill name is required"),
    level: z.enum(["basic", "intermediate", "advanced"]),
    isVerified: z.boolean().optional(),
});

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    skillsKnown: z.array(skillKnownSchema),
    skillsWanted: z.array(z.object({
        skillName: z.string().min(1, "Skill name is required"),
    })),
    availability: z.array(z.object({
        day: z.string().min(1, "Day is required"),
        timeSlot: z.string().min(1, "Time slot is required"),
    })),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type SkillLevel = "basic" | "intermediate" | "advanced";

const getInitials = (name: string = "") => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ProfilePage() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [userProfile, setUserProfile] = React.useState<any>(null);
    const [newSkillName, setNewSkillName] = React.useState("");
    const [newSkillLevel, setNewSkillLevel] = React.useState<SkillLevel>("basic");
    const [newWantedSkill, setNewWantedSkill] = React.useState("");
    const [newAvailabilityDay, setNewAvailabilityDay] = React.useState("");
    const [newAvailabilityTime, setNewAvailabilityTime] = React.useState("");

    const [isVerifying, setIsVerifying] = React.useState(false);
    const [quiz, setQuiz] = React.useState<GenerateSkillQuizOutput & { skillName: string } | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            email: "",
            skillsKnown: [],
            skillsWanted: [],
            availability: [],
        },
    });

    const { fields: skillsKnownFields, append: appendSkillKnown, remove: removeSkillKnown, update: updateSkillKnown } = useFieldArray({
        control: form.control,
        name: "skillsKnown",
    });

    const { fields: skillsWantedFields, append: appendSkillWanted, remove: removeSkillWanted } = useFieldArray({
        control: form.control,
        name: "skillsWanted",
    });

    const { fields: availabilityFields, append: appendAvailability, remove: removeAvailability } = useFieldArray({
        control: form.control,
        name: "availability",
    });

    React.useEffect(() => {
        if (user && firestore) {
            const userDocRef = doc(firestore, "users", user.uid);
            getDoc(userDocRef).then((docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserProfile(data);
                    form.reset({
                        name: data.name || "",
                        email: data.email || "",
                        skillsKnown: data.skillsKnown || [],
                        skillsWanted: data.skillsWanted || [],
                        availability: data.availability || [],
                    });
                }
                setIsLoading(false);
            });
        }
    }, [user, firestore, form]);

    const handleVerifySkill = async (skillName: string) => {
        setIsVerifying(true);
        setQuiz(null);
        try {
            const result = await generateSkillQuiz({ skillName });
            setQuiz({ ...result, skillName });
        } catch (error) {
            console.error("Error generating skill quiz:", error);
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: "Could not generate the skill quiz. Please try again.",
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleMarkAssessmentComplete = () => {
        if (!quiz) return;
        
        const skillIndex = skillsKnownFields.findIndex(field => field.skillName === quiz.skillName);
        if (skillIndex !== -1) {
            const skill = skillsKnownFields[skillIndex];
            updateSkillKnown(skillIndex, { ...skill, isVerified: true });
            
            toast({
                title: "Skill Verified!",
                description: `You are now a verified teacher for ${quiz.skillName}.`,
            });
        }
        
        setQuiz(null);
        // We still need to save the change
        form.handleSubmit(onSubmit)();
    };

    const onSubmit = (data: ProfileFormValues) => {
        if (!user || !firestore) return;

        const userDocRef = doc(firestore, "users", user.uid);
        
        const profileData = {
            ...userProfile,
            ...data
        };

        setDocumentNonBlocking(userDocRef, profileData, { merge: true });

        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
        });
    };

    if (isLoading) {
        return <Skeleton className="w-full h-96" />;
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
                 <Card className="w-full md:w-1/3 lg:w-1/4">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 mb-4">
                            <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.name} />
                            <AvatarFallback>{getInitials(userProfile?.name)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-bold font-headline">{form.watch("name")}</h2>
                        <p className="text-muted-foreground">{form.watch("email")}</p>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                <span className="font-semibold">{userProfile?.rating || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Gem className="w-4 h-4 text-accent" />
                                <span className="font-semibold">{userProfile?.credits || 0} Credits</span>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {userProfile && (userProfile?.badges || []).map((badge: string) => (
                                <Badge key={badge} variant="secondary" className="gap-1">
                                    <Award className="w-3 h-3"/> {badge}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex-1">
                     <Tabs defaultValue="account">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="account">Account</TabsTrigger>
                            <TabsTrigger value="skills">Skills</TabsTrigger>
                            <TabsTrigger value="availability">Availability</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account" className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium font-headline">Personal Information</h3>
                                    <p className="text-sm text-muted-foreground">Update your personal details.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" {...form.register("name")} />
                                        {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" {...form.register("email")} disabled />
                                    </div>
                                </div>
                                <div className="pt-6 border-t">
                                     <Button type="submit">Save All Changes</Button>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="skills" className="p-6">
                             <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium font-headline">Skills You Know</h3>
                                    <p className="text-sm text-muted-foreground">Skills you can teach others. Add a skill to get it verified by our AI.</p>
                                    <div className="mt-4 space-y-3">
                                        {skillsKnownFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                                <div className="flex items-center gap-2">
                                                     {field.isVerified ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Verified className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                    <span className="font-medium">{form.watch(`skillsKnown.${index}.skillName`)}</span>
                                                    <Badge variant="outline" className="capitalize">{form.watch(`skillsKnown.${index}.level`)}</Badge>
                                                </div>
                                               <div className="flex items-center gap-2">
                                                    {!field.isVerified ? (
                                                        <Button size="sm" type="button" variant="outline" onClick={() => handleVerifySkill(field.skillName)} disabled={isVerifying}>
                                                            {isVerifying && quiz?.skillName !== field.skillName ? 'Verifying...' : 'Get Verified'}
                                                        </Button>
                                                    ) : (
                                                        <Badge variant="secondary" className="border-green-500/50 text-green-600">Verified</Badge>
                                                    )}
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSkillKnown(index)}><X className="h-4 w-4"/></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Input 
                                            placeholder="e.g. Python" 
                                            value={newSkillName}
                                            onChange={(e) => setNewSkillName(e.target.value)}
                                        />
                                        <Select 
                                            value={newSkillLevel} 
                                            onValueChange={(value: SkillLevel) => setNewSkillLevel(value)}
                                        >
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue placeholder="Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="basic">Basic</SelectItem>
                                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                                <SelectItem value="advanced">Advanced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" onClick={() => {
                                            if (newSkillName) {
                                                appendSkillKnown({ skillName: newSkillName, level: newSkillLevel, isVerified: false });
                                                setNewSkillName('');
                                                setNewSkillLevel('basic');
                                            }
                                        }}>Add Skill</Button>
                                    </div>
                                </div>
                                
                                {isVerifying && <p className="text-center text-muted-foreground animate-pulse pt-4">Gemini is preparing your test...</p>}

                                {quiz && (
                                    <Card className="mt-6 bg-primary/5 p-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BookOpen className="w-5 h-5 text-primary"/>
                                                Self-Assessment: {quiz.skillName}
                                            </CardTitle>
                                            <CardDescription>Review the questions and your conceptual answers. This is a trust-based verification.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {quiz.questions.map((q, i) => (
                                                <Alert key={i}>
                                                    <AlertTitle>{i + 1}. {q.question}</AlertTitle>
                                                    <AlertDescription className="mt-2 text-xs italic">
                                                        <strong>Expected Answer Focus:</strong> {q.answer}
                                                    </AlertDescription>
                                                </Alert>
                                            ))}
                                        </CardContent>
                                        <CardFooter className="flex-col gap-2">
                                             <Button onClick={handleMarkAssessmentComplete} className="w-full">
                                                Mark Assessment as Complete & Get Verified
                                            </Button>
                                             <p className="text-xs text-muted-foreground">This is a trust-based system for the MVP.</p>
                                        </CardFooter>
                                    </Card>
                                )}

                                <div className="pt-6 border-t">
                                    <h3 className="text-lg font-medium font-headline">Skills You Want to Learn</h3>
                                    <p className="text-sm text-muted-foreground">Skills you are interested in learning from others.</p>
                                     <div className="mt-4 space-y-3">
                                        {skillsWantedFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                               <span className="font-medium">{form.watch(`skillsWanted.${index}.skillName`)}</span>
                                               <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSkillWanted(index)}><X className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Input 
                                            placeholder="e.g. Graphic Design" 
                                            value={newWantedSkill}
                                            onChange={(e) => setNewWantedSkill(e.target.value)}
                                        />
                                        <Button type="button" onClick={() => {
                                            if (newWantedSkill) {
                                                appendSkillWanted({ skillName: newWantedSkill });
                                                setNewWantedSkill('');
                                            }
                                        }}>Add Skill</Button>
                                    </div>
                                </div>
                             </div>
                        </TabsContent>
                        <TabsContent value="availability" className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium font-headline">Your Availability</h3>
                                    <p className="text-sm text-muted-foreground">Set your weekly schedule so others can book sessions with you.</p>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {availabilityFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CalendarPlus className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">{form.watch(`availability.${index}.day`)}</span>
                                                <span className="text-muted-foreground">{form.watch(`availability.${index}.timeSlot`)}</span>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAvailability(index)}><X className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Select value={newAvailabilityDay} onValueChange={setNewAvailabilityDay}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select a day" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Input 
                                        placeholder="e.g. 18:00 - 20:00"
                                        value={newAvailabilityTime}
                                        onChange={(e) => setNewAvailabilityTime(e.target.value)}
                                    />
                                    <Button type="button" onClick={() => {
                                        if (newAvailabilityDay && newAvailabilityTime) {
                                            appendAvailability({ day: newAvailabilityDay, timeSlot: newAvailabilityTime });
                                            setNewAvailabilityDay('');
                                            setNewAvailabilityTime('');
                                        }
                                    }}>Add Slot</Button>
                                </div>

                                <div className="pt-6">
                                     <Button type="submit">Save All Changes</Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </form>
    );
}
