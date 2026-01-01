
'use client';

import { notFound } from "next/navigation";
import { UserProfileClient } from "./user-profile-client";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfilePage({ params }: { params: { id: string } }) {
    const { firestore } = useFirebase();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !params.id) return null;
        return doc(firestore, 'users', params.id);
    }, [firestore, params.id]);

    const { data: user, isLoading, error } = useDoc<User>(userDocRef);

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

    return <UserProfileClient user={user} />;
}
