import { useEffect, useState } from "react";
import {
  Stack,
  Title,
  Group,
  Button,
  Table,
  Text,
  Badge,
  Divider,
  Modal,
  TextInput,
  Select,
  ActionIcon,
  Tooltip,
  Card,
  Tabs,
  Loader,
} from "@mantine/core";
import {
  PlusIcon,
  ArrowClockwiseIcon,
  EyeIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import type { TenantInfo } from "../../utils/types";
import { shortAddress, shortBytes32 } from "../../utils/display";
import {
  fetchTenantCreateds,
  fetchTenantCurrentInfo,
  fetchTenantInfoById,
  fetchTenantRuntimeConfig,
} from "../../services/blockchain.query.service";
import { DetailPanel } from "../customs/DetailSection";
import { CopyableValue, InfoFieldList } from "../customs/InfoFields";

function getLastEventRecord(
  detailData: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  const list = detailData?.[key];
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  return list[0] as Record<string, unknown>;
}

function getDisplayTimestamp(input: unknown): string {
  const value = Number(input ?? 0);
  if (!value) {
    return "-";
  }
  return new Date(value * 1000).toLocaleString();
}
type TenantTableRow = {
  id: string;
  tenantId: string;
  admin: string;
  manager: string;
  treasury: string;
  blockTimestamp: string;
  isActive?: boolean;
};

function mapTenantRow(input: Record<string, unknown>): TenantTableRow {
  const id = String(input.id ?? "");
  const tenantId = String(input.tenantId ?? input.id ?? "");
  const admin = String(input.admin ?? "");
  const manager = String(input.manager ?? input.operatorManager ?? "");
  const treasury = String(input.treasury ?? "");
  const blockTimestamp = String(input.blockTimestamp ?? input.createdAt ?? "0");
  const isActive =
    typeof input.isActive === "boolean" ? input.isActive : undefined;

  return {
    id,
    tenantId,
    admin,
    manager,
    treasury,
    blockTimestamp,
    isActive,
  };
}

function CreateTenantModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Tạo Tenant mới" size="md">
      <Stack gap="md">
        <TextInput
          label="Tên Tenant"
          placeholder="Nhập tên tenant..."
          required
        />
        <TextInput
          label="Admin address"
          placeholder="0x..."
          ff="monospace"
          required
        />
        <TextInput
          label="Minimum Operator Stake (ETH)"
          placeholder="100"
          type="number"
        />
        <TextInput
          label="Cooldown Unstake (giây)"
          placeholder="604800"
          type="number"
        />
        <Select
          label="Trạng thái ban đầu"
          defaultValue="ACTIVE"
          data={["ACTIVE", "SUSPENDED"]}
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Hủy
          </Button>
          <Button color="teal">Tạo Tenant</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function TenantDetailModal({
  tenant,
  opened,
  onClose,
  canEditTenantConfig,
  canSetTenantStatus,
}: {
  tenant: TenantTableRow | null;
  opened: boolean;
  onClose: () => void;
  canEditTenantConfig: boolean;
  canSetTenantStatus: boolean;
}) {
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [currentTenantInfo, setCurrentTenantInfo] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [currentRuntimeConfig, setCurrentRuntimeConfig] = useState<{
    minOperatorStake: number;
    unstakeCooldown: number;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const latestTenantCreated = getLastEventRecord(detailData, "tenantCreateds");
  const latestStatusUpdated = getLastEventRecord(
    detailData,
    "tenantStatusUpdateds",
  );
  const latestMinStake = getLastEventRecord(
    detailData,
    "minOperatorStakeUpdateds",
  );
  const latestCooldown = getLastEventRecord(
    detailData,
    "unstakeCooldownUpdateds",
  );

  const currentTreasury =
    String(
      currentTenantInfo?.treasury ??
        latestTenantCreated?.treasury ??
        tenant?.treasury ??
        "-",
    ) || "-";
  const currentStatus =
    currentTenantInfo?.isActive === true ||
    currentTenantInfo?.isActive === "true"
      ? "ACTIVE"
      : currentTenantInfo?.isActive === false ||
          currentTenantInfo?.isActive === "false"
        ? "INACTIVE"
        : latestStatusUpdated?.isActive === true ||
            latestStatusUpdated?.isActive === "true"
          ? "ACTIVE"
          : latestStatusUpdated
            ? "INACTIVE"
            : tenant?.isActive === false
              ? "INACTIVE"
              : "ACTIVE";
  const minStakeValue = String(
    currentRuntimeConfig?.minOperatorStake ??
      latestMinStake?.newValue ??
      latestMinStake?.newMinStake ??
      "-",
  );
  const cooldownValue = String(
    currentRuntimeConfig?.unstakeCooldown ??
      latestCooldown?.newValue ??
      latestCooldown?.newCooldown ??
      "-",
  );

  useEffect(() => {
    const loadDetail = async () => {
      if (!tenant || !opened) {
        return;
      }

      setLoadingDetail(true);
      try {
        const [detailResponse, currentInfoResponse, runtimeResponse] =
          await Promise.all([
            fetchTenantInfoById(tenant.tenantId),
            fetchTenantCurrentInfo(tenant.tenantId),
            fetchTenantRuntimeConfig(tenant.tenantId),
          ]);

        setDetailData(detailResponse?.success ? detailResponse.data : null);
        setCurrentTenantInfo(
          currentInfoResponse?.success ? currentInfoResponse.data : null,
        );
        setCurrentRuntimeConfig(
          runtimeResponse?.success ? runtimeResponse.data : null,
        );
      } catch (error) {
        console.error("Lỗi fetch tenant detail:", error);
        setDetailData(null);
        setCurrentTenantInfo(null);
        setCurrentRuntimeConfig(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [tenant, opened]);

  if (!tenant) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Chi tiết Tenant: ${shortBytes32(tenant.id)}`}
      size="xl"
    >
      <Tabs defaultValue="info">
        <Tabs.List mb="md">
          <Tabs.Tab value="info">Thông tin</Tabs.Tab>
          {canEditTenantConfig && (
            <Tabs.Tab value="config">Runtime Config</Tabs.Tab>
          )}
          {canSetTenantStatus && <Tabs.Tab value="actions">Hành động</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="info">
          <Stack gap="sm">
            <Card withBorder radius="sm" p="sm">
              <InfoFieldList
                items={[
                  {
                    label: "Tenant ID",
                    value: String(currentTenantInfo?.id ?? tenant.tenantId),
                    mono: true,
                  },
                  {
                    label: "Current Admin",
                    value: String(currentTenantInfo?.admin ?? tenant.admin),
                    mono: true,
                  },
                  {
                    label: "Current Operator Manager",
                    value: String(
                      currentTenantInfo?.operatorManager ?? tenant.manager,
                    ),
                    mono: true,
                  },
                  {
                    label: "Current Treasury",
                    value: currentTreasury,
                    mono: true,
                  },
                  {
                    label: "Current Status",
                    value: currentStatus,
                  },
                  {
                    label: "Current Created At",
                    value:
                      currentTenantInfo?.createdAt !== undefined &&
                      Number(currentTenantInfo.createdAt) > 0
                        ? new Date(
                            Number(currentTenantInfo.createdAt) * 1000,
                          ).toLocaleString()
                        : "-",
                  },
                ]}
              />
            </Card>

            {loadingDetail ? <Loader size="sm" /> : null}
            <DetailPanel
              data={detailData}
              loading={loadingDetail}
              tabLabels={{
                tenantCreateds: "Tổng quan",
                tenantStatusUpdateds: "Trạng thái",
                minOperatorStakeUpdateds: "Tiền cọc tối thiểu",
                unstakeCooldownUpdateds: "Thời gian chờ",
              }}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="config">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text fw={600}>Runtime Config hiện tại</Text>
              <Badge color={currentStatus === "ACTIVE" ? "teal" : "red"}>
                {currentStatus}
              </Badge>
            </Group>

            <Card withBorder radius="sm" p="sm">
              <Stack gap={8}>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Treasury Address
                  </Text>
                  <Text size="sm" ff="monospace">
                    {shortAddress(currentTreasury)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Min Operator Stake
                  </Text>
                  <Text size="sm" ff="monospace">
                    {minStakeValue}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Unstake Cooldown
                  </Text>
                  <Text size="sm" ff="monospace">
                    {cooldownValue}
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Divider label="Thời điểm cập nhật gần nhất" />

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Status Updated At
              </Text>
              <Text size="sm">
                {getDisplayTimestamp(latestStatusUpdated?.blockTimestamp)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Min Stake Updated At
              </Text>
              <Text size="sm">
                {getDisplayTimestamp(latestMinStake?.blockTimestamp)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Cooldown Updated At
              </Text>
              <Text size="sm">
                {getDisplayTimestamp(latestCooldown?.blockTimestamp)}
              </Text>
            </Group>

            <Text size="xs" c="dimmed">
              Runtime config ưu tiên dữ liệu current-state từ view API; lịch sử
              cập nhật giữ ở phần event.
            </Text>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="actions">
          <Stack gap="sm" mt="xs">
            <Button variant="light" color="teal" fullWidth>
              Kích hoạt Tenant
            </Button>
            <Button variant="light" color="red" fullWidth>
              Tạm dừng Tenant
            </Button>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

export function Tenants({
  tenantId,
  tenants,
  canCreateTenant,
  canEditTenantConfig,
  canSetTenantStatus,
}: {
  tenantId?: string;
  tenants: TenantInfo[];
  canCreateTenant: boolean;
  canEditTenantConfig: boolean;
  canSetTenantStatus: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<TenantTableRow | null>(null);
  const [tenantRows, setTenantRows] = useState<TenantTableRow[]>([]);

  useEffect(() => {
    const loadTenantRows = async () => {
      try {
        const response = await fetchTenantCreateds();
        if (response?.success && Array.isArray(response.data)) {
          setTenantRows(
            response.data.map((item) =>
              mapTenantRow(item as Record<string, unknown>),
            ),
          );
          return;
        }
      } catch (error) {
        console.error("Lỗi fetch tenant-createds:", error);
      }

      const fallbackRows = tenants.map((tenant) =>
        mapTenantRow(tenant as unknown as Record<string, unknown>),
      );
      setTenantRows(fallbackRows);
    };

    loadTenantRows();
  }, [tenants]);

  const rows = tenantId
    ? tenantRows.filter((tenant) => tenant.tenantId === tenantId)
    : tenantRows;

  const handleRefresh = async () => {
    try {
      const response = await fetchTenantCreateds();
      if (response?.success && Array.isArray(response.data)) {
        setTenantRows(
          response.data.map((item) =>
            mapTenantRow(item as Record<string, unknown>),
          ),
        );
      }
    } catch (error) {
      console.error("Lỗi refresh tenant-createds:", error);
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={3}>
          {tenantId ? `Tenant #${shortBytes32(tenantId)}` : "Quản lý Tenants"}
        </Title>
        <Group gap="xs">
          <Tooltip label="Làm mới">
            <ActionIcon variant="default" size="lg" onClick={handleRefresh}>
              <ArrowClockwiseIcon size={16} />
            </ActionIcon>
          </Tooltip>
          {canCreateTenant && (
            <Button
              leftSection={<PlusIcon size={16} />}
              color="teal"
              onClick={() => setCreateOpen(true)}
            >
              Tạo Tenant
            </Button>
          )}
        </Group>
      </Group>

      <Card withBorder radius="md" padding={0}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Tenant ID</Table.Th>
              <Table.Th>Admin</Table.Th>
              <Table.Th>Manager</Table.Th>
              <Table.Th>Treasury</Table.Th>
              <Table.Th>Ngày tạo</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((t) => (
              <Table.Tr key={t.id}>
                <Table.Td>
                  <CopyableValue value={t.id} mono />
                </Table.Td>
                <Table.Td>
                  <CopyableValue value={t.tenantId} mono />
                </Table.Td>
                <Table.Td>
                  <CopyableValue value={t.admin} mono />
                </Table.Td>
                <Table.Td>
                  <CopyableValue value={t.manager} mono />
                </Table.Td>
                <Table.Td>
                  <CopyableValue value={t.treasury} mono />
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {new Date(
                      Number(t.blockTimestamp) * 1000,
                    ).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <Tooltip label="Xem chi tiết">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => setDetail(t)}
                      >
                        <EyeIcon size={14} />
                      </ActionIcon>
                    </Tooltip>
                    {canEditTenantConfig && (
                      <Tooltip label="Chỉnh sửa">
                        <ActionIcon size="sm" variant="subtle">
                          <PencilSimpleIcon size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <CreateTenantModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <TenantDetailModal
        tenant={detail}
        opened={!!detail}
        onClose={() => setDetail(null)}
        canEditTenantConfig={canEditTenantConfig}
        canSetTenantStatus={canSetTenantStatus}
      />
    </Stack>
  );
}
