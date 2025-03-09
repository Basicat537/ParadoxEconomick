import { useQuery, useMutation } from "@tanstack/react-query";
import { SupportTicket } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function Support() {
  const { toast } = useToast();
  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/tickets"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/tickets/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({ title: "Ticket status updated" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets?.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>{ticket.id}</TableCell>
              <TableCell>{ticket.userId}</TableCell>
              <TableCell>{ticket.subject}</TableCell>
              <TableCell className="max-w-md truncate">{ticket.message}</TableCell>
              <TableCell>
                <Badge
                  variant={ticket.status === "open" ? "secondary" : "default"}
                >
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(ticket.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {ticket.status === "open" ? (
                  <Button
                    size="sm"
                    onClick={() => updateMutation.mutate({ id: ticket.id, status: "closed" })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Close Ticket
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ id: ticket.id, status: "open" })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reopen
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
