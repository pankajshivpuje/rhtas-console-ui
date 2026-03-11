import {
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormGroupLabelHelp,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Popover,
  TextInput,
} from "@patternfly/react-core";
import { type ReactNode, useEffect } from "react";
import { Controller, type RegisterOptions, useForm } from "react-hook-form";
import { type Attribute, ATTRIBUTES } from "../api/rekor-api";
import { ExclamationCircleIcon } from "@patternfly/react-icons";

export interface FormProps {
  defaultValues?: FormInputs;
  isLoading: boolean;
  onSubmit: (_query: FormInputs) => void;
}

export interface FormInputs {
  attribute: Attribute;
  value: string;
}

type Rules = Omit<RegisterOptions, "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled">;

interface InputConfig {
  name: string;
  helperText?: ReactNode;
  placeholder?: string;
  rules: Rules;
  tooltipText?: ReactNode;
}

const inputConfigByAttribute: Record<FormInputs["attribute"], InputConfig> = {
  email: {
    name: "Email",
    placeholder: "jdoe@example.com",
    rules: {
      pattern: {
        value: /\S+@\S+\.\S+/,
        message: "Entered value does not match the email format: 'S+@S+.S+'",
      },
    },
    tooltipText: <>Search by the signer&apos;s email address.</>,
  },
  hash: {
    name: "Hash",
    placeholder: "sha256:8ceb4ab8127731473a9ec81140cb6849cf8e970cda31baef099df48ba3264441",
    rules: {
      pattern: {
        value: /^(sha256:)?[0-9a-fA-F]{64}$|^(sha1:)?[0-9a-fA-F]{40}$/,
        message:
          "Entered value does not match the hash format: '^(sha256:)?[0-9a-fA-F]{64}$|^(sha1:)?[0-9a-fA-F]{40}$'",
      },
    },
    tooltipText: <>Search by the SHA1 or SHA2 hash value.</>,
  },
  commitSha: {
    name: "Commit SHA",
    helperText: (
      <>
        Only compatible with{" "}
        <a
          href="https://access.redhat.com/documentation/en-us/red_hat_trusted_artifact_signer/2024-q1/html/deployment_guide/verify_the_trusted_artifact_signer_installation#signing-and-verifying-commits-by-using-gitsign-from-the-command-line-interface_deploy"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "underline",
          }}
        >
          gitsign
        </a>{" "}
        entries
      </>
    ),
    placeholder: "6d78e27dfcf83eaad6ef73c4695d1ddc663f5555",
    rules: {
      pattern: {
        value: /^[0-9a-fA-F]{40}$/,
        message: "Entered value does not match the commit SHA format: '^[0-9a-fA-F]{40}$'",
      },
    },
    tooltipText: <>Search by the commit hash.</>,
  },
  uuid: {
    name: "Entry UUID",
    placeholder: "24296fb24b8ad77a71b9c1374e207537bafdd75b4f591dcee10f3f697f150d7cc5d0b725eea641e7",
    rules: {
      pattern: {
        value: /^([0-9a-fA-F]{64}|[0-9a-fA-F]{80})$/,
        message: "Entered value does not match the entry UUID format: '^[0-9a-fA-F]{64}|[0-9a-fA-F]{80}$'",
      },
    },
    tooltipText: <>Search by the universally unique identifier value.</>,
  },
  logIndex: {
    name: "Log Index",
    placeholder: "1234567",
    rules: {
      min: {
        value: 0,
        message: "Entered value must be larger than 0",
      },
      pattern: {
        value: /^\d+$/,
        message: "Entered value must be of type int64",
      },
    },
    tooltipText: <>Search by the log index number.</>,
  },
};

export function SearchForm({ defaultValues, onSubmit, isLoading }: FormProps) {
  const { handleSubmit, control, watch, setValue, trigger } = useForm<FormInputs>({
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      attribute: "email",
      value: "",
    },
  });

  useEffect(() => {
    if (defaultValues) {
      setValue("attribute", defaultValues.attribute);
      setValue("value", defaultValues.value);
    }
  }, [defaultValues, setValue]);

  const watchAttribute = watch("attribute");

  useEffect(() => {
    if (control.getFieldState("attribute").isTouched) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      trigger();
    }
  }, [watchAttribute, trigger, control]);

  const rules = Object.assign(
    {
      required: {
        value: true,
        message: "A value is required",
      },
      pattern: undefined,
      min: undefined,
      deps: undefined,
    },
    inputConfigByAttribute[watchAttribute].rules
  );

  return (
    //eslint-disable-next-line @typescript-eslint/no-misused-promises
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Flex>
        <Flex direction={{ default: "column" }} flex={{ default: "flex_3" }}>
          <FlexItem>
            <Controller
              name="attribute"
              control={control}
              render={({ field }) => (
                <FormGroup
                  label={"Attribute"}
                  fieldId={"rekor-search-attribute"}
                  labelHelp={
                    <Popover bodyContent={inputConfigByAttribute[watchAttribute].tooltipText} position={"right"}>
                      <FormGroupLabelHelp aria-label="More info for attribute field" />
                    </Popover>
                  }
                >
                  <FormSelect id="rekor-search-attribute" {...field} label="Attribute">
                    {ATTRIBUTES.map((attribute) => (
                      <FormSelectOption
                        label={inputConfigByAttribute[attribute].name}
                        key={attribute}
                        value={attribute}
                      />
                    ))}
                  </FormSelect>
                </FormGroup>
              )}
            />
          </FlexItem>
        </Flex>
        <Flex direction={{ default: "column" }} flex={{ default: "flex_3" }}>
          <FlexItem>
            <Controller
              name="value"
              control={control}
              rules={rules}
              render={({ field, fieldState }) => (
                <FormGroup
                  label={inputConfigByAttribute[watchAttribute].name}
                  labelInfo={inputConfigByAttribute[watchAttribute].helperText}
                  fieldId={`rekor-search-${inputConfigByAttribute[watchAttribute].name.toLowerCase()}`}
                >
                  <TextInput
                    aria-label={`${inputConfigByAttribute[watchAttribute].name} input field`}
                    {...field}
                    id={`rekor-search-${inputConfigByAttribute[watchAttribute].name.toLowerCase()}`}
                    name={inputConfigByAttribute[watchAttribute].name}
                    label={inputConfigByAttribute[watchAttribute].name}
                    placeholder={inputConfigByAttribute[watchAttribute].placeholder}
                    type={inputConfigByAttribute[watchAttribute].name === "email" ? "email" : "text"}
                    validated={fieldState.invalid ? "error" : "default"}
                  />
                  {fieldState.invalid && (
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem
                          icon={<ExclamationCircleIcon />}
                          variant={fieldState.invalid ? "error" : "success"}
                        >
                          {fieldState.invalid
                            ? fieldState.error?.message
                            : inputConfigByAttribute[watchAttribute].helperText}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  )}
                </FormGroup>
              )}
            />
          </FlexItem>
        </Flex>
        <Flex
          direction={{ default: "column" }}
          alignSelf={{ default: "alignSelfFlexEnd" }}
          flex={{ default: "flex_1" }}
        >
          <FlexItem>
            <Button
              variant="primary"
              id="search-form-button"
              isBlock={true}
              isLoading={isLoading}
              type="submit"
              spinnerAriaLabel={"Loading"}
              spinnerAriaLabelledBy={"search-form-button"}
            >
              Search
            </Button>
          </FlexItem>
        </Flex>
      </Flex>
    </Form>
  );
}
