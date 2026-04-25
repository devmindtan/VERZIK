import { useState } from "react";
import {
  Stack,
  Title,
  Group,
  Button,
  TextInput,
  Card,
  Text,
  Badge,
  Divider,
  Loader,
  Center,
  Tabs,
} from "@mantine/core";
import { MagnifyingGlassIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import { fetchTransactionByHash } from "../../services/blockchain.query.service";
import { InfoFieldList } from "../customs/InfoFields";

interface TxResultData {
  transaction?: Record<string, unknown>;
  receipt?: Record<string, unknown>;
  block?: Record<string, unknown>;
  confirmations?: number;
  decodedInput?: {
    name?: string;
    signature?: string;
    args?: Record<string, unknown>;
  };
  decodedLogs?: Array<Record<string, unknown>>;
}

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: "teal",
  FAILED: "red",
  PENDING: "yellow",
};

export function TxExplorer({ tenantId }: { tenantId?: string }) {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<TxResultData | null>(null);

  const [error, setError] = useState<string | null>(null);

  const getTxStatus = (
    tx: TxResultData | null,
  ): "SUCCESS" | "FAILED" | "PENDING" => {
    if (!tx?.receipt) {
      return "PENDING";
    }

    const status = tx.receipt.status;
    if (status === 1 || status === "1") {
      return "SUCCESS";
    }

    return "FAILED";
  };

  const handleSearch = async () => {
    const txHash = hash.trim();
    if (!txHash) {
      setError("Vui lòng nhập transaction hash.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchTransactionByHash(txHash);
      if (!response?.success || !response.data) {
        setResult(null);
        setError("Không tìm thấy transaction hoặc backend trả lỗi.");
        return;
      }

      setResult(response.data as TxResultData);
    } catch {
      setResult(null);
      setError("Không thể gọi API transaction.");
    } finally {
      setLoading(false);
    }
  };

  const txHashValue = String(result?.transaction?.hash ?? "-");
  const txFromValue = String(result?.transaction?.from ?? "-");
  const txToValue = String(result?.transaction?.to ?? "-");
  const txBlockValue = String(result?.receipt?.blockNumber ?? "-");
  const txGasUsedValue = String(result?.receipt?.gasUsed ?? "-");
  const txValue = String(result?.transaction?.value ?? "-");
  const txMethod = String(result?.decodedInput?.name ?? "Unknown");
  const txStatus = getTxStatus(result);

  return (
    <Stack gap="xl">
      <Title order={3}>
        {tenantId
          ? `Transaction Explorer · Tenant #${tenantId}`
          : "Transaction Explorer"}
      </Title>

      <Card withBorder radius="md" padding="md">
        <Group gap="sm">
          <TextInput
            flex={1}
            placeholder="Nhập tx hash: 0x..."
            ff="monospace"
            value={hash}
            onChange={(e) => setHash(e.currentTarget.value)}
          />
          <Button
            leftSection={<MagnifyingGlassIcon size={16} />}
            loading={loading}
            onClick={handleSearch}
          >
            Tra cứu Transaction
          </Button>
        </Group>
      </Card>

      {loading && (
        <Center py="xl">
          <Loader color="teal" />
        </Center>
      )}

      {error && (
        <Card withBorder radius="md" padding="md" c="red">
          <Text size="sm">{error}</Text>
        </Card>
      )}

      {result && !loading && (
        <Stack gap="md">
          {/* Header */}
          <Card withBorder radius="md" padding="md">
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <Badge
                  color={STATUS_COLOR[txStatus]}
                  size="md"
                  variant="filled"
                >
                  {txStatus}
                </Badge>
                <Badge size="md" variant="outline" color="blue">
                  {txMethod}
                </Badge>
              </Group>
              <Button
                size="xs"
                variant="subtle"
                rightSection={<ArrowSquareOutIcon size={14} />}
                component="a"
                href={`https://etherscan.io/tx/${txHashValue}`}
                target="_blank"
              >
                Mở ngoài
              </Button>
            </Group>

            <InfoFieldList
              items={[
                { label: "Tx Hash", value: txHashValue, mono: true },
                { label: "Block", value: txBlockValue },
                { label: "From", value: txFromValue, mono: true },
                { label: "To", value: txToValue, mono: true },
                { label: "Gas Used", value: txGasUsedValue, mono: true },
                { label: "Value", value: txValue, mono: true },
                {
                  label: "Confirmations",
                  value: String(result.confirmations ?? "-"),
                },
              ]}
            />
          </Card>

          {/* Structured Details */}
          <Card withBorder radius="md" padding="md">
            <Tabs defaultValue="transaction">
              <Tabs.List mb="md">
                <Tabs.Tab value="transaction">Transaction</Tabs.Tab>
                <Tabs.Tab value="receipt">Receipt</Tabs.Tab>
                <Tabs.Tab value="block">Block</Tabs.Tab>
                <Tabs.Tab value="input">Decoded Input</Tabs.Tab>
                <Tabs.Tab value="logs">Decoded Logs</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="transaction">
                <Text size="xs" c="dimmed" mb="xs">
                  Bản đăng ký ban đầu của giao dịch.
                </Text>
                <Divider mb="md" />
                <InfoFieldList
                  items={[
                    {
                      label: "Hash",
                      value: String(result.transaction?.hash ?? "-"),
                      mono: true,
                    },
                    {
                      label: "From",
                      value: String(result.transaction?.from ?? "-"),
                      mono: true,
                    },
                    {
                      label: "To",
                      value: String(result.transaction?.to ?? "-"),
                      mono: true,
                    },
                    {
                      label: "Nonce",
                      value: String(result.transaction?.nonce ?? "-"),
                    },
                    {
                      label: "Gas Limit",
                      value: String(result.transaction?.gasLimit ?? "-"),
                      mono: true,
                    },
                    {
                      label: "Gas Price",
                      value: String(result.transaction?.gasPrice ?? "-"),
                      mono: true,
                    },
                    {
                      label: "Data",
                      value: String(result.transaction?.data ?? "-"),
                      mono: true,
                      truncate: false,
                    },
                  ]}
                />
              </Tabs.Panel>

              <Tabs.Panel value="receipt">
                <Text size="xs" c="dimmed" mb="xs">
                  Kết quả thực thi thực tế của giao dịch.
                </Text>
                <Divider mb="md" />
                <InfoFieldList
                  items={[
                    {
                      label: "Status",
                      value: String(result.receipt?.status ?? "-"),
                    },
                    {
                      label: "Gas Used",
                      value: String(result.receipt?.gasUsed ?? "-"),
                      mono: true,
                    },
                    {
                      label: "Cumulative Gas",
                      value: String(result.receipt?.cumulativeGasUsed ?? "-"),
                      mono: true,
                    },
                    {
                      label: "Gas Price",
                      value: String(result.receipt?.gasPrice ?? "-"),
                      mono: true,
                    },
                    {
                      label: "Block Number",
                      value: String(result.receipt?.blockNumber ?? "-"),
                    },
                  ]}
                />
              </Tabs.Panel>

              <Tabs.Panel value="block">
                <Text size="xs" c="dimmed" mb="xs">
                  Vị trí giao dịch trong chuỗi khối.
                </Text>
                <Divider mb="md" />
                <InfoFieldList
                  items={[
                    {
                      label: "Number",
                      value: String(result.block?.number ?? "-"),
                    },
                    {
                      label: "Hash",
                      value: String(result.block?.hash ?? "-"),
                      mono: true,
                    },
                    {
                      label: "Timestamp",
                      value: String(result.block?.timestamp ?? "-"),
                    },
                    {
                      label: "Parent Hash",
                      value: String(result.block?.parentHash ?? "-"),
                      mono: true,
                    },
                    {
                      label: "Base Fee",
                      value: String(result.block?.baseFeePerGas ?? "-"),
                      mono: true,
                    },
                  ]}
                />
              </Tabs.Panel>

              <Tabs.Panel value="input">
                <Text size="xs" c="dimmed" mb="xs">
                  Lệnh gọi hàm và tham số đã giải mã.
                </Text>
                <Divider mb="md" />
                <InfoFieldList
                  items={[
                    {
                      label: "Method",
                      value: String(result.decodedInput?.name ?? "-"),
                    },
                    {
                      label: "Signature",
                      value: String(result.decodedInput?.signature ?? "-"),
                      mono: true,
                    },
                  ]}
                />
                <Card withBorder mt="sm" p="sm">
                  <Text size="xs" c="dimmed" mb="xs">
                    Args
                  </Text>
                  <InfoFieldList
                    items={Object.entries(result.decodedInput?.args ?? {}).map(
                      ([key, value]) => ({
                        label: key,
                        value:
                          typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value),
                        mono: true,
                        truncate: false,
                      }),
                    )}
                  />
                </Card>
              </Tabs.Panel>

              <Tabs.Panel value="logs">
                <Text size="xs" c="dimmed" mb="xs">
                  Các sự kiện trả về sau khi transaction chạy xong.
                </Text>
                <Divider mb="md" />
                <Stack gap="sm">
                  {(result.decodedLogs ?? []).length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Không có decoded logs.
                    </Text>
                  ) : null}
                  {(result.decodedLogs ?? []).map((log, index) => (
                    <Card key={index} withBorder p="sm">
                      <Group justify="space-between" mb="xs">
                        <Text fw={600}>Event #{index + 1}</Text>
                        <Text size="xs" c="dimmed">
                          {String(log.name ?? "Unknown")}
                        </Text>
                      </Group>
                      <InfoFieldList
                        items={Object.entries(
                          (log.args as Record<string, unknown>) ?? {},
                        ).map(([key, value]) => ({
                          label: key,
                          value: String(value),
                          mono: true,
                          truncate: false,
                        }))}
                      />
                    </Card>
                  ))}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}
