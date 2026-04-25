import {
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import {
  BankIcon,
  CoinsIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { OperatorStatus, TenantInfo } from "../../utils/types";
import { shortBytes32 } from "../../utils/display";
import {
  fetchOperatorUnstakeRequesteds,
  fetchOperatorUnstakeds,
} from "../../services/blockchain.query.service";
import { CopyableValue } from "../customs/InfoFields";

interface TreasuryEntry {
  tenantId: string;
  treasuryAddress: string;
  totalStake: number;
  lockedStake: number;
  pendingUnstake: number;
}

type UnstakeRequestedRow = {
  id: string;
  tenantId: string;
  operator: string;
  availableAt: string;
  blockTimestamp: string;
  transactionHash: string;
};

type UnstakedRow = {
  id: string;
  tenantId: string;
  operator: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
};

function MetricCard({
  title,
  value,
  suffix,
  icon,
}: {
  title: string;
  value: string;
  suffix?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">
          {title}
        </Text>
        {icon}
      </Group>
      <Text fw={700} size="xl">
        {value}
        {suffix ? (
          <Text span size="sm" c="dimmed">
            {" "}
            {suffix}
          </Text>
        ) : null}
      </Text>
    </Card>
  );
}

function parseStakeAmount(input: string): number {
  const value = Number(String(input).replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export function Treasury({
  tenantId,
  tenants,
  operators,
  stake,
}: {
  tenantId?: string;
  tenants: TenantInfo[];
  operators: OperatorStatus[];
  stake?: number;
}) {
  const [unstakeRequestedRows, setUnstakeRequestedRows] = useState<
    UnstakeRequestedRow[]
  >([]);
  const [unstakedRows, setUnstakedRows] = useState<UnstakedRow[]>([]);

  const scopedTenants = tenantId
    ? tenants.filter((item) => item.id === tenantId)
    : tenants;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [requestedRes, unstakedRes] = await Promise.all([
          fetchOperatorUnstakeRequesteds(),
          fetchOperatorUnstakeds(),
        ]);

        const requested =
          requestedRes?.success && Array.isArray(requestedRes.data)
            ? requestedRes.data
            : [];
        const unstaked =
          unstakedRes?.success && Array.isArray(unstakedRes.data)
            ? unstakedRes.data
            : [];

        const mappedRequested = requested
          .map((item) => {
            const row = item as Record<string, unknown>;
            return {
              id: String(row.id ?? ""),
              tenantId: String(row.tenantId ?? ""),
              operator: String(row.operator ?? ""),
              availableAt: String(row.availableAt ?? "0"),
              blockTimestamp: String(row.blockTimestamp ?? "0"),
              transactionHash: String(row.transactionHash ?? ""),
            } as UnstakeRequestedRow;
          })
          .filter((item) => (tenantId ? item.tenantId === tenantId : true));

        const mappedUnstaked = unstaked
          .map((item) => {
            const row = item as Record<string, unknown>;
            return {
              id: String(row.id ?? ""),
              tenantId: String(row.tenantId ?? ""),
              operator: String(row.operator ?? ""),
              amount: String(row.amount ?? "0"),
              blockTimestamp: String(row.blockTimestamp ?? "0"),
              transactionHash: String(row.transactionHash ?? ""),
            } as UnstakedRow;
          })
          .filter((item) => (tenantId ? item.tenantId === tenantId : true));

        setUnstakeRequestedRows(mappedRequested);
        setUnstakedRows(mappedUnstaked);
      } catch (error) {
        console.error("Lỗi load unstake history:", error);
        setUnstakeRequestedRows([]);
        setUnstakedRows([]);
      }
    };

    loadHistory();
  }, [tenantId]);

  const stakeNumbers = operators.map((item) =>
    parseStakeAmount(item.stakeAmount),
  );
  const totalStakeByView = stakeNumbers.reduce((acc, value) => acc + value, 0);
  const lockedStakeByView = operators
    .filter((item) => item.isActive)
    .reduce((acc, item) => acc + parseStakeAmount(item.stakeAmount), 0);
  const pendingUnstakeByView = operators.filter(
    (item) => !item.canUnstakeNow,
  ).length;

  const scopedTreasury: TreasuryEntry[] = useMemo(
    () =>
      scopedTenants.map((item) => ({
        tenantId: item.id,
        treasuryAddress: item.treasury,
        totalStake: totalStakeByView,
        lockedStake: lockedStakeByView,
        pendingUnstake: pendingUnstakeByView,
      })),
    [scopedTenants, totalStakeByView, lockedStakeByView, pendingUnstakeByView],
  );

  const totalStake = scopedTreasury.reduce(
    (acc, item) => acc + item.totalStake,
    0,
  );
  const lockedStake = scopedTreasury.reduce(
    (acc, item) => acc + item.lockedStake,
    0,
  );
  const slashedIn = unstakedRows.reduce(
    (acc, item) => acc + (Number(item.amount) || 0),
    0,
  );
  const pendingUnstake = scopedTreasury.reduce(
    (acc, item) => acc + item.pendingUnstake,
    0,
  );
  const lockedRatio = totalStake > 0 ? (lockedStake / totalStake) * 100 : 0;

  return (
    <Stack gap="xl">
      <Title order={3}>
        {tenantId
          ? `Treasury · Tenant #${shortBytes32(tenantId)}`
          : "Treasury Overview"}
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <MetricCard
          title="Tổng stake"
          value={(stake ?? totalStake).toString()}
          suffix="ETH"
          icon={<CoinsIcon size={18} />}
        />
        <MetricCard
          title="Stake đang khóa"
          value={lockedStake.toString()}
          suffix="ETH"
          icon={<BankIcon size={18} />}
        />
        <MetricCard
          title="Slash đã thu"
          value={slashedIn.toString()}
          suffix="ETH"
          icon={<TrendUpIcon size={18} />}
        />
        <MetricCard
          title="Pending unstake"
          value={pendingUnstake.toString()}
          suffix="ETH"
          icon={<TrendDownIcon size={18} />}
        />
      </SimpleGrid>

      <Card withBorder radius="md" padding="md">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Tỷ lệ stake khóa</Text>
          <Text size="sm" c="dimmed">
            {lockedRatio.toFixed(1)}%
          </Text>
        </Group>
        <Progress value={lockedRatio} color="teal" size="lg" radius="xl" />
      </Card>

      <Card withBorder radius="md" padding={0}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tenant</Table.Th>
              <Table.Th>Treasury</Table.Th>
              <Table.Th>Total Stake</Table.Th>
              <Table.Th>Locked</Table.Th>
              <Table.Th>Pending Unstake</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {scopedTreasury.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed">
                    chưa có
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}
            {scopedTreasury.map((item) => (
              <Table.Tr key={item.tenantId}>
                <Table.Td>
                  <CopyableValue value={item.tenantId} mono />
                </Table.Td>
                <Table.Td>
                  <CopyableValue value={item.treasuryAddress} mono />
                </Table.Td>
                <Table.Td>{item.totalStake} ETH</Table.Td>
                <Table.Td>{item.lockedStake} ETH</Table.Td>
                <Table.Td>{item.pendingUnstake}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Card withBorder radius="md" padding={0}>
        <Tabs defaultValue="requested" p="md">
          <Tabs.List mb="md">
            <Tabs.Tab value="requested">Operator Unstake Requesteds</Tabs.Tab>
            <Tabs.Tab value="unstaked">Operator Unstakeds</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="requested">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Operator</Table.Th>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Available At</Table.Th>
                  <Table.Th>Block Timestamp</Table.Th>
                  <Table.Th>Transaction Hash</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {unstakeRequestedRows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed">
                        chưa có
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {unstakeRequestedRows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <CopyableValue value={row.operator} mono />
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={row.tenantId} mono />
                    </Table.Td>
                    <Table.Td>
                      {Number(row.availableAt) > 0
                        ? new Date(
                            Number(row.availableAt) * 1000,
                          ).toLocaleString()
                        : "-"}
                    </Table.Td>
                    <Table.Td>
                      {Number(row.blockTimestamp) > 0
                        ? new Date(
                            Number(row.blockTimestamp) * 1000,
                          ).toLocaleString()
                        : "-"}
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={row.transactionHash} mono />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="unstaked">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Operator</Table.Th>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Block Timestamp</Table.Th>
                  <Table.Th>Transaction Hash</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {unstakedRows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed">
                        chưa có
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {unstakedRows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <CopyableValue value={row.operator} mono />
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={row.tenantId} mono />
                    </Table.Td>
                    <Table.Td>{row.amount}</Table.Td>
                    <Table.Td>
                      {Number(row.blockTimestamp) > 0
                        ? new Date(
                            Number(row.blockTimestamp) * 1000,
                          ).toLocaleString()
                        : "-"}
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={row.transactionHash} mono />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Stack>
  );
}
