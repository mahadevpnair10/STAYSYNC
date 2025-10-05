import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/../supabaseClient";
import { XCircle, Loader2 } from "lucide-react";

const PaymentCanceled = () => {
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCancelation = async () => {
      try {
        // Get payment_id from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get('payment_id');

        if (paymentId) {
          // Update payment status to canceled or delete the pending payment
          const { error } = await supabase
            .from('payments')
            .update({ status: 'canceled' })
            .eq('id', paymentId);

          if (error) {
            console.error('Error updating payment status:', error);
            // If update fails, try to delete the pending payment record
            await supabase
              .from('payments')
              .delete()
              .eq('id', paymentId)
              .eq('status', 'pending');
          }
        }

        // Clear pending payment from localStorage
        localStorage.removeItem('pendingPayment');
        
      } catch (error) {
        console.error('Error processing payment cancelation:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    processCancelation();
  }, []);

  if (isProcessing) {
    return (
      <main className="container mx-auto py-16 text-center">
        <SEO
          title="Processing Cancelation"
          description="Processing payment cancelation..."
          canonical="/payment-canceled"
        />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-gray-600" />
          <h1 className="text-2xl font-bold">Processing cancelation...</h1>
          <p className="text-muted-foreground">Please wait while we cancel your payment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-16 text-center">
      <SEO
        title="Payment Canceled"
        description="Your payment has been canceled."
        canonical="/payment-canceled"
      />
      
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <XCircle className="w-12 h-12 text-gray-600" />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-700 mb-2">Payment Canceled</h1>
          <p className="text-muted-foreground mb-4">
            No charges were made to your account.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            You can try again anytime or choose a different payment method.
          </p>
        </div>
        
        <div className="flex gap-3 w-full">
          <Button variant="outline" asChild className="flex-1">
            <a href="/user">Return to Portal</a>
          </Button>
          <Button asChild className="flex-1">
            <a href="/user">Try Again</a>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default PaymentCanceled;
