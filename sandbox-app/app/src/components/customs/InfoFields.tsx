import {
  ActionIcon,
  CopyButton,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { shortAddress, shortBytes32, shortValue } from "../../utils/display";

export interface InfoFieldItem {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}

export function CopyableValue({
  value,
  mono,
  truncate = true,
  maxWidth = 360,
  align = "left",
}: {
  value: string;
  mono?: boolean;
  truncate?: boolean;
  maxWidth?: number;
  align?: "left" | "right";
}) {
  const getDisplayValue = () => {
    if (!truncate) return value;

    const trimmed = value.trim();
    if (trimmed.startsWith("0x")) {
      if (trimmed.length === 42) {
        return shortAddress(trimmed);
      }
      if (trimmed.length >= 66) {
        return shortBytes32(trimmed);
      }
    }

    if (trimmed.length > 24) {
      return shortValue(trimmed, 10, 8);
    }

    return trimmed;
  };

  const displayValue = getDisplayValue();

  return (
    <Group
      gap={6}
      wrap="nowrap"
      justify={align === "right" ? "flex-end" : "flex-start"}
    >
      <Text
        size="sm"
        ff={mono ? "monospace" : undefined}
        title={value}
        style={
          truncate
            ? {
                maxWidth,
                whiteSpace: "nowrap",
                userSelect: "text",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }
            : {
                wordBreak: "break-all",
                userSelect: "text",
              }
        }
      >
        {displayValue}
      </Text>

      <CopyButton value={value} timeout={1200}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? "Đã copy" : "Copy"}>
            <ActionIcon variant="subtle" size="sm" onClick={copy}>
              {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
}

export function InfoFieldList({ items }: { items: InfoFieldItem[] }) {
  return (
    <Stack gap={8}>
      {items.map((item) => (
        <Group
          key={item.label}
          justify="space-between"
          wrap="nowrap"
          align="flex-start"
        >
          <Text size="sm" c="dimmed" style={{ minWidth: 160 }}>
            {item.label}
          </Text>
          <CopyableValue
            value={item.value}
            mono={item.mono}
            truncate={item.truncate}
            align="right"
          />
        </Group>
      ))}
    </Stack>
  );
}
