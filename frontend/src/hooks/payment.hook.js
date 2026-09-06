import { purchaseCourseApi, checkOutSuccessApi } from "@/api/purchase.api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useCheckoutSuccessHook = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (paymentData) => checkOutSuccessApi(paymentData),
    onSuccess: (data) => {
      toast.success(data.message || "Payment successful!");
      if (data.courseId) {
        navigate(`/SinglePurchasedCourse/${data.courseId}`);
      }
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Payment verification failed");
    },
  });
};

export const usePaymentHook = () => {
  const checkoutSuccessMutation = useCheckoutSuccessHook();

  return useMutation({
    mutationFn: purchaseCourseApi,
    onSuccess: async (data) => {
      if (data.isFree) {
        toast.success(data.message || "Enrolled in course successfully!");
        window.location.href = `/SinglePurchasedCourse/${data.courseId}`;
        return;
      }

      if (data.order && data.order.paymentSessionId) {
        if (!window.Cashfree) {
          toast.error("Payment gateway failed to load. Please refresh the page.");
          return;
        }

        const mode = (import.meta.env.VITE_CASHFREE_MODE || "production").toLowerCase();
        const cashfree = window.Cashfree({
          mode: mode === "production" ? "production" : "sandbox",
        });

        const checkoutOptions = {
          paymentSessionId: data.order.paymentSessionId,
          redirectTarget: "_modal",
        };

        cashfree
          .checkout(checkoutOptions)
          .then((result) => {
            if (result?.error) {
              console.error("Cashfree checkout error:", result.error);
              toast.error(result.error.message || "Payment cancelled or failed");
              return;
            }

            if (result?.redirect) {
              // Cashfree handles redirect if required by payment method
              return;
            }

            if (result?.paymentDetails) {
              // Payment completed in modal, verify and finalize order on backend
              checkoutSuccessMutation.mutate({
                orderId: data.order.orderId,
                courseId: data.order.courseId,
              });
            }
          })
          .catch((err) => {
            console.error("Cashfree checkout error:", err);
            toast.error("Error opening payment modal. Please try again.");
          });
      } else {
        toast.success(data.message || "Request processed");
      }
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    },
  });
};
