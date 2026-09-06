import { ENV } from "./env.js";

const isProduction = (ENV.CASHFREE_ENV || "PRODUCTION").toUpperCase() === "PRODUCTION";
const CASHFREE_BASE_URL = isProduction
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

export const cashfreeConfig = {
  appId: ENV.CASHFREE_APP_ID,
  secretKey: ENV.CASHFREE_SECRET_KEY,
  baseUrl: CASHFREE_BASE_URL,
  apiVersion: "2023-08-01",
};

/**
 * Helper to create a Cashfree PG Order
 */
export const createCashfreeOrder = async ({
  orderId,
  orderAmount,
  currency = "INR",
  customerDetails,
  orderMeta,
  orderNote,
}) => {
  const payload = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: currency,
    customer_details: {
      customer_id: customerDetails.customerId,
      customer_name: customerDetails.name || "Customer",
      customer_email: customerDetails.email,
      customer_phone: customerDetails.phone || "9999999999",
    },
    order_note: orderNote,
  };

  // Cashfree production strictly requires return_url to be https://
  // For localhost (http://) or modal checkout, return_url is safely omitted
  const returnUrl = orderMeta?.return_url;
  if (returnUrl && returnUrl.startsWith("https://")) {
    payload.order_meta = {
      return_url: returnUrl,
    };
  }

  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": ENV.CASHFREE_APP_ID,
      "x-client-secret": ENV.CASHFREE_SECRET_KEY,
      "x-api-version": "2023-08-01",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.message || "Failed to create Cashfree order";
    console.error("Cashfree order creation failed:", data);
    throw new Error(errorMsg);
  }

  return data;
};

/**
 * Helper to fetch Cashfree PG Order status
 */
export const fetchCashfreeOrder = async (orderId) => {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: {
      "x-client-id": ENV.CASHFREE_APP_ID,
      "x-client-secret": ENV.CASHFREE_SECRET_KEY,
      "x-api-version": "2023-08-01",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.message || "Failed to fetch Cashfree order status";
    console.error("Cashfree fetch order failed:", data);
    throw new Error(errorMsg);
  }

  return data;
};

/**
 * Helper to fetch payments for a Cashfree order
 */
export const fetchCashfreeOrderPayments = async (orderId) => {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/payments`, {
    method: "GET",
    headers: {
      "x-client-id": ENV.CASHFREE_APP_ID,
      "x-client-secret": ENV.CASHFREE_SECRET_KEY,
      "x-api-version": "2023-08-01",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    console.warn("Could not fetch payment details for order:", orderId, data);
    return [];
  }

  return data;
};
