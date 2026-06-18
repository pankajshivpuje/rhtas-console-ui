import type React from "react";
import {
  ActionGroup,
  Button,
  ExpandableSection,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextArea,
  TextInput,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { Controller, useForm } from "react-hook-form";
import type { EvaluateRequest } from "../types";

interface EvaluationFormProps {
  onSubmit: (request: EvaluateRequest) => void;
  isEvaluating: boolean;
}

interface FormInputs {
  image: string;
  policy: string;
  publicKey: string;
  rekorUrl: string;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  onSubmit,
  isEvaluating,
}) => {
  const {
    control,
    handleSubmit,
  } = useForm<FormInputs>({
    mode: "onBlur",
    defaultValues: {
      image: "",
      policy: "",
      publicKey: "",
      rekorUrl: "",
    },
  });

  const submitHandler = (data: FormInputs) => {
    onSubmit({
      image: data.image.trim(),
      policy: data.policy.trim(),
      publicKey: data.publicKey.trim() || undefined,
      rekorUrl: data.rekorUrl.trim() || undefined,
    });
  };

  return (
    <Form onSubmit={(e) => void handleSubmit(submitHandler)(e)}>
      <Controller
        name="image"
        control={control}
        rules={{ required: "Artifact URL is required" }}
        render={({ field, fieldState }) => (
          <FormGroup label="Artifact URL" isRequired fieldId="image">
            <TextInput
              {...field}
              id="image"
              placeholder="quay.io/my-org/my-app:v1.2.3"
              validated={fieldState.invalid ? "error" : "default"}
              style={{ maxWidth: "40rem" }}
            />
            {fieldState.invalid && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    icon={<ExclamationCircleIcon />}
                    variant="error"
                  >
                    {fieldState.error?.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        )}
      />
      <Controller
        name="policy"
        control={control}
        rules={{ required: "Policy source is required" }}
        render={({ field, fieldState }) => (
          <FormGroup label="Policy source repo URL" isRequired fieldId="policy">
            <TextInput
              {...field}
              id="policy"
              placeholder="oci::quay.io/enterprise-contract/config//default"
              validated={fieldState.invalid ? "error" : "default"}
              style={{ maxWidth: "40rem" }}
            />
            {fieldState.invalid && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    icon={<ExclamationCircleIcon />}
                    variant="error"
                  >
                    {fieldState.error?.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        )}
      />
      <ExpandableSection toggleText="Advanced options">
        <Controller
          name="publicKey"
          control={control}
          render={({ field }) => (
            <FormGroup label="Cosign public key (PEM)" fieldId="publicKey">
              <TextArea
                {...field}
                id="publicKey"
                placeholder="-----BEGIN PUBLIC KEY-----"
                rows={4}
                style={{ maxWidth: "40rem" }}
              />
            </FormGroup>
          )}
        />
        <Controller
          name="rekorUrl"
          control={control}
          render={({ field }) => (
            <FormGroup label="Rekor URL" fieldId="rekorUrl">
              <TextInput
                {...field}
                id="rekorUrl"
                placeholder="https://rekor.sigstore.dev"
                style={{ maxWidth: "40rem" }}
              />
            </FormGroup>
          )}
        />
      </ExpandableSection>
      <ActionGroup>
        <Button
          type="submit"
          variant="primary"
          isLoading={isEvaluating}
          isDisabled={isEvaluating}
        >
          Evaluate
        </Button>
      </ActionGroup>
    </Form>
  );
};
