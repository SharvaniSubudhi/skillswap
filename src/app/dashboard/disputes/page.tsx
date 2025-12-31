
"use client"

import * as React from "react"
import { useFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useCollection } from "@/firebase/firestore/use-collection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { AlertTriangle, Eye, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Dispute } from "@/lib/types"

const statusColors: { [key: string]: string } = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

export default function DisputesPage() {
  const { user, firestore, useMemoFirebase } = useFirebase();

  const disputesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "disputes"), where("raisedBy", "==", user.uid));
  }, [user, firestore]);

  const { data: disputes, isLoading } = useCollection<Dispute>(disputesQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dispute Resolution</h1>
        <p className="text-muted-foreground">
          Manage and track your session disputes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Disputes</CardTitle>
          <CardDescription>
            A list of all disputes you have raised.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date Raised</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  <TableRow>
                    <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                </>
              )}
              {!isLoading && disputes && disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-mono text-xs">{dispute.sessionId}</TableCell>
                  <TableCell className="max-w-xs truncate">{dispute.reason}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${statusColors[dispute.status]} border-0 capitalize`}>
                      {dispute.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(dispute.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && disputes?.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No Disputes Found</h3>
                <p className="mt-2 text-sm">You haven't raised any disputes yet.</p>
             </div>
          )}
        </CardContent>
      </Card>

       <Card className="mt-6 bg-secondary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5"/>
                    What is a Dispute?
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    If you encounter an issue with a session—such as the other user not showing up, the skill level being misrepresented, or any other problem—you can raise a dispute. Our team (or an automated system) will review the case and take appropriate action, which may include refunding your credits.
                </p>
            </CardContent>
       </Card>

    </div>
  );
}
