import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { WhatsAppSupportButton } from '@/components/whatsapp-support-button';
import { AlertCircle } from 'lucide-react';
import { getGymAccessBlockReason, getBlockReasonMessage } from '@/lib/gym-subscription';

export function Expired() {
  const { signOut, gymSubscription } = useAuth();
  const [, setLocation] = useLocation();

  const reason = getGymAccessBlockReason(gymSubscription);
  const { title, description } = getBlockReasonMessage(reason);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="max-w-md w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg p-8 text-center space-y-6">
        <div className="flex justify-center text-red-500">
          <AlertCircle size={64} />
        </div>
        <h1 className="page-title text-[hsl(var(--card-foreground))]">{title}</h1>
        <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{description}</p>

        <div className="space-y-3 pt-2">
          <WhatsAppSupportButton />
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
}
