
import { users } from "@/lib/data";
import { notFound } from "next/navigation";
import { UserProfileClient } from "./user-profile-client";

export default function UserProfilePage({ params }: { params: { id: string } }) {
    const user = users.find(u => u.id === params.id);
    if (!user) {
        notFound();
    }

    return <UserProfileClient user={user} />;
}
