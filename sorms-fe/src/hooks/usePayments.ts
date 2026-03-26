import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "@/api/paymentApi";

export function useMyInvoices() {
  return useQuery({
    queryKey: ["invoices", "mine"],
    queryFn: async () => {
      const response = await paymentApi.getMyInvoices();
      return response.data?.data ?? response.data;
    }
  });
}

export function useInvoiceDetail(invoiceId?: string) {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const response = await paymentApi.getInvoiceDetail(invoiceId!);
      return response.data?.data ?? response.data;
    }
  });
}

export function useApplyVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, voucherCode }: { invoiceId: string; voucherCode: string }) =>
      paymentApi.applyVoucher(invoiceId, voucherCode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "mine"] });
    }
  });
}

export function useCreatePaymentLink() {
  return useMutation({
    mutationFn: ({ invoiceId, returnUrl, cancelUrl }: { invoiceId: string; returnUrl?: string; cancelUrl?: string }) =>
      paymentApi.createPaymentLink(invoiceId, {
        returnUrl,
        cancelUrl
      })
  });
}
