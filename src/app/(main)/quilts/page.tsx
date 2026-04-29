"use client";

import { useEffect, useState } from "react";
import Link from "@/compat/next-link";
import { Button, Card, Hstack, Spinner, Text, Vstack } from "bioloom-ui";
import { listQuilts, type QuiltSummary } from "@/requests/quilt";
import { readArray } from "@/requests/helpers";

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function QuiltsPage() {
  const [quilts, setQuilts] = useState<QuiltSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadQuilts() {
    setLoading(true);
    try {
      const response = await listQuilts();
      if (response.ok) {
        setQuilts(await readArray<QuiltSummary>(response));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuilts();
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10">
      <Vstack align="stretch" className="gap-5">
        <Hstack justify="between" className="flex-wrap gap-3">
          <Vstack align="start" gap={0}>
            <Text size="3xl" weight="bold" color="text">
              Quilts
            </Text>
            <Text color="textFaded">
              Collaborative pixel art canvases built from community submissions.
            </Text>
          </Vstack>
          <Button size="sm" icon="rotateccw" onClick={loadQuilts}>
            Refresh
          </Button>
        </Hstack>

        {loading ? (
          <Hstack className="justify-center py-16">
            <Spinner />
            <Text color="textFaded">Loading quilts...</Text>
          </Hstack>
        ) : quilts.length === 0 ? (
          <Card>
            <Text color="textFaded">No quilts are available yet.</Text>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quilts.map((quilt) => (
              <Link key={quilt.id} href={`/quilts/${quilt.slug}`}>
                <Card className="h-full transition-transform hover:-translate-y-0.5">
                  <Vstack align="start" className="h-full">
                    <Text size="xl" weight="semibold" color="text">
                      {quilt.name}
                    </Text>
                    {quilt.description && (
                      <Text color="textFaded" className="line-clamp-2">
                        {quilt.description}
                      </Text>
                    )}
                    <div className="mt-auto grid w-full grid-cols-2 gap-2 text-sm text-zinc-400">
                      <span>{quilt.width} x {quilt.height}</span>
                      <span className="text-right">{quilt.acceptedCount} additions</span>
                      <span className="col-span-2">Ends {formatTime(quilt.endsAt)}</span>
                    </div>
                  </Vstack>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Vstack>
    </main>
  );
}
