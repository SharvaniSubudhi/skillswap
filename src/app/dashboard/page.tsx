"use client";

import { users } from "@/lib/data"
import type { User } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Star, ArrowRight } from "lucide-react"
import { useFirebase } from "@/firebase";
import React from "react";

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
            <span>{user.rating.toFixed(1)}</span>
            <span className="mx-1">•</span>
            <span>{user.status === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>Teaches:</CardDescription>
        <div className="mt-2 flex flex-wrap gap-2">
          {user.skillsKnown.slice(0, 3).map((skill) => (
            <Badge key={skill.skillName} variant="secondary">{skill.skillName}</Badge>
          ))}
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

export default function DashboardPage() {
  const { user: authUser } = useFirebase();
  
  // In a real app, this would come from the AI recommendation engine
  const recommendedUsers = authUser ? users.filter(u => u.id !== authUser.uid) : users;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Discover Matches</h1>
        <p className="text-muted-foreground">AI-powered recommendations to help you find the perfect peer.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recommendedUsers.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}
