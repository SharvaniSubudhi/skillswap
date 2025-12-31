import { currentUser, sessions } from "@/lib/data"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gem, PlusCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { format } from "date-fns"

export default function CreditsPage() {
  const transactions = sessions
    .filter(
      (s) =>
        s.status === "completed" &&
        (s.learner.id === currentUser.id || s.teacher.id === currentUser.id)
    )
    .map((s) => {
      const isEarned = s.teacher.id === currentUser.id
      return {
        id: s.id,
        type: isEarned ? "Earned" : "Spent",
        description: isEarned
          ? `Taught ${s.skill} to ${s.learner.name}`
          : `Learned ${s.skill} from ${s.teacher.name}`,
        amount: s.creditsTransferred,
        date: s.sessionDate,
      }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Credits</h1>
        <p className="text-muted-foreground">
          Manage your balance and view transaction history.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="flex items-center gap-2 text-4xl font-headline">
              <Gem className="h-8 w-8 text-accent" />
              {currentUser.credits}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Credits are used to book 1-on-1 sessions. 1 credit = 1 hour.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Buy More Credits
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              A record of your earned and spent credits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {tx.description}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={tx.type === "Earned" ? "outline" : "default"}
                        className={`capitalize gap-1 ${
                          tx.type === "Earned"
                            ? "text-green-600 border-green-600"
                            : "bg-red-500 hover:bg-red-500/80"
                        }`}
                      >
                        {tx.type === "Earned" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownLeft className="h-3 w-3" />
                        )}
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        tx.type === "Earned"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {tx.type === "Earned" ? "+" : "-"}
                      {tx.amount}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {format(tx.date, "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {transactions.length === 0 && (
                <p className="text-center text-muted-foreground py-12">No transactions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
