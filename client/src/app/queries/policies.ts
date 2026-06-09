import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import ENV from "@app/env";
import { client } from "@app/axios-config/apiInit";
import type {
  GenerateRequest,
  GenerateResponse,
  ValidateRequest,
  ValidateResponse,
} from "@app/pages/PolicyGenerator/types";
import { mockGenerateResponse, mockValidateResponse } from "./mocks/policies.mock";

const mockDelay = <T>(data: T, ms = 1500): Promise<T> =>
  new Promise((resolve) => setTimeout(resolve, ms, data));

export const usePolicyGenerate = () => {
  const mutation = useMutation<GenerateResponse, AxiosError, GenerateRequest>({
    mutationFn: async (request: GenerateRequest) => {
      if (ENV.MOCK !== "off") {
        return mockDelay(mockGenerateResponse);
      }
      const response = await client.post<GenerateResponse>(
        "/api/v1/policies/generate",
        request,
      );
      return response.data;
    },
  });

  return {
    generate: (request: GenerateRequest) => mutation.mutateAsync(request),
    isGenerating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

export const usePolicyValidate = () => {
  const mutation = useMutation<ValidateResponse, AxiosError, ValidateRequest>({
    mutationFn: async (request: ValidateRequest) => {
      if (ENV.MOCK !== "off") {
        return mockDelay(mockValidateResponse, 800);
      }
      const response = await client.post<ValidateResponse>(
        "/api/v1/policies/validate",
        request,
      );
      return response.data;
    },
  });

  return {
    validate: (request: ValidateRequest) => mutation.mutateAsync(request),
    isValidating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
