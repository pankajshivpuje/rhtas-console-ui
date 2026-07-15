import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import ENV from "@app/env";
import { client } from "@app/axios-config/apiInit";
import { evaluatePolicy } from "@app/client";
import type { EvaluateRequest, ConformaResult } from "@app/pages/Conforma/types";
import { mockConformaResult } from "./mocks/conforma.mock";

const mockDelay = <T>(data: T, ms = 2000): Promise<T> => new Promise((resolve) => setTimeout(resolve, ms, data));

export const usePolicyEvaluate = () => {
  const mutation = useMutation<ConformaResult, AxiosError, EvaluateRequest>({
    mutationFn: async (request: EvaluateRequest) => {
      if (ENV.MOCK !== "off") {
        return mockDelay(mockConformaResult);
      }
      const response = await evaluatePolicy({
        client,
        body: request,
      });
      return response.data as ConformaResult;
    },
  });

  return {
    evaluate: (request: EvaluateRequest) => mutation.mutateAsync(request),
    isEvaluating: mutation.isPending,
    result: mutation.data ?? null,
    error: mutation.error,
    reset: mutation.reset,
  };
};
