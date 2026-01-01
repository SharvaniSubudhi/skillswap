
"use client";

import type { User } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Star, ArrowRight } from "lucide-react"
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import React from "react";
import { collection, query, where, documentId, doc, getDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecommendations } from "@/ai/flows/get-recommendations";

const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`
    }
    return name.substring(0, 2)
  }

function UserCard({ user }: { user: User }) {
  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-lg">
      <CardHeader className="flex-row gap-4 items-center">
        <Avatar className="w-14 h-14">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="font-headline text-xl">{user.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
            <span>{user.rating?.toFixed(1) || 'N/A'}</span>
            <span className="mx-1">•</span>
            <span>{user.status === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          <div>
            <CardDescription>Teaches:</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.skillsKnown?.slice(0, 3).map((skill) => (
                <Badge key={skill.skillName} variant={skill.isVerified ? "default" : "secondary"}>{skill.skillName}</Badge>
              ))}
              {user.skillsKnown?.length === 0 && <p className="text-xs text-muted-foreground">No skills to teach yet.</p>}
            </div>
          </div>
          <div>
            <CardDescription>Wants to Learn:</CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.skillsWanted?.slice(0, 3).map((skill) => (
                <Badge key={skill.skillName} variant="outline">{skill.skillName}</Badge>
              ))}
              {user.skillsWanted?.length === 0 && <p className="text-xs text-muted-foreground">No skills to learn yet.</p>}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/users/${user.id}`}>
            View Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function UserCardSkeleton() {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-row gap-4 items-center">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

export default function DashboardPage() {
  const { user: authUser, firestore } = useFirebase();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [recommendedUsers, setRecommendedUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "users");
  }, [firestore]);

  const { data: allUsers } = useCollection<User>(usersQuery);

  React.useEffect(() => {
    if (authUser && firestore) {
      const userDocRef = doc(firestore, "users", authUser.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
        }
      });
    }
  }, [authUser, firestore]);

  React.useEffect(() => {
    async function fetchRecommendations() {
      if (currentUser && allUsers && allUsers.length > 0) {
        setIsLoading(true);
        try {
          const allOtherUsers = allUsers.filter(u => u.id !== currentUser.id);
          const recommendations = await getRecommendations({ currentUser, allUsers: allOtherUsers });
          setRecommendedUsers(recommendations);
        } catch (error) {
          console.error("Failed to get recommendations:", error);
          // Fallback to simple filtering if AI fails
          setRecommendedUsers(allUsers.filter(u => u.id !== currentUser.id));
        } finally {
          setIsLoading(false);
        }
      } else if (allUsers) {
        // If no current user, just show all other users
        setRecommendedUsers(allUsers.filter(u => u.id !== authUser?.uid));
        setIsLoading(false);
      }
    }

    if (currentUser) {
        fetchRecommendations();
    } else if (allUsers) {
        // Handle case where authUser is loaded but currentUser profile is not yet fetched
        setIsLoading(false);
    }
  }, [currentUser, allUsers, authUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Discover Matches</h1>
        <p className="text-muted-foreground">AI-powered recommendations for your learning journey.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading && (
            Array.from({ length: 4 }).map((_, i) => <UserCardSkeleton key={i} />)
        )}
        {!isLoading && recommendedUsers.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
         {!isLoading && recommendedUsers.length === 0 && (
            <div className="text-center text-muted-foreground py-12 col-span-full">
              <p>No recommendations found.</p>
              <p className="text-sm">Try adding skills you want to learn in your profile!</p>
            </div>
        )}
      </div>
    </div>
  )
}
