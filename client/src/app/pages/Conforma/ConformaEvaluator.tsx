import type React from "react";
import { useMemo } from "react";
import { Alert, Content, PageSection } from "@patternfly/react-core";
import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { usePolicyEvaluate } from "@app/queries/conforma";
import { EvaluationForm } from "./components/EvaluationForm";
import { ResultsSummary } from "./components/ResultsSummary";
import { ConformaResultsTable } from "./components/ConformaResultsTable";
import {
  type ConformaComponent,
  type UIConformaData,
  type EvaluateRequest,
  ConformaResultStatus,
} from "./types";

const mapConformaResultData = (
  components: ConformaComponent[],
): UIConformaData[] => {
  return components.flatMap((comp) => {
    const mapRules = (
      rules: ConformaComponent["violations"],
      status: ConformaResultStatus,
    ): UIConformaData[] =>
      (rules ?? []).map((r) => ({
        title: r.metadata?.title ?? "",
        description: r.metadata?.description ?? "",
        status,
        component: comp.name,
        msg: r.msg,
        collection: r.metadata?.collections,
        solution: r.metadata?.solution,
        effectiveOn: r.metadata?.effective_on,
      }));

    return [
      ...mapRules(comp.violations, ConformaResultStatus.Failed),
      ...mapRules(comp.warnings, ConformaResultStatus.Warning),
      ...mapRules(comp.successes, ConformaResultStatus.Success),
    ];
  });
};

export const ConformaEvaluator: React.FC = () => {
  const { evaluate, isEvaluating, result, error, reset } =
    usePolicyEvaluate();

  const uiData = useMemo(
    () => (result ? mapConformaResultData(result.components) : []),
    [result],
  );

  const handleSubmit = (request: EvaluateRequest) => {
    reset();
    evaluate(request).catch(() => {});
  };

  return (
    <>
      <DocumentMetadata title="Conforma" />
      <PageSection variant="default">
        <Content>
          <h1>Conforma</h1>
          <p>
            Evaluate artifacts against Conforma policies to verify supply
            chain compliance.
          </p>
        </Content>
      </PageSection>

      <PageSection>
        <EvaluationForm onSubmit={handleSubmit} isEvaluating={isEvaluating} />
      </PageSection>

      {error && (
        <PageSection>
          <Alert variant="danger" title="Evaluation failed" isInline>
            {error.message || "An error occurred during policy evaluation."}
          </Alert>
        </PageSection>
      )}

      {result && (
        <>
          <PageSection>
            <Content component="h2">Results</Content>
            <ResultsSummary results={uiData} />
          </PageSection>
          <PageSection isFilled>
            <ConformaResultsTable results={uiData} />
          </PageSection>
        </>
      )}
    </>
  );
};
