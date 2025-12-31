import { currentUser } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gem, Upload, Star, Award, Verified, X } from "lucide-react";

const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : name.substring(0, 2);
};

export default function ProfilePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
                <Card className="w-full md:w-1/3 lg:w-1/4">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 mb-4">
                            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-bold font-headline">{currentUser.name}</h2>
                        <p className="text-muted-foreground">{currentUser.email}</p>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                <span className="font-semibold">{currentUser.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Gem className="w-4 h-4 text-accent" />
                                <span className="font-semibold">{currentUser.credits} Credits</span>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {currentUser.badges.map(badge => (
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
                                        <Input id="name" defaultValue={currentUser.name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" defaultValue={currentUser.email} disabled />
                                    </div>
                                    <Button>Save Changes</Button>
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
                                        {currentUser.skillsKnown.map(skill => (
                                            <div key={skill.skillName} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Verified className="w-4 h-4 text-green-500" />
                                                    <span className="font-medium">{skill.skillName}</span>
                                                    <Badge variant="outline" className="capitalize">{skill.level}</Badge>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6"><X className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Input placeholder="e.g. Python" className="flex-1"/>
                                        <Select>
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue placeholder="Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="basic">Basic</SelectItem>
                                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                                <SelectItem value="advanced">Advanced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button>Add Skill</Button>
                                    </div>
                                </div>
                                <div className="pt-6 border-t">
                                    <h3 className="text-lg font-medium font-headline">Skills You Want to Learn</h3>
                                    <p className="text-sm text-muted-foreground">Skills you are interested in learning from others.</p>
                                     <div className="mt-4 space-y-3">
                                        {currentUser.skillsWanted.map(skill => (
                                            <div key={skill.skillName} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                               <span className="font-medium">{skill.skillName}</span>
                                               <Button variant="ghost" size="icon" className="h-6 w-6"><X className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Input placeholder="e.g. Graphic Design" />
                                        <Button>Add Skill</Button>
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
        </div>
    );
}
