import React, { Fragment } from "react";

import { PageSection } from "@patternfly/react-core";

import { AlertBanner } from "@app/components/AlertBanner";
import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { OperationalHealthTab } from "@app/pages/Dashboard/components/OperationalHealthTab";

export const OperationalHealth: React.FC = () => {
  return (
    <Fragment>
      <DocumentMetadata title="Operational Health" />
      <AlertBanner />
      <PageSection>
        <OperationalHealthTab />
      </PageSection>
    </Fragment>
  );
};
