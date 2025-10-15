import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as shippingService from '@/services/shippingService';
import { ShippingCarrier, ShippingChannel } from '@/types/shipping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CarrierChannelManager() {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [channels, setChannels] = useState<ShippingChannel[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<ShippingCarrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [carrierDialogOpen, setCarrierDialogOpen] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<ShippingCarrier | null>(null);
  const [editingChannel, setEditingChannel] = useState<ShippingChannel | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'carrier' | 'channel'; id: string } | null>(null);

  const [carrierFormData, setCarrierFormData] = useState({
    carrier_code: '',
    carrier_name_cn: '',
    carrier_name_en: '',
    carrier_type: 'express',
    website: '',
    is_active: true,
    sort: 0,
  });

  const [channelFormData, setChannelFormData] = useState({
    carrier_id: '',
    channel_code: '',
    channel_name_cn: '',
    channel_name_en: '',
    description: '',
    is_active: true,
    sort: 0,
  });

  useEffect(() => {
    loadCarriers();
  }, []);

  useEffect(() => {
    if (selectedCarrier) {
      loadChannels(selectedCarrier.id);
    }
  }, [selectedCarrier]);

  const loadCarriers = async () => {
    try {
      setLoading(true);
      const data = await shippingService.getCarriers();
      setCarriers(data);
      if (data.length > 0 && !selectedCarrier) {
        setSelectedCarrier(data[0]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load carriers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async (carrierId: string) => {
    try {
      const data = await shippingService.getChannelsByCarrier(carrierId);
      setChannels(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load channels',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCarrier = () => {
    setEditingCarrier(null);
    setCarrierFormData({
      carrier_code: '',
      carrier_name_cn: '',
      carrier_name_en: '',
      carrier_type: 'express',
      website: '',
      is_active: true,
      sort: 0,
    });
    setCarrierDialogOpen(true);
  };

  const handleEditCarrier = (carrier: ShippingCarrier) => {
    setEditingCarrier(carrier);
    setCarrierFormData({
      carrier_code: carrier.carrier_code,
      carrier_name_cn: carrier.carrier_name_cn,
      carrier_name_en: carrier.carrier_name_en,
      carrier_type: carrier.carrier_type,
      website: carrier.website || '',
      is_active: carrier.is_active,
      sort: carrier.sort,
    });
    setCarrierDialogOpen(true);
  };

  const handleSaveCarrier = async () => {
    try {
      if (editingCarrier) {
        await shippingService.updateCarrier(editingCarrier.id, carrierFormData);
        toast({
          title: 'Success',
          description: 'Carrier updated successfully',
        });
      } else {
        await shippingService.createCarrier(carrierFormData);
        toast({
          title: 'Success',
          description: 'Carrier created successfully',
        });
      }
      setCarrierDialogOpen(false);
      loadCarriers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save carrier',
        variant: 'destructive',
      });
    }
  };

  const handleCreateChannel = () => {
    if (!selectedCarrier) return;
    setEditingChannel(null);
    setChannelFormData({
      carrier_id: selectedCarrier.id,
      channel_code: '',
      channel_name_cn: '',
      channel_name_en: '',
      description: '',
      is_active: true,
      sort: 0,
    });
    setChannelDialogOpen(true);
  };

  const handleEditChannel = (channel: ShippingChannel) => {
    setEditingChannel(channel);
    setChannelFormData({
      carrier_id: channel.carrier_id,
      channel_code: channel.channel_code,
      channel_name_cn: channel.channel_name_cn,
      channel_name_en: channel.channel_name_en,
      description: channel.description || '',
      is_active: channel.is_active,
      sort: channel.sort,
    });
    setChannelDialogOpen(true);
  };

  const handleSaveChannel = async () => {
    try {
      if (editingChannel) {
        await shippingService.updateChannel(editingChannel.id, channelFormData);
        toast({
          title: 'Success',
          description: 'Channel updated successfully',
        });
      } else {
        await shippingService.createChannel(channelFormData);
        toast({
          title: 'Success',
          description: 'Channel created successfully',
        });
      }
      setChannelDialogOpen(false);
      if (selectedCarrier) {
        loadChannels(selectedCarrier.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save channel',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (type: 'carrier' | 'channel', id: string) => {
    setDeletingItem({ type, id });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.type === 'carrier') {
        await shippingService.deleteCarrier(deletingItem.id);
        toast({
          title: 'Success',
          description: 'Carrier deleted successfully',
        });
        loadCarriers();
      } else {
        await shippingService.deleteChannel(deletingItem.id);
        toast({
          title: 'Success',
          description: 'Channel deleted successfully',
        });
        if (selectedCarrier) {
          loadChannels(selectedCarrier.id);
        }
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel: Carriers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Carriers 承运商</CardTitle>
            <Button size="sm" onClick={handleCreateCarrier}>
              <Plus className="h-4 w-4 mr-2" />
              Add Carrier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carriers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No carriers found
                    </TableCell>
                  </TableRow>
                ) : (
                  carriers.map((carrier) => (
                    <TableRow
                      key={carrier.id}
                      className={selectedCarrier?.id === carrier.id ? 'bg-muted' : ''}
                      onClick={() => setSelectedCarrier(carrier)}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell className="font-mono">{carrier.carrier_code}</TableCell>
                      <TableCell>{carrier.carrier_name_cn}</TableCell>
                      <TableCell>
                        <Switch checked={carrier.is_active} disabled />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCarrier(carrier);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete('carrier', carrier.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel: Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Channels 运输渠道
              {selectedCarrier && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  for {selectedCarrier.carrier_name_cn}
                </span>
              )}
            </CardTitle>
            <Button
              size="sm"
              onClick={handleCreateChannel}
              disabled={!selectedCarrier}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedCarrier ? (
            <div className="text-center text-muted-foreground py-8">
              Select a carrier to view channels
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No channels found
                      </TableCell>
                    </TableRow>
                  ) : (
                    channels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-mono">{channel.channel_code}</TableCell>
                        <TableCell>{channel.channel_name_cn}</TableCell>
                        <TableCell>
                          <Switch checked={channel.is_active} disabled />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditChannel(channel)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete('channel', channel.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carrier Dialog */}
      <Dialog open={carrierDialogOpen} onOpenChange={setCarrierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCarrier ? 'Edit Carrier' : 'Add New Carrier'}
            </DialogTitle>
            <DialogDescription>Fill in the carrier details below</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Carrier Code *</Label>
                <Input
                  value={carrierFormData.carrier_code}
                  onChange={(e) => setCarrierFormData({ ...carrierFormData, carrier_code: e.target.value })}
                  placeholder="e.g., YUNEXPRESS"
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={carrierFormData.sort}
                  onChange={(e) => setCarrierFormData({ ...carrierFormData, sort: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Name (Chinese) *</Label>
              <Input
                value={carrierFormData.carrier_name_cn}
                onChange={(e) => setCarrierFormData({ ...carrierFormData, carrier_name_cn: e.target.value })}
                placeholder="e.g., 云途物流"
              />
            </div>
            <div>
              <Label>Name (English) *</Label>
              <Input
                value={carrierFormData.carrier_name_en}
                onChange={(e) => setCarrierFormData({ ...carrierFormData, carrier_name_en: e.target.value })}
                placeholder="e.g., YunExpress"
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={carrierFormData.website}
                onChange={(e) => setCarrierFormData({ ...carrierFormData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={carrierFormData.is_active}
                onCheckedChange={(checked) => setCarrierFormData({ ...carrierFormData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCarrierDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCarrier}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Channel Dialog */}
      <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingChannel ? 'Edit Channel' : 'Add New Channel'}
            </DialogTitle>
            <DialogDescription>Fill in the channel details below</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Channel Code *</Label>
                <Input
                  value={channelFormData.channel_code}
                  onChange={(e) => setChannelFormData({ ...channelFormData, channel_code: e.target.value })}
                  placeholder="e.g., YUNEXPRESS_US_STANDARD"
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={channelFormData.sort}
                  onChange={(e) => setChannelFormData({ ...channelFormData, sort: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Name (Chinese) *</Label>
              <Input
                value={channelFormData.channel_name_cn}
                onChange={(e) => setChannelFormData({ ...channelFormData, channel_name_cn: e.target.value })}
                placeholder="e.g., 云途美国标准"
              />
            </div>
            <div>
              <Label>Name (English) *</Label>
              <Input
                value={channelFormData.channel_name_en}
                onChange={(e) => setChannelFormData({ ...channelFormData, channel_name_en: e.target.value })}
                placeholder="e.g., YunExpress US Standard"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={channelFormData.description}
                onChange={(e) => setChannelFormData({ ...channelFormData, description: e.target.value })}
                placeholder="e.g., Standard shipping to United States, 8-12 days"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={channelFormData.is_active}
                onCheckedChange={(checked) => setChannelFormData({ ...channelFormData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChannelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChannel}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deletingItem?.type}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
