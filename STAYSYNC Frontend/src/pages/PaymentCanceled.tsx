import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const PaymentCanceled = () => {
  return (
    <main className="container mx-auto py-16 text-center">
      <SEO
        title="Payment Canceled"
        description="Your payment has been canceled."
        canonical="/payment-canceled"
      />
      <h1 className="text-3xl font-bold">Payment Canceled</h1>
      <p className="mt-2 text-muted-foreground">No charges were made. You can try again anytime.</p>
      <div className="mt-6">
        <a href="/user"><Button variant="outline">Back to Portal</Button></a>
      </div>
    </main>
  );
};

export default PaymentCanceled;
