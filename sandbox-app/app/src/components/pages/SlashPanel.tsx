import { useEffect, useState, type ChangeEvent } from "react";
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
  NumberInput,
  ActionIcon,
  Tooltip,
  Card,
  Tabs,
  Divider,
  Alert,
  Loader,
} from "@mantine/core";
import {
  ArrowClockwiseIcon,
  LightningIcon,
  WarningCircleIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { shortBytes32 } from "../../utils/display";
import {
  fetchPenaltyByTenantId,
  fetchViolationPenaltyUpdateds,
  fetchOperatorHardSlasheds,
  fetchOperatorSoftSlasheds,
} from "../../services/blockchain.query.service";
import { DetailPanel } from "../customs/DetailSection";
import { CopyableValue } from "../customs/InfoFields";

interface ViolationPenalty {
  tenantId: string;
  violationType: string;
  penaltyAmount: string;
  is_hard: boolean;
}

interface HardSlashEntry {
  tenantId: string;
  operator: string;
  amount: string;
  slasher: string;
  reason: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface SoftSlashEntry {
  tenantId: string;
  operator: string;
  violationCode: string;
  penaltyBps: number;
  slashedAmount: string;
  remainingStake: string;
  slasher: string;
  reason: string;
  blockTimestamp: string;
  transactionHash: string;
}

function SlashModal({
  opened,
  onClose,
  isSoft,
}: {
  opened: boolean;
  onClose: () => void;
  isSoft: boolean;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isSoft ? "Soft Slash Operator" : "Hard Slash Operator"}
      size="md"
    >
      <Stack gap="md">
        {!isSoft && (
          <Alert color="red" icon={<WarningCircleIcon size={16} />}>
            Hard slash sẽ loại bỏ operator vĩnh viễn và tịch thu toàn bộ stake!
          </Alert>
        )}
        <TextInput label="Tenant ID" placeholder="1" required />
        <TextInput
          label="Operator address"
          placeholder="0x..."
          ff="monospace"
          required
        />
        <Select
          label="Loại vi phạm"
          data={["DATA_FRAUD", "LATE_COSIGN", "DOUBLE_SIGN"]}
          required
        />
        <Divider />
        {!isSoft && <NumberInput label="Số tiền tịch thu (ETH)" min={0} />}
        <TextInput label="Lý do (ghi chú)" placeholder="Mô tả vi phạm..." />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Hủy
          </Button>
          <Button
            color={isSoft ? "orange" : "red"}
            leftSection={<LightningIcon size={16} />}
          >
            {isSoft ? "Soft Slash" : "Hard Slash"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function SetPenaltyModal({
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
      title="Cập nhật Violation Penalty"
      size="md"
    >
      <Stack gap="md">
        <TextInput label="Tenant ID" placeholder="1" required />
        <Select
          label="Loại vi phạm"
          data={["DATA_FRAUD", "LATE_COSIGN", "DOUBLE_SIGN"]}
          required
        />
        <NumberInput label="Mức phạt (ETH)" min={0} step={1} />
        <Select
          label="Kiểu phạt"
          data={[
            { value: "hard", label: "Hard (loại bỏ hoàn toàn)" },
            { value: "soft", label: "Soft (cảnh cáo)" },
          ]}
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Hủy
          </Button>
          <Button color="teal">Lưu</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function SlashPanel({
  tenantId,
  canSlashOperator,
  canEditPenalty,
}: {
  tenantId?: string;
  canSlashOperator: boolean;
  canEditPenalty: boolean;
}) {
  const [hardOpen, setHardOpen] = useState(false);
  const [softOpen, setSoftOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [lookupTenantId, setLookupTenantId] = useState(tenantId ?? "");
  const [penalties, setPenalties] = useState<ViolationPenalty[]>([]);
  const [penaltyDetail, setPenaltyDetail] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [hardSlashRows, setHardSlashRows] = useState<HardSlashEntry[]>([]);
  const [softSlashRows, setSoftSlashRows] = useState<SoftSlashEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [penaltyRes, hardRes, softRes] = await Promise.all([
          fetchViolationPenaltyUpdateds(),
          fetchOperatorHardSlasheds(),
          fetchOperatorSoftSlasheds(),
        ]);

        if (penaltyRes?.success && Array.isArray(penaltyRes.data)) {
          setPenalties(
            penaltyRes.data.map((item) => {
              const row = item as Record<string, unknown>;
              const penalty = Number(row.newPenaltyBps ?? 0);
              return {
                tenantId: String(row.tenantId ?? ""),
                violationType: String(row.violationCode ?? "-"),
                penaltyAmount: `${penalty} bps`,
                is_hard: penalty >= 5000,
              };
            }),
          );
        }

        if (hardRes?.success && Array.isArray(hardRes.data)) {
          setHardSlashRows(
            (hardRes.data as Record<string, unknown>[]).map((item) => ({
              tenantId: String(item.tenantId ?? ""),
              operator: String(item.operator ?? ""),
              amount: String(item.amount ?? "0"),
              slasher: String(item.slasher ?? ""),
              reason: String(item.reason ?? ""),
              blockTimestamp: new Date(
                Number(item.blockTimestamp ?? 0) * 1000,
              ).toLocaleString(),
              transactionHash: String(item.transactionHash ?? ""),
            })),
          );
        }

        if (softRes?.success && Array.isArray(softRes.data)) {
          setSoftSlashRows(
            (softRes.data as Record<string, unknown>[]).map((item) => ({
              tenantId: String(item.tenantId ?? ""),
              operator: String(item.operator ?? ""),
              violationCode: String(item.violationCode ?? "-"),
              penaltyBps: Number(item.penaltyBps ?? 0),
              slashedAmount: String(item.slashedAmount ?? "0"),
              remainingStake: String(item.remainingStake ?? "0"),
              slasher: String(item.slasher ?? ""),
              reason: String(item.reason ?? ""),
              blockTimestamp: new Date(
                Number(item.blockTimestamp ?? 0) * 1000,
              ).toLocaleString(),
              transactionHash: String(item.transactionHash ?? ""),
            })),
          );
        }
      } catch (fetchError) {
        console.error("Lỗi fetch slash data:", fetchError);
        setError("Không tải được dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const handleGetPenaltyDetail = async () => {
    const resolvedTenantId = lookupTenantId.trim();
    if (!resolvedTenantId) {
      setError("Vui lòng nhập tenantId để xem chi tiết penalty.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchPenaltyByTenantId(resolvedTenantId);
      if (!response?.success) {
        setPenaltyDetail(null);
        setError("Không lấy được penalty detail theo tenantId.");
        return;
      }

      setPenaltyDetail(response.data);
    } catch (fetchError) {
      console.error("Lỗi fetch penalty detail:", fetchError);
      setPenaltyDetail(null);
      setError("Không lấy được penalty detail theo tenantId.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={3}>
          {tenantId
            ? `Penalty & Slash · Tenant #${shortBytes32(tenantId)}`
            : "Xử phạt & Vi phạm"}
        </Title>
        <Group gap="xs">
          <Tooltip label="Làm mới">
            <ActionIcon variant="default" size="lg">
              <ArrowClockwiseIcon size={16} />
            </ActionIcon>
          </Tooltip>
          {canSlashOperator && (
            <>
              <Button
                variant="default"
                color="orange"
                leftSection={<LightningIcon size={16} />}
                onClick={() => setSoftOpen(true)}
              >
                Soft Slash
              </Button>
              <Button
                color="red"
                leftSection={<LightningIcon size={16} />}
                onClick={() => setHardOpen(true)}
              >
                Hard Slash
              </Button>
            </>
          )}
        </Group>
      </Group>

      <Card withBorder radius="md" padding="md">
        <Group align="flex-end">
          <TextInput
            label="Tenant ID (chi tiết penalty)"
            placeholder="0x..."
            ff="monospace"
            value={lookupTenantId}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setLookupTenantId(event.currentTarget.value)
            }
            style={{ flex: 1 }}
          />
          <Button onClick={handleGetPenaltyDetail}>Xem chi tiết penalty</Button>
        </Group>
      </Card>

      <Tabs defaultValue="history">
        <Tabs.List mb="md">
          <Tabs.Tab value="history">Lịch sử xử phạt</Tabs.Tab>
          <Tabs.Tab value="penalties">Violation Penalties</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="history">
          <Tabs defaultValue="hard">
            <Tabs.List mb="sm">
              <Tabs.Tab value="hard">
                Hard Slash{" "}
                <Badge size="xs" color="red" variant="light" ml={4}>
                  {hardSlashRows.length}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="soft">
                Soft Slash{" "}
                <Badge size="xs" color="orange" variant="light" ml={4}>
                  {softSlashRows.length}
                </Badge>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="hard">
              <Card withBorder radius="md" padding={0}>
                <Table highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Operator</Table.Th>
                      <Table.Th>Tenant</Table.Th>
                      <Table.Th>Số tiền</Table.Th>
                      <Table.Th>Slasher</Table.Th>
                      <Table.Th>Lý do</Table.Th>
                      <Table.Th>Thời gian</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {hardSlashRows.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text ta="center" c="dimmed" py="md">
                            Chưa có hard slash nào.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : null}
                    {hardSlashRows.map((row, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>
                          <CopyableValue value={row.operator} mono />
                        </Table.Td>
                        <Table.Td>
                          <CopyableValue value={row.tenantId} mono />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} c="red">
                            {row.amount}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <CopyableValue value={row.slasher} mono />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {row.reason || "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {row.blockTimestamp}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="soft">
              <Card withBorder radius="md" padding={0}>
                <Table highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Operator</Table.Th>
                      <Table.Th>Tenant</Table.Th>
                      <Table.Th>Loại vi phạm</Table.Th>
                      <Table.Th>Penalty (bps)</Table.Th>
                      <Table.Th>Stake còn lại</Table.Th>
                      <Table.Th>Thời gian</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {softSlashRows.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text ta="center" c="dimmed" py="md">
                            Chưa có soft slash nào.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : null}
                    {softSlashRows.map((row, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>
                          <CopyableValue value={row.operator} mono />
                        </Table.Td>
                        <Table.Td>
                          <CopyableValue value={row.tenantId} mono />
                        </Table.Td>
                        <Table.Td>
                          <Badge size="sm" color="orange" variant="outline">
                            {row.violationCode}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {row.penaltyBps} bps
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{row.remainingStake}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {row.blockTimestamp}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>

        <Tabs.Panel value="penalties">
          {error ? (
            <Alert color="red" variant="light" mb="sm">
              {error}
            </Alert>
          ) : null}
          {loading ? <Loader size="sm" mb="sm" /> : null}
          <Group justify="flex-end" mb="sm">
            {canEditPenalty && (
              <Button
                size="xs"
                variant="default"
                leftSection={<PlusIcon size={13} />}
                onClick={() => setPenaltyOpen(true)}
              >
                Thêm / cập nhật penalty
              </Button>
            )}
          </Group>
          <Card withBorder radius="md" padding={0}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Loại vi phạm</Table.Th>
                  <Table.Th>Mức phạt</Table.Th>
                  <Table.Th>Kiểu</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {penalties.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" c="dimmed" py="md">
                        Không có penalty để hiển thị.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {penalties.map((p, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <CopyableValue value={p.tenantId} mono />
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="outline">
                        {p.violationType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {p.penaltyAmount}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={p.is_hard ? "red" : "orange"}
                        size="sm"
                        variant="light"
                      >
                        {p.is_hard ? "HARD" : "SOFT"}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>

          {penaltyDetail ? (
            <Card withBorder radius="md" padding="md" mt="sm">
              <Text fw={600} mb="sm">
                Penalty Detail
              </Text>
              <DetailPanel
                data={penaltyDetail}
                tabLabels={{
                  violationPenaltyUpdateds: "Cập nhật Penalty",
                }}
              />
            </Card>
          ) : null}
        </Tabs.Panel>
      </Tabs>

      {canSlashOperator && (
        <>
          <SlashModal
            opened={hardOpen}
            onClose={() => setHardOpen(false)}
            isSoft={false}
          />
          <SlashModal
            opened={softOpen}
            onClose={() => setSoftOpen(false)}
            isSoft={true}
          />
        </>
      )}
      {canEditPenalty && (
        <SetPenaltyModal
          opened={penaltyOpen}
          onClose={() => setPenaltyOpen(false)}
        />
      )}
    </Stack>
  );
}
