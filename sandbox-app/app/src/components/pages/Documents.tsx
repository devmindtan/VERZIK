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
  Textarea,
  Divider,
  Loader,
} from "@mantine/core";
import {
  PlusIcon,
  ArrowClockwiseIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import { shortBytes32 } from "../../utils/display";
import {
  fetchDocumentAnchoreds,
  fetchDocumentCoSignQualifieds,
  fetchDocumentCurrentStatus,
  fetchDocumentInfoById,
} from "../../services/blockchain.query.service";
import { DetailPanel } from "../customs/DetailSection";
import { CopyableValue, InfoFieldList } from "../customs/InfoFields";

interface DocRecord {
  id: string;
  cid: string;
  fileHash: string;
  tenantId: string;
  docType: string;
  version: string;
  registeredAt: string;
  transactionHash: string;
}

interface DocumentQualifiedRow {
  id: string;
  tenantId: string;
  fileHash: string;
  trustedSigners: string;
  roleMask: string;
  blockTimestamp: string;
  transactionHash: string;
}

function RegisterModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Đăng ký tài liệu" size="lg">
      <Stack gap="md">
        <TextInput label="Tenant ID" placeholder="1" required />
        <Select
          label="Loại tài liệu"
          placeholder="Chọn loại..."
          data={["VOUCHER", "INVOICE", "CONTRACT"]}
          required
        />
        <TextInput
          label="Document CID (IPFS)"
          placeholder="Qm..."
          ff="monospace"
          required
        />
        <TextInput
          label="Document Hash (sha256)"
          placeholder="0x..."
          ff="monospace"
          required
        />
        <Divider label="Chữ ký" />
        <Textarea
          label="Payload JSON"
          placeholder='{"nonce": "...", "deadline": "..."}'
          minRows={3}
          ff="monospace"
        />
        <TextInput
          label="Chữ ký (v, r, s)"
          placeholder="0x..."
          ff="monospace"
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Hủy
          </Button>
          <Button color="teal">Đăng ký</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function VerifyModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [fileHash, setFileHash] = useState("");
  const [loading] = useState(false);
  const [result] = useState<null | {
    exists: boolean;
    isValid: boolean;
  }>(null);
  const [error] = useState<string | null>(null);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Xác thực tài liệu"
      size="md"
    >
      <Stack gap="md">
        <TextInput label="Document CID" placeholder="Qm..." ff="monospace" />
        <TextInput
          label="Document Hash"
          placeholder="0x..."
          ff="monospace"
          value={fileHash}
          onChange={(event) => setFileHash(event.currentTarget.value)}
        />
        {error ? (
          <Text size="sm" c="red">
            {error}
          </Text>
        ) : null}
        <Button loading={loading}>Xác thực</Button>
        {loading ? <Loader size="sm" /> : null}
        {result !== null && (
          <Group
            gap="xs"
            p="sm"
            style={{
              background:
                result.exists && result.isValid ? "#d3f9d8" : "#ffe3e3",
              borderRadius: 8,
            }}
          >
            {result.exists && result.isValid ? (
              <CheckCircleIcon size={20} color="green" />
            ) : (
              <XCircleIcon size={20} color="red" />
            )}
            <Text fw={600} c={result.exists && result.isValid ? "teal" : "red"}>
              {result.exists && result.isValid
                ? "Hợp lệ"
                : "Không hợp lệ hoặc đã bị thu hồi"}
            </Text>
          </Group>
        )}
      </Stack>
    </Modal>
  );
}

