import type React from "react";

import { Page, SkipToContent } from "@patternfly/react-core";

import { PageContentWithDrawerProvider } from "@app/components/PageDrawerContext";
import { MockHealthControls } from "@app/components/MockHealthControls";
import { MockHealthProvider } from "@app/components/MockHealthProvider";

import { HeaderApp } from "./header";
import { SidebarApp } from "./sidebar";

interface DefaultLayoutProps {
  children?: React.ReactNode;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const pageId = "main-content-page-layout-horizontal-nav";
  const PageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>;

  return (
    <MockHealthProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <MockHealthControls />
        <Page
          masthead={<HeaderApp />}
          sidebar={<SidebarApp />}
          isManagedSidebar
          defaultManagedSidebarIsOpen
          skipToContent={PageSkipToContent}
          mainContainerId={pageId}
          style={{ flex: 1, minHeight: 0 }}
        >
          <PageContentWithDrawerProvider>{children}</PageContentWithDrawerProvider>
        </Page>
      </div>
    </MockHealthProvider>
  );
};
