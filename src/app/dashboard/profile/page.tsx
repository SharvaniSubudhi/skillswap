
"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirebase } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gem, Upload, Star, Award, Verified, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";


const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    skillsKnown: z.array(z.object({
        skillName: z.string().min(1, "Skill name is required"),
        level: z.enum(["basic", "intermediate", "advanced"]),
    })),
    skillsWanted: z.array(z.object({
        skillName: z.string().min(1, "Skill name is required"),
    })),
    availability: z.array(z.object({
        day: z.string(),
        timeSlot: z.string(),
    })),
    studentIdProof: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type SkillLevel = "basic" | "intermediate" | "advanced";

const getInitials = (name: string = "") => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
};

export default function ProfilePage() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [userProfile, setUserProfile] = React.useState<any>(null);
    const [newSkillName, setNewSkillName] = React.useState("");
    const [newSkillLevel, setNewSkillLevel] = React.useState<SkillLevel>("basic");
    const [newWantedSkill, setNewWantedSkill] = React.useState("");

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

    const { fields: skillsKnownFields, append: appendSkillKnown, remove: removeSkillKnown } = useFieldArray({
        control: form.control,
        name: "skillsKnown",
    });

    const { fields: skillsWantedFields, append: appendSkillWanted, remove: removeSkillWanted } = useFieldArray({
        control: form.control,
        name: "skillsWanted",
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
                            {(userProfile?.badges || []).map((badge: string) => (
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
                                    <Button type="submit">Save Changes</Button>
                                </div>
                                <div className="space-y-4 pt-6 border-t">
                                  <h3 className="text-lg font-medium font-headline">Student Verification</h3>
                                   <p className="text-sm text-muted-foreground">Upload your student ID for fraud prevention.</p>
                                   <Card className="bg-secondary/50">
                                      <CardContent className="pt-6">
                                        <div className="flex items-center gap-4 p-4 rounded-lg border-dashed border-2">
                                           <Upload className="h-8 w-8 text-muted-foreground"/>
                                           <div>
                                             <Label htmlFor="student-id" className="cursor-pointer text-primary font-semibold">
                                               Click to upload a file
                                               <Input id="student-id" type="file" className="sr-only"/>
                                             </Label>
                                             <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 5MB</p>
                                           </div>
                                        </div>
                                      </CardContent>
                                   </Card>
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
                                                    <Verified className="w-4 h-4 text-green-500" />
                                                    <span className="font-medium">{form.watch(`skillsKnown.${index}.skillName`)}</span>
                                                    <Badge variant="outline" className="capitalize">{form.watch(`skillsKnown.${index}.level`)}</Badge>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSkillKnown(index)}><X className="h-4 w-4"/></Button>
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
                                                appendSkillKnown({ skillName: newSkillName, level: newSkillLevel });
                                                setNewSkillName('');
                                                setNewSkillLevel('basic');
                                            }
                                        }}>Add Skill</Button>
                                    </div>
                                </div>
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
                            <div>
                                <h3 className="text-lg font-medium font-headline">Your Availability</h3>
                                <p className="text-sm text-muted-foreground">Set your weekly schedule so others can book sessions with you.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </form>
    );

    