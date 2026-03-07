declare global {
  interface Window {
    Razorpay: any;
  }
}

let loaded = false;

export function loadRazorpay(): Promise<void> {
  if (loaded && window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      loaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

interface RazorpayCheckoutOptions {
  razorpayKeyId: string;
  razorpaySubscriptionId: string;
  name: string;
  email: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  onError: (error: any) => void;
  onDismiss?: () => void;
}

export function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  const rzp = new window.Razorpay({
    key: options.razorpayKeyId,
    subscription_id: options.razorpaySubscriptionId,
    name: "TableTalk",
    description: `Subscription for ${options.name}`,
    prefill: {
      email: options.email,
    },
    handler: options.onSuccess,
    modal: {
      ondismiss: options.onDismiss,
    },
    theme: {
      color: "#e8613a",
    },
    method: {
      card: true,
      upi: true,
      netbanking: true,
      wallet: true,
      emandate: true,
    },
  });

  rzp.on("payment.failed", options.onError);
  rzp.open();
}
