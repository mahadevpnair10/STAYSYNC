import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  return (
    <main className="container mx-auto py-16 text-center">
      <SEO
        title="Payment Successful"
        description="Your payment was processed successfully."
        canonical="/payment-success"
      />
      <h1 className="text-3xl font-bold">Payment Successful</h1>
      <p className="mt-2 text-muted-foreground">Thank you! Your receipt has been sent to your email.</p>
      <div className="mt-6">
        <a href="/user"><Button>Back to Portal</Button></a>
      </div>
    </main>
  );
};

export default PaymentSuccess;
