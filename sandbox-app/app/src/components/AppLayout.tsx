import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  AppShell,
  Avatar,
  Badge,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  Modal,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  BuildingsIcon,
  FileTextIcon,
  GearIcon,
  HouseIcon,
  KeyIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PlugIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  SignOutIcon,
  UsersThreeIcon,
  WalletIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { Page, WalletSession } from "./access";
import {
  getCapabilities,
  getRoleLabel,
  getScopeDescription,
  getVisiblePages,
} from "./access";
import type { OperatorStatus, TenantInfo } from "../utils/types";
import { loadAccountSnapshot } from "../utils/auth";
import { shortBytes32 } from "../utils/display";
import { Dashboard } from "./pages/Dashboard";
import { Tenants } from "./pages/Tenants";
import { Operators } from "./pages/Operators";
import { Documents } from "./pages/Documents";
import { CoSignPolicy } from "./pages/CoSignPolicy";
import { SlashPanel } from "./pages/SlashPanel";
import { Treasury } from "./pages/Treasury";
import { TxExplorer } from "./pages/TxExplorer";
import { Settings } from "./pages/Settings";
import { getStake } from "../utils/auth";

const PROTOCOL_ADDRESS = import.meta.env.VITE_PROTOCOL_ADDRESS as
  | string
  | undefined;
// import { DocumentViewer } from "./pages/DocumentViewer";
const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Tổng quan", icon: <HouseIcon size={18} /> },
  { id: "tenants", label: "Tenants", icon: <BuildingsIcon size={18} /> },
  { id: "operators", label: "Operators", icon: <UsersThreeIcon size={18} /> },
  { id: "documents", label: "Tài liệu", icon: <FileTextIcon size={18} /> },
  // { id: "doc-viewer", label: "Xem Tài Liệu", icon: <FileTextIcon size={18} /> },
  { id: "cosign", label: "CoSign Policy", icon: <SealCheckIcon size={18} /> },
  { id: "slash", label: "Xử phạt", icon: <LightningIcon size={18} /> },
  { id: "treasury", label: "Treasury", icon: <WalletIcon size={18} /> },
  { id: "tx", label: "Transactions", icon: <MagnifyingGlassIcon size={18} /> },
];

