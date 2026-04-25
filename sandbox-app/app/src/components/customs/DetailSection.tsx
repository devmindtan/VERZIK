import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  Group,
  Pagination,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";

const EXCLUDE_FIELDS = new Set(["__typename", "id"]);

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "✓ true" : "✗ false";
  if (typeof value === "number") return value.toLocaleString();
  const str = String(value);
  // Render timestamps as human dates
  if (/^\d{10}$/.test(str)) {
    const ts = new Date(Number(str) * 1000);
    if (!isNaN(ts.getTime())) return ts.toLocaleString();
  }
  return str;
}

function isMonoField(key: string, value: unknown): boolean {
  const str = String(value);
  return (
    key.toLowerCase().includes("hash") ||
    key.toLowerCase().includes("address") ||
    key.toLowerCase().includes("operator") ||
    key.toLowerCase().includes("slasher") ||
    key.toLowerCase().includes("admin") ||
    key.toLowerCase().includes("treasury") ||
    key.toLowerCase().includes("cid") ||
    key.toLowerCase().includes("id") ||
    (typeof value === "string" && str.startsWith("0x"))
  );
}

interface DetailSectionProps {
  title: string;
  items: Array<Record<string, unknown>>;
}

function normalizeKey(input: string): string {
  return input.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}

function getColumns(items: Array<Record<string, unknown>>): string[] {
  const keySet = new Set<string>();
  items.forEach((item) => {
    Object.keys(item).forEach((k) => {
      if (!EXCLUDE_FIELDS.has(k)) {
        keySet.add(k);
      }
    });
  });
  return Array.from(keySet);
}

export function DetailSection({ title, items }: DetailSectionProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const columns = useMemo(() => getColumns(items), [items]);
  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return items;
    }
    return items.filter((row) =>
      columns.some((column) =>
        String(row[column] ?? "")
          .toLowerCase()
          .includes(keyword),
      ),
    );
  }, [items, columns, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filteredItems.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  if (!items || items.length === 0) return null;

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text
          size="xs"
          fw={700}
          tt="uppercase"
          c="dimmed"
          style={{ letterSpacing: 0.5 }}
        >
          {title}
        </Text>
        <Badge size="xs" variant="light">
          {filteredItems.length}/{items.length}
        </Badge>
      </Group>
      <TextInput
        size="xs"
        placeholder="Tìm trong section này..."
        value={search}
        onChange={(event) => {
          setSearch(event.currentTarget.value);
          setPage(1);
        }}
      />
      <Card withBorder radius="sm" p={0}>
        <ScrollArea.Autosize mah={420}>
          <Table
            highlightOnHover
            verticalSpacing="xs"
            horizontalSpacing="sm"
            stickyHeader
          >
            <Table.Thead>
              <Table.Tr>
                {columns.map((column) => (
                  <Table.Th key={column}>{normalizeKey(column)}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visible.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={Math.max(1, columns.length)}>
                    <Text size="xs" c="dimmed" ta="center" py="sm">
                      Không có dữ liệu khớp bộ lọc.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
              {visible.map((item, i) => (
                <Table.Tr key={`${title}-${i}`}>
                  {columns.map((column) => (
                    <Table.Td key={column}>
                      <Text
                        size="xs"
                        ff={
                          isMonoField(column, item[column])
                            ? "monospace"
                            : undefined
                        }
                        style={{
                          wordBreak: "break-all",
                          whiteSpace: "normal",
                        }}
                      >
                        {formatValue(item[column])}
                      </Text>
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea.Autosize>
      </Card>

      {totalPages > 1 ? (
        <Group justify="flex-end">
          <Pagination
            total={totalPages}
            value={safePage}
            onChange={setPage}
            size="xs"
          />
        </Group>
      ) : null}
    </Stack>
  );
}

interface DetailPanelProps {
  data: Record<string, unknown> | null;
  loading?: boolean;
  /** Map từ data key → label hiển thị trên tab. Key nào không có sẽ fallback về normalizeKey(). */
  tabLabels?: Record<string, string>;
}

export function DetailPanel({ data, loading, tabLabels }: DetailPanelProps) {
  if (loading) {
    return (
      <Text size="sm" c="dimmed">
        Đang tải...
      </Text>
    );
  }
  if (!data) return null;

  const sections = Object.entries(data)
    .filter(([, v]) => Array.isArray(v))
    .map(
      ([key, value]) => [key, value as Array<Record<string, unknown>>] as const,
    )
    .sort((a, b) => b[1].length - a[1].length);

  if (sections.length === 0) {
    // Flat object – render as key-value
    return (
      <Card withBorder radius="sm" p="sm">
        <Stack gap={4}>
          {Object.entries(data)
            .filter(([k]) => !EXCLUDE_FIELDS.has(k))
            .map(([k, v]) => (
              <Group key={k} justify="space-between" wrap="nowrap" gap="md">
                <Text
                  size="xs"
                  c="dimmed"
                  style={{ minWidth: 140, flexShrink: 0 }}
                >
                  {k}
                </Text>
                <Text
                  size="xs"
                  ff={isMonoField(k, v) ? "monospace" : undefined}
                  ta="right"
                  style={{ wordBreak: "break-all" }}
                >
                  {formatValue(v)}
                </Text>
              </Group>
            ))}
        </Stack>
      </Card>
    );
  }

  const firstSection = sections[0]?.[0] ?? "";

  return (
    <Tabs defaultValue={firstSection} keepMounted={false}>
      <Tabs.List mb="xs">
        {sections.map(([key, arr]) => (
          <Tabs.Tab key={key} value={key}>
            <Group gap={6} wrap="nowrap">
              <Text size="xs">{tabLabels?.[key] ?? normalizeKey(key)}</Text>
              <Badge size="xs" variant="light">
                {arr.length}
              </Badge>
            </Group>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {sections.map(([key, arr]) => (
        <Tabs.Panel key={key} value={key}>
          <DetailSection title={key} items={arr} />
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
