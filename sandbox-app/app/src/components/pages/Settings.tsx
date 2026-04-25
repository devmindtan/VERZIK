import { Badge, Card, Group, Stack, Table, Tabs, Text } from "@mantine/core";
import type { RoleCapabilities, WalletSession } from "../access";
import { shortBytes32 } from "../../utils/display";
import { InfoFieldList } from "../customs/InfoFields";

interface SettingItem {
  key: string;
  label: string;
  value: string;
  editable: boolean;
}

function capabilityToRows(cap: RoleCapabilities): SettingItem[] {
  return [
    {
      key: "canCreateTenant",
      label: "Tạo tenant",
      value: cap.canCreateTenant ? "Có" : "Không",
      editable: cap.canCreateTenant,
    },
    {
      key: "canSetTenantStatus",
      label: "Đổi trạng thái tenant",
      value: cap.canSetTenantStatus ? "Có" : "Không",
      editable: cap.canSetTenantStatus,
    },
    {
      key: "canEditTenantConfig",
      label: "Sửa runtime config",
      value: cap.canEditTenantConfig ? "Có" : "Không",
      editable: cap.canEditTenantConfig,
    },
    {
      key: "canManageOperators",
      label: "Quản lý operator",
      value: cap.canManageOperators ? "Có" : "Không",
      editable: cap.canManageOperators,
    },
    {
      key: "canManageStake",
      label: "Quản lý stake",
      value: cap.canManageStake ? "Có" : "Không",
      editable: cap.canManageStake,
    },
    {
      key: "canRegisterDocument",
      label: "Đăng ký tài liệu",
      value: cap.canRegisterDocument ? "Có" : "Không",
      editable: cap.canRegisterDocument,
    },
    {
      key: "canVerifyDocument",
      label: "Xác thực tài liệu",
      value: cap.canVerifyDocument ? "Có" : "Không",
      editable: false,
    },
    {
      key: "canCoSignDocument",
      label: "Co-sign tài liệu",
      value: cap.canCoSignDocument ? "Có" : "Không",
      editable: cap.canCoSignDocument,
    },
    {
      key: "canRevokeDocument",
      label: "Thu hồi tài liệu",
      value: cap.canRevokeDocument ? "Có" : "Không",
      editable: cap.canRevokeDocument,
    },
    {
      key: "canEditCoSignPolicy",
      label: "Sửa CoSign policy",
      value: cap.canEditCoSignPolicy ? "Có" : "Không",
      editable: cap.canEditCoSignPolicy,
    },
    {
      key: "canSlashOperator",
      label: "Slash operator",
      value: cap.canSlashOperator ? "Có" : "Không",
      editable: cap.canSlashOperator,
    },
    {
      key: "canEditViolationPenalty",
      label: "Sửa penalty",
      value: cap.canEditViolationPenalty ? "Có" : "Không",
      editable: cap.canEditViolationPenalty,
    },
  ];
}

function roleSpecificRows(session: WalletSession): Array<[string, string]> {
  if (session.primaryRole === "owner") {
    return [
      ["Phạm vi", "Global protocol"],
      ["Trọng tâm", "Quản trị tenant-level"],
      ["Mô hình", "Owner governance"],
    ];
  }

  if (session.primaryRole === "operator") {
    return [
      [
        "Tenant mặc định",
        session.tenantId ? shortBytes32(session.tenantId) : "-",
      ],
      ["Vai trò", "Operator signer"],
      ["Chế độ", "Vận hành / co-sign"],
    ];
  }

  if (session.primaryRole === "tenant") {
    return [
      ["Tenant", session.tenantId ? shortBytes32(session.tenantId) : "-"],
      ["Tenant role", session.tenantRole ?? "member"],
      ["Scope", "Tenant scoped"],
    ];
  }

  return [
    ["Mode", "Read-only"],
    ["Phạm vi", "Public query only"],
    ["Set actions", "Bị khóa"],
  ];
}

export function Settings({
  session,
  capabilities,
  networkName,
  balanceEth,
}: {
  session: WalletSession;
  capabilities: RoleCapabilities;
  networkName: string;
  balanceEth: string;
}) {
  const rows = capabilityToRows(capabilities);
  const roleRows = roleSpecificRows(session);

  return (
    <Stack gap="xl">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Tổng quan cấu hình</Text>
          <Badge color={session.primaryRole === "guest" ? "gray" : "blue"}>
            {session.primaryRole === "guest" ? "Read-only" : "Editable"}
          </Badge>
        </Group>
        <InfoFieldList
          items={[
            { label: "Địa chỉ ví", value: session.address, mono: true },
            { label: "Primary role", value: session.primaryRole },
            { label: "Tenant role", value: session.tenantRole ?? "-" },
            { label: "Network", value: networkName || "-" },
            { label: "Balance", value: `${balanceEth} ETH`, mono: true },
            { label: "Tenant ID", value: session.tenantId ?? "-", mono: true },
          ]}
        />
      </Card>

      <Tabs defaultValue="general">
        <Tabs.List mb="md">
          <Tabs.Tab value="general">Cấu hình chung</Tabs.Tab>
          <Tabs.Tab value="role">Theo vai trò</Tabs.Tab>
          <Tabs.Tab value="permissions">Phân quyền</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <Card withBorder radius="md" p="md">
            <InfoFieldList
              items={[
                { label: "Query mode", value: "Public API", mono: false },
                { label: "Mutation policy", value: "Theo capability" },
                { label: "Tx Explorer", value: "Enabled" },
                { label: "Document Verify", value: "Enabled" },
              ]}
            />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="role">
          <Card withBorder radius="md" p="md">
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Thuộc tính</Table.Th>
                  <Table.Th>Giá trị</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {roleRows.map(([label, value]) => (
                  <Table.Tr key={label}>
                    <Table.Td>{label}</Table.Td>
                    <Table.Td>{value}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="permissions">
          <Card withBorder radius="md" p="md">
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Quyền</Table.Th>
                  <Table.Th>Trạng thái</Table.Th>
                  <Table.Th>Loại</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((item) => (
                  <Table.Tr key={item.key}>
                    <Table.Td>{item.label}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={item.value === "Có" ? "teal" : "gray"}
                        variant="light"
                      >
                        {item.value}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={item.editable ? "blue" : "gray"}
                        variant="outline"
                      >
                        {item.editable ? "Set / Update" : "Read-only"}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