export function AppLayout() {
  const [opened, setOpened] = useState(false);
  const [loginOpened, setLoginOpened] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [session, setSession] = useState<WalletSession | null>(null);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [operators, setOperators] = useState<OperatorStatus[]>([]);
  const [balanceEth, setBalanceEth] = useState("-");
  const [networkName, setNetworkName] = useState("-");
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [stake, setStake] = useState(0);

  const effectiveSession = useMemo<WalletSession>(
    () =>
      session ?? {
        id: "not-connected",
        label: "Chưa kết nối",
        address: "-",
        primaryRole: "guest",
        tenantRole: null,
      },
    [session],
  );

  const visiblePages = useMemo(
    () => getVisiblePages(effectiveSession),
    [effectiveSession],
  );
  const capabilities = useMemo(
    () => getCapabilities(effectiveSession),
    [effectiveSession],
  );

  useEffect(() => {
    if (!visiblePages.includes(activePage)) {
      setActivePage(visiblePages[0] ?? "dashboard");
    }
    const handleGetStake = async () => {
      const stake = await getStake();
      setStake(stake);
    };
    handleGetStake();
  }, [activePage, visiblePages]);

  const handleConnectByPrivateKey = async () => {
    try {
      setLoginLoading(true);
      setLoginError(null);
      const sanitized = privateKey.trim();
      if (!sanitized) {
        setLoginError("Vui lòng nhập private key.");
        return;
      }

      const snapshot = await loadAccountSnapshot(sanitized);
      setSession(snapshot.session);
      setBalanceEth(snapshot.balanceEth);
      setNetworkName(snapshot.networkName);

      setPrivateKey("");
      setLoginOpened(false);
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Đăng nhập thất bại.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDisconnect = () => {
    setSession(null);
    setTenants([]);
    setOperators([]);
    setBalanceEth("-");
    setNetworkName("-");
    setActivePage("dashboard");
  };

  const pageMap: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard session={effectiveSession} />,
    tenants: (
      <Tenants
        tenantId={effectiveSession.tenantId}
        tenants={tenants}
        canCreateTenant={capabilities.canCreateTenant}
        canSetTenantStatus={capabilities.canSetTenantStatus}
        canEditTenantConfig={capabilities.canEditTenantConfig}
      />
    ),
    operators: (
      <Operators
        tenantId={effectiveSession.tenantId}
        operatorsData={operators}
        canJoinOperator={capabilities.canJoinOperator}
        canManageOperators={capabilities.canManageOperators}
        canManageStake={capabilities.canManageStake}
      />
    ),
    documents: (
      <Documents
        tenantId={effectiveSession.tenantId}
        canRegisterDocument={capabilities.canRegisterDocument}
        canVerifyDocument={capabilities.canVerifyDocument}
        canCoSignDocument={capabilities.canCoSignDocument}
        canRevokeDocument={capabilities.canRevokeDocument}
      />
    ),
    cosign: (
      <CoSignPolicy
        tenantId={effectiveSession.tenantId}
        canEdit={capabilities.canEditCoSignPolicy}
      />
    ),
    slash: (
      <SlashPanel
        tenantId={effectiveSession.tenantId}
        canSlashOperator={capabilities.canSlashOperator}
        canEditPenalty={capabilities.canEditViolationPenalty}
      />
    ),
    treasury: (
      <Treasury
        tenantId={effectiveSession.tenantId}
        tenants={tenants}
        operators={operators}
        stake={stake}
      />
    ),
    tx: <TxExplorer tenantId={effectiveSession.tenantId} />,
  };

  const filteredNavItems = NAV_ITEMS.filter((item) =>
    visiblePages.includes(item.id),
  );

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 230, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap={8}>
              <img
                src="/verzik.svg"
                alt="Voucher Protocol Logo"
                style={{ width: 22, height: 22 }}
              />
              <Text fw={700} size="md">
                VoucherProtocol
              </Text>
            </Group>
          </Group>

          <Group gap="sm">
            {session ? (
              <ActionIcon
                variant="light"
                color="red"
                size="lg"
                onClick={handleDisconnect}
              >
                <SignOutIcon size={16} />
              </ActionIcon>
            ) : (
              <Button
                size="xs"
                leftSection={<KeyIcon size={14} />}
                onClick={() => setLoginOpened(true)}
              >
                Đăng nhập
              </Button>
            )}
            <Badge variant="dot" color="teal" size="sm">
              Localnet
            </Badge>
            <Badge
              color={effectiveSession.primaryRole === "guest" ? "gray" : "blue"}
              variant="light"
            >
              {getRoleLabel(effectiveSession)}
            </Badge>
            <Avatar
              size={30}
              radius="xl"
              color={effectiveSession.primaryRole === "owner" ? "blue" : "teal"}
            >
              {effectiveSession.primaryRole.slice(0, 1).toUpperCase()}
            </Avatar>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <ScrollArea type="never" flex={1}>
          <Stack gap={2} pt={4}>
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.id}
                label={item.label}
                leftSection={item.icon}
                active={activePage === item.id}
                onClick={() => setActivePage(item.id)}
                styles={{ root: { borderRadius: 6 } }}
              />
            ))}
          </Stack>
        </ScrollArea>

        <Divider my="xs" />
        <NavLink
          label="Cài đặt"
          leftSection={<GearIcon size={18} />}
          onClick={() => setSettingsOpened(true)}
          styles={{ root: { borderRadius: 6 } }}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={1100} mx="auto">
          <Paper withBorder radius="md" p="md" mb="md">
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <PlugIcon size={18} />
                <Text fw={700}>Tài khoản kết nối</Text>
              </Group>
              <Badge variant="outline">{session ? "Connected" : "Guest"}</Badge>
            </Group>
            <Stack gap={6} mt="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Địa chỉ protocol
                </Text>
                <Text size="sm" ff="monospace">
                  {PROTOCOL_ADDRESS}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Địa chỉ ví
                </Text>
                <Text size="sm" ff="monospace">
                  {effectiveSession.address}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Role
                </Text>
                <Text size="sm">{getRoleLabel(effectiveSession)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Số dư
                </Text>
                <Text size="sm" ff="monospace">
                  {balanceEth} ETH
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Network
                </Text>
                <Text size="sm">{networkName}</Text>
              </Group>
            </Stack>
          </Paper>

          <Paper withBorder radius="md" p="md" mb="md">
            <Group justify="space-between" align="flex-start">
              <Box>
                <Group gap="xs" mb={6}>
                  <ShieldCheckIcon size={18} />
                  <Text fw={700}>Phạm vi ví đang kết nối</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  {getScopeDescription(effectiveSession)}
                </Text>
              </Box>
              <Badge variant="outline">
                {effectiveSession.tenantId
                  ? `Tenant #${shortBytes32(effectiveSession.tenantId)}`
                  : "Global"}
              </Badge>
            </Group>
          </Paper>

          {effectiveSession.primaryRole === "guest" ? (
            <Alert
              color="gray"
              variant="light"
              icon={<WarningCircleIcon size={18} />}
              title="Guest / Read-only"
              mb="md"
            >
              Bạn đang ở chế độ xem, tra cứu và xác thực. Các chức năng set/cập
              nhật đã bị khóa.
            </Alert>
          ) : null}

          {pageMap[activePage]}
        </Box>
      </AppShell.Main>

      <Modal
        opened={loginOpened}
        onClose={() => setLoginOpened(false)}
        title="Đăng nhập bằng Private Key"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Private Key"
            placeholder="0x..."
            value={privateKey}
            onChange={(event) => setPrivateKey(event.currentTarget.value)}
            ff="monospace"
          />
          {loginError ? (
            <Text size="sm" c="red">
              {loginError}
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setLoginOpened(false)}>
              Hủy
            </Button>
            <Button onClick={handleConnectByPrivateKey} loading={loginLoading}>
              Đăng nhập
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
        title={<Title order={3}>Cài đặt</Title>}
        size="xl"
      >
        <Settings
          session={effectiveSession}
          capabilities={capabilities}
          networkName={networkName}
          balanceEth={balanceEth}
        />
      </Modal>
    </AppShell>
  );
}
