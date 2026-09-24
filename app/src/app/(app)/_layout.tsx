import { Link, Redirect, Slot, usePathname, type Href } from "expo-router";
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import { useAuth } from "../../lib/auth";
import { Bell, ClipboardList, FileText, LayoutDashboard, LogOut, Package, TriangleAlert, Users } from "lucide-react-native";

type NavItem = {
  href: Href;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Taller",
    items: [
      { href: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
      { href: "/ordenes", label: "Órdenes", icon: ClipboardList },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/repuestos", label: "Repuestos", icon: Package },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/facturas", label: "Facturas", icon: FileText },
      { href: "/alertas", label: "Alertas", icon: TriangleAlert },
    ],
  },
];

const allItems = navGroups.flatMap((group) => group.items);
const titles: Record<string, string> = Object.fromEntries(allItems.map((item) => [String(item.href), item.label]));

function isActive(pathname: string, href: Href, exact = false) {
  const path = String(href);
  return exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
}

export default function AppLayout() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const primary = useCSSVariable("--color-primary") as string;
  const subtle = useCSSVariable("--color-subtle") as string;
  const desktop = width >= 900;
  const title = titles[pathname] ?? "Motek";
  const email = user?.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "?";
  const activeHref = useMemo(() => allItems.find((item) => isActive(pathname, item.href, item.exact))?.href, [pathname]);

  if (!loading && !user) return <Redirect href="/login" />;

  return (
    <View className={`flex-1 bg-canvas ${desktop ? "flex-row" : ""}`}>
      {desktop && (
        <View className="w-56 border-r border-border bg-surface" style={{ paddingTop: insets.top }}>
          <View className="h-[52px] items-center justify-center border-b border-border">
            <Text className="text-2xl font-bold tracking-tight text-fg">Motek</Text>
          </View>
          <View className="flex-1 gap-6 p-3">
            {navGroups.map((group) => (
              <View key={group.label} className="gap-1">
                <Text className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-subtle">{group.label}</Text>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeHref === item.href;
                  return (
                    <Link key={String(item.href)} href={item.href} className={`flex-row items-center gap-3 rounded-md px-3 py-2.5 ${active ? "bg-primary-soft" : "active:bg-raised"}`}>
                      <Icon size={20} color={active ? primary : subtle} />
                      <Text className={`text-sm font-medium ${active ? "text-primary" : "text-muted"}`}>{item.label}</Text>
                    </Link>
                  );
                })}
              </View>
            ))}
          </View>
          <View className="border-t border-border p-3">
            <View className="mb-2 flex-row items-center gap-2 px-2">
              <View className="size-7 items-center justify-center rounded-md bg-primary-soft">
                <Text className="text-xs font-semibold text-primary">{initial}</Text>
              </View>
              <Text className="flex-1 text-xs text-muted" numberOfLines={1}>{email}</Text>
            </View>
            <Pressable onPress={logout} className="flex-row items-center gap-2 rounded-md px-2 py-2 active:bg-danger-soft">
              <LogOut size={16} className="text-danger" />
              <Text className="text-sm font-medium text-danger">Cerrar sesión</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <View className="h-[52px] flex-row items-center justify-between border-b border-border bg-surface px-4">
          <Text className="text-xl font-semibold tracking-tight text-fg">{title}</Text>
          <View className="flex-row items-center gap-1">
            <Link href="/alertas" className="relative size-9 items-center justify-center rounded-md active:bg-raised">
              <Bell size={20} color={subtle} />
            </Link>
            <Pressable onPress={logout} className="size-9 items-center justify-center rounded-md active:bg-raised">
              <LogOut size={18} color={subtle} />
            </Pressable>
          </View>
        </View>
        <View className="flex-1"><Slot /></View>
        {!desktop && (
          <View className="flex-row border-t border-border bg-surface px-1.5 pt-1" style={{ paddingBottom: Math.max(insets.bottom, 4) }}>
            {allItems.map((item) => {
              const Icon = item.icon;
              const active = activeHref === item.href;
              return (
                <Link key={String(item.href)} href={item.href} className="flex-1 items-center gap-1 rounded-md px-1 py-1.5">
                  <Icon size={19} color={active ? primary : subtle} />
                  <Text className={`text-[10px] font-medium ${active ? "text-primary" : "text-subtle"}`}>{item.label}</Text>
                </Link>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
