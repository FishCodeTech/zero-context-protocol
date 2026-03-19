import { SimpleDocPage } from "../_components/simple-doc-page";
import { simplePageCopy } from "../lib/site-copy";

export default function SDKPage() {
  return <SimpleDocPage locale="en" page={simplePageCopy.en.sdk} />;
}
