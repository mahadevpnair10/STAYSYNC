import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/../supabaseClient";
import { CheckCircle, Loader2 } from "lucide-react";

const PaymentSuccess = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        // Get payment_id from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get('payment_id');
        const sessionId = urlParams.get('session_id');

        if (paymentId) {
          // Update payment status to completed
          const { data, error } = await supabase
            .from('payments')
            .update({ 
              status: 'completed',
              stripe_session_id: sessionId 
            })
            .eq('id', paymentId)
            .select(`
              *,
              bookings:booking_id(
                rooms(
                  room_type,
                  hotel:hotel_id(
                    property_name
                  )
                )
              )
            `)
            .single();

          if (error) {
            console.error('Error updating payment:', error);
          } else {
            setPaymentDetails(data);
          }
        }

        // Clear pending payment from localStorage
        localStorage.removeItem('pendingPayment');
        
      } catch (error) {
        console.error('Error processing payment success:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentSuccess();
  }, []);

  if (isProcessing) {
    return (
      <main className="container mx-auto py-16 text-center">
        <SEO
          title="Processing Payment"
          description="Processing your payment..."
          canonical="/payment-success"
        />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          <h1 className="text-2xl font-bold">Processing your payment...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-16 text-center">
      <SEO
        title="Payment Successful"
        description="Your payment was processed successfully."
        canonical="/payment-success"
      />
      
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-700 mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you! Your payment has been processed successfully.
          </p>
          
          {paymentDetails && (
            <div className="bg-gray-50 p-4 rounded-lg text-left mb-6">
              <h3 className="font-semibold mb-2">Payment Details:</h3>
              <p><strong>Amount:</strong> ₹{paymentDetails.amount}</p>
              <p><strong>Payment Method:</strong> {paymentDetails.payment_method}</p>
              <p><strong>Status:</strong> {paymentDetails.status}</p>
              {paymentDetails.bookings?.rooms && (
                <p><strong>For:</strong> {paymentDetails.bookings.rooms.room_type} at {paymentDetails.bookings.rooms.hotel?.property_name}</p>
              )}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mb-6">
            A receipt has been sent to your email address.
          </p>
        </div>
        
        <Button asChild className="w-full">
          <a href="/user">Return to User Portal</a>
        </Button>
      </div>
    </main>
  );
};

export default PaymentSuccess;
