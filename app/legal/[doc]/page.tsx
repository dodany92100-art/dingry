import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL_DOCUMENTS, type LegalDocId } from "@/lib/legal-placeholders";

const DOCS: LegalDocId[] = ["mentions", "cgv", "rgpd", "retours"];

type PageProps = { params: Promise<{ doc: string }> };

function isLegalDocId(value: string): value is LegalDocId {
  return DOCS.includes(value as LegalDocId);
}

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: PageProps) {
  const { doc } = await params;
  if (!isLegalDocId(doc)) return {};
  return {
    title: `${LEGAL_DOCUMENTS[doc].title} — DINGRY`,
    robots: { index: false, follow: false },
  };
}

export default async function LegalDocPage({ params }: PageProps) {
  const { doc } = await params;
  if (!isLegalDocId(doc)) notFound();
  const content = LEGAL_DOCUMENTS[doc];

  return (
    <article>
      <Link
        href="/"
        className="text-[10px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white"
      >
        ← Boutique
      </Link>
      <h1 className="mt-6 text-2xl font-bold uppercase tracking-wide">{content.title}</h1>
      <p className="mt-2 text-sm text-white/50">{content.subtitle}</p>
      <div className="mt-8 space-y-6">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/80">
              {section.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
