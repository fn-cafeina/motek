import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../lib/auth";
import { useCSSVariable } from "uniwind";
import { LayoutDashboard, Users, ClipboardList, Package, FileText, TriangleAlert } from "lucide-react-native";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const primary = useCSSVariable("--color-primary") as string;
  const subtle = useCSSVariable("--color-subtle") as string;
  const surface = useCSSVariable("--color-surface") as string;

  if (!loading && !user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: subtle,
        headerStyle: { backgroundColor: surface },
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ordenes"
        options={{
          title: "Ordenes",
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="repuestos"
        options={{
          title: "Repuestos",
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="facturas"
        options={{
          title: "Facturas",
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color, size }) => <TriangleAlert size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
