"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useMemo } from "react";
import { useAdminImages } from "@/hooks/queries";
import { useTheme } from "@/providers/useSiteTheme";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";
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
  const uiText = useUiTranslations();
  const { data, isLoading: loading, isError } = useAdminImages();
  const typedData = data as AdminImagesResponse | undefined;
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const unusedCount = useMemo(() => {
    if (!typedData) return 0;
    return typedData.files.filter((file) => file.usageCount === 0).length;
  }, [typedData]);

  const error = isError ? "Failed to load images" : null;

  return (
    <main className="flex flex-col gap-6 pb-10">
      <Card>
        <Hstack justify="between" className="flex-wrap gap-2">
          <Vstack align="start" gap={1}>
            <Text size="2xl" weight="bold">
               {uiText("AppStrings.ImageLibrary")} </Text>
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.UploadedImagesWithUsageCountsAndCleanupStatus")} </Text>
          </Vstack>
          <Button
            icon="rotateccw"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: queryKeys.admin.images(),
              })
            }
          >
             {uiText("AppStrings.Refresh")} </Button>
        </Hstack>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <Vstack align="start" gap={1}>
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.TotalFiles")} </Text>
            <Text size="2xl" weight="bold">
              {typedData?.totalFiles ?? 0}
            </Text>
          </Vstack>
        </Card>
        <Card>
          <Vstack align="start" gap={1}>
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.TotalSize")} </Text>
            <Text size="2xl" weight="bold">
              {formatBytes(typedData?.totalSize ?? 0)}
            </Text>
          </Vstack>
        </Card>
        <Card>
          <Vstack align="start" gap={1}>
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.UnusedFiles")} </Text>
            <Text size="2xl" weight="bold">
              {unusedCount}
            </Text>
            <Text size="xs" color="textFaded">
               {uiText("AppStrings.AutoDeletedAfter7DaysUnused")} </Text>
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
              typedData?.deletedCount ? (
                <Text size="xs" color="textFaded">
                   {uiText("AppStrings.Deleted")} {typedData.deletedCount}  {uiText("AppStrings.StaleFiles")} {formatBytes(typedData.deletedSize)}).
                </Text>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>{uiText("AppStrings.Preview")}</TableColumn>
              <TableColumn>{uiText("Settings.Name.Title")}</TableColumn>
              <TableColumn>{uiText("AppStrings.Size")}</TableColumn>
              <TableColumn>{uiText("AppStrings.Usage")}</TableColumn>
              <TableColumn>{uiText("AppStrings.LastModified")}</TableColumn>
            </TableHeader>
            <TableBody>
              {typedData?.files?.length ? (
                typedData.files.map((file) => (
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
                       {uiText("AppStrings.NoImagesFound")} </Text>
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
