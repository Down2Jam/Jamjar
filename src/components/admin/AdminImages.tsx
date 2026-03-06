"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminImages } from "@/requests/admin";
import { useTheme } from "@/providers/SiteThemeProvider";
import {
  Button,
  Card,
  Hstack,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Text,
  Vstack,
} from "bioloom-ui";

type AdminImageEntry = {
  name: string;
  url: string;
  size: number;
  usageCount: number;
  lastModified: string;
};

type AdminImagesResponse = {
  totalFiles: number;
  totalSize: number;
  deletedCount: number;
  deletedSize: number;
  files: AdminImageEntry[];
};

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024)
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export default function AdminImages() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminImagesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  const loadImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminImages();
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setError(json?.message ?? "Failed to load images");
        setData(null);
        return;
      }
      const json = await response.json();
      setData(json.data as AdminImagesResponse);
    } catch (err) {
      console.error(err);
      setError("Failed to load images");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const unusedCount = useMemo(() => {
    if (!data) return 0;
    return data.files.filter((file) => file.usageCount === 0).length;
  }, [data]);

  return (
    <main className="flex flex-col gap-6 pb-10">
      <Card>
        <Hstack justify="between" className="flex-wrap gap-2">
          <Vstack align="start" gap={1}>
            <Text size="2xl" weight="bold">
              Image Library
            </Text>
            <Text size="sm" color="textFaded">
              Uploaded images with usage counts and cleanup status.
            </Text>
          </Vstack>
          <Button icon="rotateccw" onClick={loadImages}>
            Refresh
          </Button>
        </Hstack>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <Vstack align="start" gap={1}>
            <Text size="sm" color="textFaded">
              Total Files
            </Text>
            <Text size="2xl" weight="bold">
              {data?.totalFiles ?? 0}
            </Text>
          </Vstack>
        </Card>
        <Card>
          <Vstack align="start" gap={1}>
            <Text size="sm" color="textFaded">
              Total Size
            </Text>
            <Text size="2xl" weight="bold">
              {formatBytes(data?.totalSize ?? 0)}
            </Text>
          </Vstack>
        </Card>
        <Card>
          <Vstack align="start" gap={1}>
            <Text size="sm" color="textFaded">
              Unused Files
            </Text>
            <Text size="2xl" weight="bold">
              {unusedCount}
            </Text>
            <Text size="xs" color="textFaded">
              Auto-deleted after 7 days unused.
            </Text>
          </Vstack>
        </Card>
      </section>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <Text color="red">{error}</Text>
        ) : (
          <Table
            bottomContent={
              data?.deletedCount ? (
                <Text size="xs" color="textFaded">
                  Deleted {data.deletedCount} stale files (
                  {formatBytes(data.deletedSize)}).
                </Text>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>Preview</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Size</TableColumn>
              <TableColumn>Usage</TableColumn>
              <TableColumn>Last Modified</TableColumn>
            </TableHeader>
            <TableBody>
              {data?.files?.length ? (
                data.files.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell>
                      <div
                        className="h-12 w-12 rounded-lg overflow-hidden border"
                        style={{ borderColor: colors["base"] }}
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">{file.name}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">{formatBytes(file.size)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">{file.usageCount}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">
                        {new Date(file.lastModified).toLocaleString()}
                      </Text>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Text size="sm" color="textFaded">
                      No images found.
                    </Text>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </main>
  );
}
