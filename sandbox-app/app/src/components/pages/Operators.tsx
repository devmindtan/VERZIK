import { useEffect, useState } from "react";
import {
  Stack,
  Title,
  Group,
  Button,
  Table,
  Badge,
  Text,
  Modal,
  TextInput,
  Select,
  ActionIcon,
  Tooltip,
  Card,
  Tabs,
  NumberInput,
  Avatar,
  Loader,
} from "@mantine/core";
import {
  PlusIcon,
  ArrowClockwiseIcon,
  EyeIcon,
  CurrencyEthIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import type { OperatorStatus } from "../../utils/types";
import { shortBytes32 } from "../../utils/display";
import {
  fetchNonceCountByTenantAndOperator,
  fetchNonceConsumeds,
  fetchOperatorCurrentStatus,
  fetchOperatorInfoById,
  fetchOperatorJoineds,
} from "../../services/blockchain.query.service";
import { DetailPanel } from "../customs/DetailSection";
import { CopyableValue, InfoFieldList } from "../customs/InfoFields";
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "teal",
  SLASHED: "red",
  UNSTAKING: "yellow",
  INACTIVE: "gray",
};

function JoinOperatorModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Tham gia làm Operator"
      size="md"
    >
      <Stack gap="md">
        <Select label="Tenant ID" placeholder="1" required />
        <TextInput
          label="Operator address"
          placeholder="0x..."
          ff="monospace"
          required
        />
        <TextInput label="Metadata URI" placeholder="ipfs://..." />
        <NumberInput label="Stake ban đầu (ETH)" placeholder="100" min={0} />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Hủy
          </Button>
          <Button color="teal">Tham gia</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

type OperatorTableRow = {
  id: string;
  walletAddress: string;
  metadata: string;
  stakeAmount: string;
  tenantId: string;
  blockTimestamp: string;
  isActive?: boolean;
};

type NonceConsumedRow = {
  id: string;
  tenantId: string;
  signer: string;
  oldNonce: string;
  newNonce: string;
  blockTimestamp: string;
  transactionHash: string;
};

function toOperatorTableRow(
  input: Record<string, unknown>,
  defaultTenantId?: string,
): OperatorTableRow {
  return {
    id: String(input.id ?? ""),
    walletAddress: String(input.operator ?? input.walletAddress ?? ""),
    metadata: String(input.metadata ?? ""),
    stakeAmount: `${String(input.stake ?? input.stakeAmount ?? "0")} wei`,
    tenantId: String(input.tenantId ?? defaultTenantId ?? ""),
    blockTimestamp: String(input.blockTimestamp ?? "0"),
    isActive: input.isActive === true ? true : undefined,
  };
}

function toNonceConsumedRow(input: Record<string, unknown>): NonceConsumedRow {
  return {
    id: String(input.id ?? ""),
    tenantId: String(input.tenantId ?? ""),
    signer: String(input.signer ?? ""),
    oldNonce: String(input.oldNonce ?? "0"),
    newNonce: String(input.newNonce ?? "0"),
    blockTimestamp: String(input.blockTimestamp ?? "0"),
    transactionHash: String(input.transactionHash ?? ""),
  };
}

