import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserCircle2, UserX, UserCog } from "lucide-react";
import { RFQData } from "@/types/rfq";
import { toast } from "sonner";
import { UserSelector } from "./UserSelector";

interface AssigneeCardProps {
  rfq: RFQData;
  canAssign: boolean;
  canReassign: boolean;
  canUnassign: boolean;
  canSelfAssign: boolean;
  onAssign: (userId: string, note?: string) => Promise<void>;
  onReassign: (userId: string, note?: string) => Promise<void>;
  onUnassign: (note?: string) => Promise<void>;
  onAssignToMe: () => Promise<void>;
  assigneeProfile?: { full_name?: string; username?: string; avatar_url?: string };
  assignerProfile?: { full_name?: string; username?: string };
}

export function AssigneeCard({
  rfq,
  canAssign,
  canReassign,
  canUnassign,
  canSelfAssign,
  onAssign,
  onReassign,
  onUnassign,
  onAssignToMe,
  assigneeProfile,
  assignerProfile,
}: AssigneeCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'assign' | 'reassign' | 'unassign'>('assign');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenDialog = (type: 'assign' | 'reassign' | 'unassign') => {
    setDialogType(type);
    setSelectedUserId('');
    setNote('');
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (dialogType !== 'unassign' && !selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setLoading(true);
    try {
      if (dialogType === 'assign') {
        await onAssign(selectedUserId, note || undefined);
      } else if (dialogType === 'reassign') {
        await onReassign(selectedUserId, note || undefined);
      } else {
        await onUnassign(note || undefined);
      }
      setDialogOpen(false);
      toast.success(`Successfully ${dialogType}ed RFQ`);
    } catch (error) {
      toast.error(`Failed to ${dialogType} RFQ`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfAssign = async () => {
    setLoading(true);
    try {
      await onAssignToMe();
      toast.success("Successfully assigned to yourself");
    } catch (error) {
      toast.error("Failed to self-assign");
    } finally {
      setLoading(false);
    }
  };

  const assigneeName = assigneeProfile?.full_name || assigneeProfile?.username || 'Unknown User';
  const assigneeInitials = assigneeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const assignerName = assignerProfile?.full_name || assignerProfile?.username || 'System';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle2 className="w-4 h-4" />
            Assignee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rfq.assigned_to ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={assigneeProfile?.avatar_url} />
                  <AvatarFallback>{assigneeInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{assigneeName}</p>
                  <p className="text-sm text-muted-foreground">
                    Assigned {rfq.assigned_at ? new Date(rfq.assigned_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
              
              {rfq.assigned_by && (
                <p className="text-xs text-muted-foreground">
                  Assigned by: {assignerName}
                </p>
              )}

              {rfq.priority && (
                <Badge variant={rfq.priority === 'P1' ? 'destructive' : rfq.priority === 'P2' ? 'default' : 'secondary'}>
                  {rfq.priority}
                </Badge>
              )}

              <div className="flex flex-col gap-2">
                {canReassign && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenDialog('reassign')}
                    className="w-full"
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Reassign
                  </Button>
                )}
                {canUnassign && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenDialog('unassign')}
                    className="w-full"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Unassign
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <div className="text-center">
                  <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Unassigned</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {canAssign && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleOpenDialog('assign')}
                    className="w-full"
                  >
                    <UserCircle2 className="w-4 h-4 mr-2" />
                    Assign
                  </Button>
                )}
                {canSelfAssign && rfq.auto_assignable && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelfAssign}
                    disabled={loading}
                    className="w-full"
                  >
                    Assign to me
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'assign' ? 'Assign RFQ' : dialogType === 'reassign' ? 'Reassign RFQ' : 'Unassign RFQ'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'unassign' 
                ? 'Remove the current assignee from this RFQ' 
                : 'Select a user to assign this RFQ to'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {dialogType !== 'unassign' && (
              <div className="space-y-2">
                <Label htmlFor="user">User *</Label>
                <UserSelector
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  placeholder="Search users..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note about this assignment..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
