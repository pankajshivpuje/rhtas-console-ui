import type React from "react";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";
import type { UIConformaData } from "../types";

interface ConformaExpandedRowProps {
  data: UIConformaData;
}

export const ConformaExpandedRow: React.FC<ConformaExpandedRowProps> = ({
  data,
}) => {
  if (
    !data.description &&
    !data.collection?.length &&
    !data.solution &&
    !data.effectiveOn
  ) {
    return null;
  }

  return (
    <DescriptionList isHorizontal>
      {data.description && (
        <DescriptionListGroup>
          <DescriptionListTerm>Description</DescriptionListTerm>
          <DescriptionListDescription>
            {data.description}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {data.collection?.length ? (
        <DescriptionListGroup>
          <DescriptionListTerm>Collection</DescriptionListTerm>
          <DescriptionListDescription>
            {data.collection.join(", ")}
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}
      {data.solution && (
        <DescriptionListGroup>
          <DescriptionListTerm>Solution</DescriptionListTerm>
          <DescriptionListDescription>
            {data.solution}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {data.effectiveOn && (
        <DescriptionListGroup>
          <DescriptionListTerm>Effective from</DescriptionListTerm>
          <DescriptionListDescription>
            {data.effectiveOn}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </DescriptionList>
  );
};