function DocDetailModal({
  doc,
  opened,
  onClose,
  canCoSignDocument,
  canRevokeDocument,
}: {
  doc: DocRecord | null;
  opened: boolean;
  onClose: () => void;
  canCoSignDocument: boolean;
  canRevokeDocument: boolean;
}) {
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [currentStatus, setCurrentStatus] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!doc || !opened) {
        return;
      }

      setLoadingDetail(true);
      try {
        const [detailResponse, statusResponse] = await Promise.all([
          fetchDocumentInfoById(doc.tenantId, doc.fileHash),
          fetchDocumentCurrentStatus(doc.tenantId, doc.fileHash),
        ]);

        setDetailData(detailResponse?.success ? detailResponse.data : null);
        setCurrentStatus(statusResponse?.success ? statusResponse.data : null);
      } catch (error) {
        console.error("Lỗi fetch document detail:", error);
        setDetailData(null);
        setCurrentStatus(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [doc, opened]);

  if (!doc) return null;
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Chi tiết tài liệu"
      size="xl"
    >
      <Tabs defaultValue="info">
        <Tabs.List mb="md">
          <Tabs.Tab value="info">Thông tin</Tabs.Tab>
          <Tabs.Tab value="cosign">CoSign</Tabs.Tab>
          {(canCoSignDocument || canRevokeDocument) && (
            <Tabs.Tab value="actions">Hành động</Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="info">
          <Stack gap="sm">
            <InfoFieldList
              items={[
                { label: "Document ID", value: doc.id, mono: true },
                { label: "Tenant ID", value: doc.tenantId, mono: true },
                { label: "File Hash", value: doc.fileHash, mono: true },
                { label: "CID", value: doc.cid, mono: true },
                { label: "Doc Type", value: doc.docType },
                { label: "Version", value: doc.version },
                { label: "Thời gian", value: doc.registeredAt },
              ]}
            />

            <Card withBorder radius="sm" p="sm">
              <InfoFieldList
                items={[
                  {
                    label: "Current Exists",
                    value: String(currentStatus?.exists ?? "-"),
                  },
                  {
                    label: "Current Valid",
                    value: String(currentStatus?.isValid ?? "-"),
                  },
                  {
                    label: "Current Issuer",
                    value: String(currentStatus?.issuer ?? "-"),
                    mono: true,
                  },
                  {
                    label: "Current CID",
                    value: String(currentStatus?.cid ?? doc.cid),
                    mono: true,
                  },
                  {
                    label: "Current Doc Type",
                    value: String(currentStatus?.docType ?? doc.docType),
                  },
                  {
                    label: "Current Version",
                    value: String(currentStatus?.version ?? doc.version),
                  },
                  {
                    label: "Current Timestamp",
                    value:
                      currentStatus?.timestamp !== undefined &&
                      Number(currentStatus.timestamp) > 0
                        ? new Date(
                            Number(currentStatus.timestamp) * 1000,
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
                documentAnchoreds: "Tài liệu",
                documentCoSignQualifieds: "Đủ tiêu chuẩn",
                documentCoSigneds: "Đã đồng kí",
                documentRevokeds: "Thu hồi Tài liệu",
              }}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="cosign">
          <Text size="sm" c="dimmed">
            Lịch sử CoSign được hiển thị ở các tab sự kiện trong phần Thông tin.
          </Text>
        </Tabs.Panel>

        <Tabs.Panel value="actions">
          <Stack gap="sm" mt="xs">
            {canCoSignDocument && (
              <Button
                leftSection={<SealCheckIcon size={16} />}
                variant="light"
                color="blue"
                fullWidth
              >
                CoSign (với chữ ký)
              </Button>
            )}
            {canRevokeDocument && (
              <Button variant="light" color="red" fullWidth>
                Thu hồi tài liệu
              </Button>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

export function Documents({
  tenantId,
  canRegisterDocument,
  canVerifyDocument,
  canCoSignDocument,
  canRevokeDocument,
}: {
  tenantId?: string;
  canRegisterDocument: boolean;
  canVerifyDocument: boolean;
  canCoSignDocument: boolean;
  canRevokeDocument: boolean;
}) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [detail, setDetail] = useState<DocRecord | null>(null);
  const [rows, setRows] = useState<DocRecord[]>([]);
  const [qualifiedRows, setQualifiedRows] = useState<DocumentQualifiedRow[]>(
    [],
  );

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const [response, qualifiedResponse] = await Promise.all([
          fetchDocumentAnchoreds(),
          fetchDocumentCoSignQualifieds(),
        ]);

        const documents = response?.data?.data;

        if (Array.isArray(documents)) {
          const mapped = documents.map((item) => {
            const data = item as Record<string, unknown>;
            return {
              id: String(data.id ?? ""),
              cid: String(data.cid ?? ""),
              fileHash: String(data.fileHash ?? ""),
              tenantId: String(data.tenantId ?? ""),
              docType: String(data.docType ?? "-"),
              version: String(data.version ?? "-"),
              registeredAt: new Date(
                Number(data.blockTimestamp ?? 0) * 1000,
              ).toLocaleString(),
              transactionHash: String(data.transactionHash ?? ""),
            } as DocRecord;
          });

          setRows(mapped);
        }

        const qualifiedData = qualifiedResponse?.data?.data;
        if (Array.isArray(qualifiedData)) {
          setQualifiedRows(
            qualifiedData.map((item) => {
              const row = item as Record<string, unknown>;
              return {
                id: String(row.id ?? ""),
                tenantId: String(row.tenantId ?? ""),
                fileHash: String(row.fileHash ?? ""),
                trustedSigners: String(row.trustedSigners ?? "0"),
                roleMask: String(row.roleMask ?? "0"),
                blockTimestamp: String(row.blockTimestamp ?? "0"),
                transactionHash: String(row.transactionHash ?? ""),
              };
            }),
          );
        }

        return;
      } catch (error) {
        console.error("Lỗi fetch document-anchoreds:", error);
      }

      setRows([]);
      setQualifiedRows([]);
    };

    loadDocuments();
  }, []);

  const filteredRows = tenantId
    ? rows.filter((doc) => doc.tenantId === tenantId)
    : rows;

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={3}>
          {tenantId
            ? `Tài liệu · Tenant #${shortBytes32(tenantId)}`
            : "Quản lý Tài liệu"}
        </Title>
        <Group gap="xs">
          <Tooltip label="Làm mới">
            <ActionIcon variant="default" size="lg">
              <ArrowClockwiseIcon size={16} />
            </ActionIcon>
          </Tooltip>
          {canVerifyDocument && (
            <Button
              variant="default"
              leftSection={<CheckCircleIcon size={16} />}
              onClick={() => setVerifyOpen(true)}
            >
              Xác thực
            </Button>
          )}
          {canRegisterDocument && (
            <Button
              leftSection={<PlusIcon size={16} />}
              color="teal"
              onClick={() => setRegisterOpen(true)}
            >
              Đăng ký tài liệu
            </Button>
          )}
        </Group>
      </Group>

      <Card withBorder radius="md" padding={0}>
        <Tabs defaultValue="documents" p="md">
          <Tabs.List mb="md">
            <Tabs.Tab value="documents">
              Documents{" "}
              <Badge size="xs" variant="light">
                {filteredRows.length}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab value="qualifieds">
              Document Qualifieds{" "}
              <Badge size="xs" variant="light">
                {qualifiedRows.length}
              </Badge>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="documents">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>File Hash</Table.Th>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>CID</Table.Th>
                  <Table.Th>Doc Type</Table.Th>
                  <Table.Th>Version</Table.Th>
                  <Table.Th>Ngày đăng ký</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="md">
                        Chưa có dữ liệu document để hiển thị.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {filteredRows.map((doc) => (
                  <Table.Tr key={doc.id || doc.fileHash}>
                    <Table.Td>
                      <CopyableValue value={doc.fileHash} mono />
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={doc.tenantId} mono />
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={doc.cid} mono />
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="outline">
                        {doc.docType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{doc.version}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {doc.registeredAt}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Xem chi tiết">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => setDetail(doc)}
                        >
                          <EyeIcon size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="qualifieds">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tenant</Table.Th>
                  <Table.Th>File Hash</Table.Th>
                  <Table.Th>Trusted Signers</Table.Th>
                  <Table.Th>Role Mask</Table.Th>
                  <Table.Th>Tx Hash</Table.Th>
                  <Table.Th>Thời gian</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {qualifiedRows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed" py="md">
                        Chưa có document qualified để hiển thị.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : null}
                {qualifiedRows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <CopyableValue value={row.tenantId} mono />
                    </Table.Td>
                    <Table.Td>
                      <CopyableValue value={row.fileHash} mono />
                    </Table.Td>
                    <Table.Td>{row.trustedSigners}</Table.Td>
                    <Table.Td>{row.roleMask}</Table.Td>
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
          </Tabs.Panel>
        </Tabs>
      </Card>

      <RegisterModal
        opened={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
      <VerifyModal opened={verifyOpen} onClose={() => setVerifyOpen(false)} />
      <DocDetailModal
        doc={detail}
        opened={!!detail}
        onClose={() => setDetail(null)}
        canCoSignDocument={canCoSignDocument}
        canRevokeDocument={canRevokeDocument}
      />
    </Stack>
  );
}
