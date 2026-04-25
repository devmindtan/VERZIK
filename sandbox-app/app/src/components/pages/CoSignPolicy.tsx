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
  NumberInput,
  ActionIcon,
  Tooltip,
  Card,
  Tabs,
  Divider,
  Switch,
  Alert,
  Loader,
  Avatar,
} from "@mantine/core";
import {
  PlusIcon,
  ArrowClockwiseIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import { shortBytes32, shortValue } from "../../utils/display";
import { CopyableValue } from "../customs/InfoFields";
import {
  fetchCoSignPolicyUpdateds,
  fetchCoSignOperatorConfigureds,
} from "../../services/blockchain.query.service";

interface CoSignPolicy {
  tenant_id: string;
  doc_type: string;
  enabled: boolean;
  min_stake: string;
  min_cosign: number;
  required_role_mask: string;
}

interface CoSignOperator {
  tenantId: string;
  docType: string;
  operator: string;
  whitelisted: boolean;
  roleId: number;
  blockTimestamp: string;
}

function PolicyModal({
  opened,
  onClose,
  policy,
}: {
  opened: boolean;
  onClose: () => void;
  policy?: CoSignPolicy;
}) {
  const isEdit = !!policy;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Chỉnh sửa Policy" : "Tạo Policy mới"}
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Tenant ID"
          placeholder="1"
          defaultValue={policy?.tenant_id}
          required
          disabled={isEdit}
        />
        <Select
          label="Loại tài liệu"
          placeholder="Chọn loại..."
          defaultValue={policy?.doc_type}
          data={["VOUCHER", "INVOICE", "CONTRACT"]}
          required
          disabled={isEdit}
        />
        <NumberInput
          label="Số CoSign tối thiểu"
          defaultValue={policy?.min_cosign ?? 2}
          min={1}
          max={10}
        />
        <Divider label="Operator cụ thể (tuỳ chọn)" />
        <TextInput
          label="Required Role Mask"
          placeholder="0"
          defaultValue={policy?.required_role_mask ?? "0"}
          ff="monospace"
          disabled
        />
        <Switch
          label="Policy đang bật"
          defaultChecked={policy?.enabled ?? true}
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Hủy
          </Button>
          <Button color="teal">{isEdit ? "Lưu thay đổi" : "Tạo Policy"}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function CoSignPolicy({
  tenantId,
  canEdit,
}: {
  tenantId?: string;
  canEdit: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CoSignPolicy | null>(null);
  const [rows, setRows] = useState<CoSignPolicy[]>([]);
  const [operatorRows, setOperatorRows] = useState<CoSignOperator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [policyRes, opRes] = await Promise.all([
          fetchCoSignPolicyUpdateds(),
          fetchCoSignOperatorConfigureds(),
        ]);

        if (Array.isArray(policyRes?.data)) {
          const mapped = (policyRes.data as Record<string, unknown>[]).map(
            (item) => ({
              tenant_id: String(item.tenantId ?? ""),
              doc_type: String(item.docType ?? "-"),
              enabled: item.enabled === true || item.enabled === "true",
              min_stake: String(item.minStake ?? "0"),
              min_cosign: Number(item.minSigners ?? 0),
              required_role_mask: String(item.requiredRoleMask ?? "0"),
            }),
          );
          setRows(mapped);
        }

        if (Array.isArray(opRes?.data)) {
          const mapped = (opRes.data as Record<string, unknown>[]).map(
            (item) => ({
              tenantId: String(item.tenantId ?? ""),
              docType: String(item.docType ?? "-"),
              operator: String(item.operator ?? ""),
              whitelisted: item.whitelisted === true,
              roleId: Number(item.roleId ?? 0),
              blockTimestamp: new Date(
                Number(item.blockTimestamp ?? 0) * 1000,
              ).toLocaleString(),
            }),
          );
          setOperatorRows(mapped);
        }
      } catch (err) {
        console.error("Lỗi fetch cosign data:", err);
        setError("Không tải được dữ liệu CoSign.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredPolicies = tenantId
    ? rows.filter((r) => r.tenant_id === tenantId)
    : rows;
  const filteredOperators = tenantId
    ? operatorRows.filter((r) => r.tenantId === tenantId)
    : operatorRows;

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={3}>
          {tenantId
            ? `CoSign Policy · Tenant #${shortBytes32(tenantId)}`
            : "CoSign Policy"}
        </Title>
        <Group gap="xs">
          <Tooltip label="Làm mới">
            <ActionIcon variant="default" size="lg">
              <ArrowClockwiseIcon size={16} />
            </ActionIcon>
          </Tooltip>
          {canEdit && (
            <Button
              leftSection={<PlusIcon size={16} />}
              color="teal"
              onClick={() => setCreateOpen(true)}
            >
              Tạo Policy
            </Button>
          )}
        </Group>
      </Group>

      {error ? (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      ) : null}

      {loading ? <Loader size="sm" /> : null}

      <Tabs defaultValue="policies">
        <Tabs.List mb="md">
          <Tabs.Tab value="policies">
            Policies{" "}
            <Badge size="xs" variant="light" ml={4}>
              {filteredPolicies.length}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="operators">
            Operator Whitelist{" "}
            <Badge size="xs" variant="light" ml={4}>
              {filteredOperators.length}
            </Badge>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="policies">
          <Card withBorder radius="md" padding={0}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Loại tài liệu</Table.Th>
                  <Table.Th>Enabled</Table.Th>
                  <Table.Th>Min Stake</Table.Th>
                  <Table.Th>Min CoSign</Table.Th>
                  <Table.Th>Role Mask</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredPolicies.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="md">
                        Không có CoSign policy để hiển thị.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {filteredPolicies.map((p) => (
                  <Table.Tr key={`${p.tenant_id}-${p.doc_type}`}>
                    <Table.Td>
                      <CopyableValue value={p.tenant_id} mono />
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="outline">
                        {p.doc_type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={p.enabled ? "teal" : "gray"}
                        size="sm"
                        variant="light"
                      >
                        {p.enabled ? "Có" : "Không"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {p.min_stake}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600}>{p.min_cosign}x</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace" c="dimmed">
                        {shortValue(p.required_role_mask, 8, 6)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {canEdit && (
                        <Tooltip label="Chỉnh sửa">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => setEditTarget(p)}
                          >
                            <PencilSimpleIcon size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="operators">
          <Card withBorder radius="md" padding={0}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Loại tài liệu</Table.Th>
                  <Table.Th>Operator</Table.Th>
                  <Table.Th>Role ID</Table.Th>
                  <Table.Th>Whitelisted</Table.Th>
                  <Table.Th>Thời gian</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredOperators.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed" py="md">
                        Chưa có operator whitelist nào.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {filteredOperators.map((op, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <CopyableValue value={op.tenantId} mono />
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="outline">
                        {op.docType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Avatar size="sm" radius="xl" color="blue">
                          {op.operator[2]}
                        </Avatar>
                        <CopyableValue value={op.operator} mono />
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light" color="grape">
                        Role {op.roleId}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={op.whitelisted ? "teal" : "gray"}
                        size="sm"
                        variant="light"
                      >
                        {op.whitelisted ? "Có" : "Không"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {op.blockTimestamp}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {canEdit && (
        <PolicyModal opened={createOpen} onClose={() => setCreateOpen(false)} />
      )}
      {canEdit && (
        <PolicyModal
          opened={!!editTarget}
          onClose={() => setEditTarget(null)}
          policy={editTarget ?? undefined}
        />
      )}
    </Stack>
  );
}
