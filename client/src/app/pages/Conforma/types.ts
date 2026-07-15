export const ConformaResultStatus = {
  Failed: "Failed",
  Warning: "Warning",
  Success: "Success",
} as const;

export type ConformaResultStatus = (typeof ConformaResultStatus)[keyof typeof ConformaResultStatus];

export interface ConformaRuleMetadata {
  title: string;
  description: string;
  collections?: string[];
  code?: string;
  effective_on?: string;
  solution?: string;
}

export interface ConformaRule {
  metadata?: ConformaRuleMetadata;
  msg: string;
}

export interface ConformaComponent {
  name: string;
  containerImage: string;
  success: boolean;
  violations?: ConformaRule[];
  warnings?: ConformaRule[];
  successes?: ConformaRule[];
}

export interface ConformaResult {
  success: boolean;
  components: ConformaComponent[];
}

export interface UIConformaData {
  title: string;
  description: string;
  status: ConformaResultStatus;
  component: string;
  msg?: string;
  collection?: string[];
  solution?: string;
  effectiveOn?: string;
}

export interface EvaluateRequest {
  image: string;
  policy: string;
  publicKey?: string;
  rekorUrl?: string;
  ignoreRekor?: boolean;
}
