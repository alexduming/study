import {
  CreemProvider,
  PaymentManager,
  PayPalProvider,
  StripeProvider,
} from "@/extensions/payment";
import { Configs, getAllConfigs } from "@/shared/services/config";

/**
 * get payment service with configs
 */
export function getPaymentServiceWithConfigs(configs: Configs) {
  const paymentManager = new PaymentManager();

  const defaultProvider = configs.payment_provider;
  // add stripe provider
  if (configs.stripe_secret_key && configs.stripe_publishable_key) {
    paymentManager.addProvider(
      new StripeProvider({
        secretKey: configs.stripe_secret_key,
        publishableKey: configs.stripe_publishable_key,
      }),
      defaultProvider === "stripe"
    );
  }

  // add creem provider
  if (configs.creem_api_key) {
    paymentManager.addProvider(
      new CreemProvider({
        apiKey: configs.creem_api_key,
        environment: "sandbox",
      }),
      defaultProvider === "creem"
    );
  }

  // add paypal provider
  if (configs.paypal_client_id && configs.paypal_client_secret) {
    paymentManager.addProvider(
      new PayPalProvider({
        clientId: configs.paypal_client_id,
        clientSecret: configs.paypal_client_secret,
        environment: "sandbox",
      }),
      defaultProvider === "paypal"
    );
  }

  return paymentManager;
}

/**
 * global payment service
 */
let paymentService: PaymentManager | null = null;

/**
 * get payment service instance
 */
export async function getPaymentService(): Promise<PaymentManager> {
  if (!paymentService) {
    const configs = await getAllConfigs();
    paymentService = getPaymentServiceWithConfigs(configs);
  }
  return paymentService;
}
