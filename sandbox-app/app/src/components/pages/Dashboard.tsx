import {
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Table,
  Title,
  ThemeIcon,
  SimpleGrid,
} from "@mantine/core";
import {
  BuildingsIcon,
  UsersThreeIcon,
  FileTextIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import { WalletSession } from "../access";
import { shortBytes32 } from "../../utils/display";
import { useState, useEffect } from "react";
import type { DataResponseWithTotal } from "../../services/blockchain.query.service";
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}
import {
  fetchDocumentAnchoreds,
  fetchOperatorJoineds,
  fetchTenantCount,
  fetchDocumentCoSignQualifieds,
} from "../../services/blockchain.query.service";

function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
          {sub && (
            <Text size="xs" c="dimmed">
              {sub}
            </Text>
          )}
        </Stack>
        <ThemeIcon size="xl" radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

// const STATUS_COLOR: Record<string, string> = {
//   ACTIVE: "teal",
//   REVOKED: "red",
//   PENDING: "yellow",
// };

export function Dashboard({ session }: { session: WalletSession }) {
  const [documentAnchoreds, setDocumentAnchoreds] =
    useState<DataResponseWithTotal | null>(null);
  const [tenantCount, setTenantCount] = useState(0);
  const [operatorJoineds, setOperatorJoineds] =
    useState<DataResponseWithTotal | null>(null);
  const [documentCoSignQualifieds, setDocumentCoSignQualifieds] =
    useState<DataResponseWithTotal | null>(null);
  useEffect(() => {
    const handleFetchDocumentAnchoreds = async () => {
      try {
        // console.log("Đang gọi API test...");
        const data = await fetchDocumentAnchoreds();

        // console.log("Dữ liệu lưu vào state:", data);
        const result = data?.data;
        setDocumentAnchoreds(result ?? null);
      } catch (error) {
        console.error("Lỗi fetch:", error);
      }
    };
    const handleFetchTenantCount = async () => {
      try {
        const data = await fetchTenantCount();
        const total = data?.data;
        setTenantCount(Number(total));
      } catch (error) {
        console.error("Lỗi fetch:", error);
      }
    };
    const handleFetchOperatorJoineds = async () => {
      try {
        const data = await fetchOperatorJoineds();
        const result = data?.data;
        setOperatorJoineds(result ?? null);
      } catch (error) {
        console.error("Lỗi fetch:", error);
      }
    };

    const handleFetchDocumentCoSignQualifieds = async () => {
      try {
        const data = await fetchDocumentCoSignQualifieds();
        const result = data?.data;
        setDocumentCoSignQualifieds(result ?? null);
      } catch (error) {
        console.error("Lỗi fetch:", error);
      }
    };

    handleFetchDocumentAnchoreds();
    handleFetchTenantCount();
    handleFetchOperatorJoineds();
    handleFetchDocumentCoSignQualifieds();
  }, []);

  const title =
    session.primaryRole === "owner"
      ? "Tổng quan hệ thống"
      : session.primaryRole === "operator"
        ? "Bảng điều khiển Operator"
        : `Bảng điều khiển Tenant #${shortBytes32(session.tenantId)}`;

  return (
    <Stack gap="xl">
      <Title order={3}>{title}</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <StatCard
          label="Tổng Tenants"
          value={String(tenantCount || "-")}
          icon={<BuildingsIcon size={22} />}
          color="teal"
          sub="Dữ liệu từ reader"
        />
        <StatCard
          label="Tổng Operators"
          value={String(operatorJoineds?.total || "-")}
          icon={<UsersThreeIcon size={22} />}
          color="teal"
          sub="Dữ liệu từ graph"
        />
        <StatCard
          label="Tổng tài liệu"
          value={String(documentAnchoreds?.total || "-")}
          icon={<FileTextIcon size={22} />}
          color="violet"
          sub="Đã/chưa đủ tiêu chuẩn"
        />
        <StatCard
          label="Tài liệu đủ tiêu chuẩn"
          value={String(documentCoSignQualifieds?.total || "-")}
          icon={<SealCheckIcon size={22} />}
          color="orange"
          sub="Đã đủ tiêu chuẩn"
        />
      </SimpleGrid>

      <Grid>
        {/* Recent documents */}
        <Grid.Col span={{ base: 12, md: 12 }}>
          <Card withBorder radius="md" padding="md">
            <Text fw={600} mb="md">
              Tài liệu gần đây
            </Text>
            <Table highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Document ID</Table.Th>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Loại tài liệu</Table.Th>
                  <Table.Th>Phiên bản</Table.Th>
                  <Table.Th>Thời gian</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {documentAnchoreds?.data.map((doc: any) => (
                  <Table.Tr key={doc.id}>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {doc.id.substring(0, 10)}...
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {(doc.tenantId || doc.tenant).substring(0, 10)}...
                    </Table.Td>
                    <Table.Td>{doc.docType}</Table.Td>
                    <Table.Td>{doc.version || 0}</Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(
                          Number(doc.blockTimestamp) * 1000,
                        ).toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}

                {documentAnchoreds?.total === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5} align="center" py="xl">
                      <Text size="sm" c="dimmed">
                        Chưa tìm thấy tài liệu nào được ghi nhận trên Graph.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
