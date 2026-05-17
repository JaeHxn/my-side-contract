import { ResultDetailClient } from "./ResultDetailClient";

interface ResultPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;

  return <ResultDetailClient resultId={id} />;
}
