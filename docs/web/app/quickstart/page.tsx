import { SimpleDocPage } from "../_components/simple-doc-page";
import { simplePageCopy } from "../lib/site-copy";

export default function QuickstartPage() {
  return <SimpleDocPage locale="en" page={simplePageCopy.en.quickstart} />;
}