function OperatorDetailModal({
  op,
  opened,
  onClose,
  canManageOperators,
  canManageStake,
  tenantId,
}: {
  op: OperatorTableRow | null;
  opened: boolean;
  onClose: () => void;
  canManageOperators: boolean;
  canManageStake: boolean;
  tenantId?: string;
}) {
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [currentStatus, setCurrentStatus] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [nonceCount, setNonceCount] = useState<number | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const latestJoinedTs = (() => {
    const history = detailData?.operatorJoineds;
    if (!Array.isArray(history) || history.length === 0) {
      return Number(op?.blockTimestamp ?? 0);
    }
    return history.reduce((latest, item) => {
      const row = item as Record<string, unknown>;
      const ts = Number(row.blockTimestamp ?? 0);
      return ts > latest ? ts : latest;
    }, 0);
  })();

  useEffect(() => {
    const loadDetail = async () => {
      if (!op || !opened) {
        return;
      }

      const resolvedTenantId = tenantId ?? op.tenantId;
      if (!resolvedTenantId) {
        setDetailData(null);
        setNonceCount(null);
        return;
      }

      setLoadingDetail(true);
      try {
        const [detailResponse, nonceResponse, statusResponse] =
          await Promise.all([
            fetchOperatorInfoById(resolvedTenantId, op.walletAddress),
            fetchNonceCountByTenantAndOperator(
              resolvedTenantId,
              op.walletAddress,
            ),
            fetchOperatorCurrentStatus(resolvedTenantId, op.walletAddress),
          ]);

        setDetailData(detailResponse?.success ? detailResponse.data : null);
        setNonceCount(
          nonceResponse?.success ? Number(nonceResponse.data) : null,
        );
        setCurrentStatus(statusResponse?.success ? statusResponse.data : null);
      } catch (error) {
        console.error("Lỗi fetch operator detail:", error);
        setDetailData(null);
        setNonceCount(null);
        setCurrentStatus(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [op, opened, tenantId]);

  if (!op) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Chi tiết Operator"
      size="xl"
    >
      <Tabs defaultValue="info">
        <Tabs.List mb="md">
          <Tabs.Tab value="info">Thông tin</Tabs.Tab>
          {canManageStake && <Tabs.Tab value="stake">Stake</Tabs.Tab>}
          {(canManageOperators || canManageStake) && (
            <Tabs.Tab value="actions">Hành động</Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="info">
          <Stack gap="sm">
            <InfoFieldList
              items={[
                { label: "Operator", value: op.walletAddress, mono: true },
                { label: "Tenant", value: op.tenantId, mono: true },
                {
                  label: "Trạng thái hiện tại",
                  value:
                    currentStatus?.isActive === true ||
                    currentStatus?.isActive === "true"
                      ? "ACTIVE"
                      : currentStatus?.exists === false
                        ? "-"
                        : currentStatus?.isActive === false ||
                            currentStatus?.isActive === "false"
                          ? "INACTIVE"
                          : op.isActive === true
                            ? "ACTIVE"
                            : "-",
                },
                {
                  label: "Stake hiện tại",
                  value:
                    currentStatus?.stakeAmount !== undefined
                      ? String(currentStatus.stakeAmount)
                      : op.stakeAmount,
                  mono: true,
                },
                {
                  label: "Nonce hiện tại",
                  value:
                    currentStatus?.nonce !== undefined
                      ? String(currentStatus.nonce)
                      : nonceCount !== null
                        ? String(nonceCount)
                        : "-",
                },
                {
                  label: "Can Unstake Now",
                  value:
                    currentStatus?.canUnstakeNow === true
                      ? "true"
                      : currentStatus?.canUnstakeNow === false
                        ? "false"
                        : "-",
                },
                {
                  label: "Unstake Ready At",
                  value:
                    currentStatus?.unstakeReadyAt !== undefined &&
                    Number(currentStatus.unstakeReadyAt) > 0
                      ? new Date(
                          Number(currentStatus.unstakeReadyAt) * 1000,
                        ).toLocaleString()
                      : "-",
                },
                {
                  label: "Recovery Delegate",
                  value: String(currentStatus?.recoveryDelegate ?? "-"),
                  mono: true,
                },
                {
                  label: "Created At (graph latest)",
                  value:
                    latestJoinedTs > 0
                      ? new Date(latestJoinedTs * 1000).toLocaleString()
                      : "-",
                },
              ]}
            />

            {loadingDetail ? <Loader size="sm" /> : null}
            <DetailPanel
              data={detailData}
              loading={loadingDetail}
              tabLabels={{
                operatorJoineds: "Cấu hình ban đầu",
                operatorStatusUpdateds: "Trạng thái",
                operatorSlasheds: "Hard Slash",
                operatorSoftSlasheds: "Soft Slash",
                operatorRecoveryDelegateUpdateds: "Recovery Delegate",
                operatorUnstakeRequesteds: "Yêu cầu rút",
                operatorStakeToppedUps: "Tăng stake",
                coSignOperatorConfigureds: "Quyền đồng kí",
              }}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="stake">
          <Stack gap="md" mt="xs">
            <Group justify="space-between">
              <Text size="sm">Stake hiện tại</Text>
              <Text fw={700}>{op.stakeAmount}</Text>
            </Group>
            <Text size="sm" c="dimmed">
              Tối thiểu stake phụ thuộc runtime config của tenant.
            </Text>
            <TextInput
              label="Nạp thêm stake (ETH)"
              placeholder="Nhập số ETH..."
            />
            <Button
              leftSection={<CurrencyEthIcon size={16} />}
              variant="light"
              color="teal"
            >
              Top up Stake
            </Button>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="actions">
          <Stack gap="sm" mt="xs">
            {canManageOperators && (
              <Button variant="light" color="teal" fullWidth>
                Kích hoạt
              </Button>
            )}
            {canManageStake && (
              <>
                <Button variant="light" color="yellow" fullWidth>
                  Yêu cầu Unstake
                </Button>
                <Button variant="light" color="blue" fullWidth>
                  Thực hiện Unstake
                </Button>
              </>
            )}
            {canManageOperators && (
              <Button
                variant="light"
                color="red"
                fullWidth
                leftSection={<WarningIcon size={16} />}
              >
                Thu hồi (Admin)
              </Button>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

export function Operators({
  tenantId,
  operatorsData,
  canJoinOperator,
  canManageOperators,
  canManageStake,
}: {
  tenantId?: string;
  operatorsData: OperatorStatus[];
  canJoinOperator: boolean;
  canManageOperators: boolean;
  canManageStake: boolean;
}) {
  const [joinOpen, setJoinOpen] = useState(false);
  const [detail, setDetail] = useState<OperatorTableRow | null>(null);
  const [apiRows, setApiRows] = useState<OperatorTableRow[]>([]);
  const [nonceRows, setNonceRows] = useState<NonceConsumedRow[]>([]);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        const [operatorResponse, nonceResponse] = await Promise.all([
          fetchOperatorJoineds(),
          fetchNonceConsumeds(),
        ]);

        const list = operatorResponse?.data?.data;

        if (Array.isArray(list)) {
          const mapped = list.map((item) =>
            toOperatorTableRow(item as Record<string, unknown>, tenantId),
          );
          const statusByKey = new Map<string, boolean>();
          const statusRequests = mapped
            .filter((item) => item.tenantId && item.walletAddress)
            .map(async (item) => {
              const detail = await fetchOperatorInfoById(
                item.tenantId,
                item.walletAddress,
              );
              const history = detail?.data?.operatorStatusUpdateds;
              if (Array.isArray(history) && history.length > 0) {
                const latest = history[0] as Record<string, unknown>;
                statusByKey.set(
                  `${item.tenantId}-${item.walletAddress}`,
                  latest.isActive === true || latest.isActive === "true",
                );
              }
            });
          await Promise.all(statusRequests);

          setApiRows(
            mapped.map((item) => ({
              ...item,
              isActive:
                statusByKey.get(`${item.tenantId}-${item.walletAddress}`) ??
                item.isActive,
            })),
          );

          if (nonceResponse?.success && Array.isArray(nonceResponse.data)) {
            setNonceRows(
              nonceResponse.data.map((item) =>
                toNonceConsumedRow(item as Record<string, unknown>),
              ),
            );
          }
          return;
        }
      } catch (error) {
        console.error("Lỗi fetch operator-joineds:", error);
      }

      setApiRows(
        operatorsData.map((operator) => ({
          id: operator.walletAddress,
          walletAddress: operator.walletAddress,
          metadata: "",
          stakeAmount: operator.stakeAmount,
          tenantId: tenantId ?? "",
          blockTimestamp: "0",
          isActive: operator.isActive,
        })),
      );

      setNonceRows([]);
    };

    loadOperators();
  }, [operatorsData, tenantId]);

  const filtered = tenantId
    ? apiRows.filter((item) => item.tenantId === tenantId)
    : apiRows;

  const filteredNonces = tenantId
    ? nonceRows.filter((item) => item.tenantId === tenantId)
    : nonceRows;

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={3}>
          {tenantId
            ? `Operators · Tenant #${shortBytes32(tenantId)}`
            : "Quản lý Operators"}
        </Title>
        <Group gap="xs">
          <Tooltip label="Làm mới">
            <ActionIcon variant="default" size="lg">
              <ArrowClockwiseIcon size={16} />
            </ActionIcon>
          </Tooltip>
          {canJoinOperator && (
            <Button
              leftSection={<PlusIcon size={16} />}
              color="teal"
              onClick={() => setJoinOpen(true)}
            >
              Tham gia làm Operator
            </Button>
          )}
        </Group>
      </Group>

      <Tabs defaultValue="operators">
        <Tabs.List mb="md">
          <Tabs.Tab value="operators">
            Operators{" "}
            <Badge size="xs" variant="light">
              {filtered.length}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="nonces">
            Nonce Consumeds{" "}
            <Badge size="xs" variant="light">
              {filteredNonces.length}
            </Badge>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="operators">
          <Card withBorder radius="md" padding={0}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Operator</Table.Th>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Stake</Table.Th>
                  <Table.Th>Metadata</Table.Th>
                  <Table.Th>Trạng thái mới nhất</Table.Th>
                  <Table.Th>Thời gian</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((op) => (
                  <Table.Tr key={op.id || op.walletAddress}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Avatar size="sm" radius="xl" color="teal">
                          {op.walletAddress[2]}
                        </Avatar>
                        <CopyableValue value={op.walletAddress} mono />
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={op.tenantId} mono />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {op.stakeAmount}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{op.metadata || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          STATUS_COLOR[op.isActive ? "ACTIVE" : "INACTIVE"]
                        }
                        size="sm"
                        variant="light"
                      >
                        {op.isActive === undefined
                          ? "-"
                          : op.isActive
                            ? "ACTIVE"
                            : "INACTIVE"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(
                          Number(op.blockTimestamp || "0") * 1000,
                        ).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Xem chi tiết">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => setDetail(op)}
                        >
                          <EyeIcon size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="nonces">
          <Card withBorder radius="md" padding={0}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Signer</Table.Th>
                  <Table.Th>Old Nonce</Table.Th>
                  <Table.Th>New Nonce</Table.Th>
                  <Table.Th>Tx Hash</Table.Th>
                  <Table.Th>Thời gian</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredNonces.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <CopyableValue value={row.tenantId} mono />
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={row.signer} mono />
                    </Table.Td>
                    <Table.Td>{row.oldNonce}</Table.Td>
                    <Table.Td>{row.newNonce}</Table.Td>
                    <Table.Td>
                      <CopyableValue value={row.transactionHash} mono />
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(
                          Number(row.blockTimestamp || "0") * 1000,
                        ).toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>

      <JoinOperatorModal opened={joinOpen} onClose={() => setJoinOpen(false)} />
      <OperatorDetailModal
        op={detail}
        opened={!!detail}
        onClose={() => setDetail(null)}
        canManageOperators={canManageOperators}
        canManageStake={canManageStake}
        tenantId={tenantId}
      />
    </Stack>
  );
}
