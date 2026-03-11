import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { ApiError, type RekorError } from "rekor";
import { isAttribute, type RekorEntries, type SearchQuery, useRekorSearch } from "../api/rekor-api";
import { type FormInputs, SearchForm } from "./SearchForm";
import { Alert, Flex, Spinner, Stack, StackItem } from "@patternfly/react-core";
import { ResultsTable } from "./ResultsTable";

function isApiError(error: unknown): error is ApiError {
  return !!error && typeof error === "object" && Object.hasOwn(error, "body");
}

function isRekorError(error: unknown): error is RekorError {
  return !!error && typeof error === "object";
}

function Error({ error }: { error: unknown }) {
  let title = "Unknown error";
  let detail: string | undefined;

  if (isApiError(error)) {
    if (isRekorError(error.body)) {
      title = `Code ${error.body.code}: ${error.body.message}`;
    }
    detail = `${error.url}: ${error.status}`;
  } else if (typeof error == "string") {
    title = error;
  } else if (error instanceof TypeError) {
    title = error.message;
    detail = error.stack;
  }

  return (
    <Alert title={title} variant={"danger"}>
      {detail}
    </Alert>
  );
}

function ResultsSection({
  rekorEntries,
  page,
  onSetPage,
}: {
  rekorEntries?: RekorEntries;
  page: number;
  onSetPage: (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, _newPage: number) => void;
}) {
  if (!rekorEntries) {
    return null;
  }

  if (rekorEntries.entries.length === 0) {
    return <Alert title={"No matching entries found"} variant={"info"} />;
  }

  return <ResultsTable rekorEntries={rekorEntries} page={page} onSetPage={onSetPage} />;
}

function LoadingIndicator() {
  return (
    <Flex alignItems={{ default: "alignItemsCenter" }} direction={{ default: "column" }}>
      <Spinner />
    </Flex>
  );
}

export function Explorer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formInputs, setFormInputs] = useState<FormInputs>();
  const [query, setQuery] = useState<SearchQuery>();
  const search = useRekorSearch();

  const [data, setData] = useState<RekorEntries>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetch() {
      if (!query) {
        return;
      }
      setError(undefined);
      setLoading(true);
      try {
        setData(await search(query, page));
      } catch (e) {
        setError(e);
      }
      setLoading(false);
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetch();
  }, [query, page, search]);

  const setQueryParams = useCallback(
    (formInputs: FormInputs) => {
      setPage(1);

      void navigate({
        pathname: location.pathname,
        search: `?${formInputs.attribute}=${formInputs.value}`,
      });
    },
    [navigate, location.pathname]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const attribute = Array.from(searchParams.keys()).find((key) => isAttribute(key));
    const value = attribute && searchParams.get(attribute);

    if (!value || Array.isArray(value)) {
      return;
    }
    setFormInputs({ attribute, value });
  }, [location.search]);

  useEffect(() => {
    if (formInputs) {
      setPage(1);

      switch (formInputs.attribute) {
        case "logIndex":
          // eslint-disable-next-line no-case-declarations
          const query = parseInt(formInputs.value);
          if (!isNaN(query)) {
            // Ignore invalid numbers.
            setQuery({
              attribute: formInputs.attribute,
              query,
            });
          }
          break;
        default:
          setQuery({
            attribute: formInputs.attribute,
            query: formInputs.value,
          });
      }
    }
  }, [formInputs]);

  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <SearchForm defaultValues={formInputs} isLoading={loading} onSubmit={setQueryParams} />
      </StackItem>
      <StackItem>
        {error ? (
          <Error error={error} />
        ) : loading ? (
          <LoadingIndicator />
        ) : (
          <ResultsSection rekorEntries={data} page={page} onSetPage={onSetPage} />
        )}
      </StackItem>
    </Stack>
  );
}
