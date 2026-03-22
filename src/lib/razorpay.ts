declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { on: (event: string, handler: (resp: unknown) => void) => void; open: () => void };
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
  razorpayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onError: (error: unknown) => void;
  onDismiss?: () => void;
}

export function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  const rzp = new window.Razorpay({
    key: options.razorpayKeyId,
    order_id: options.razorpayOrderId,
    amount: options.amount,
    currency: options.currency,
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
  });

  rzp.on("payment.failed", options.onError);
  rzp.open();
}
