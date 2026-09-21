import "../global.css";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Uniwind } from "uniwind";
import { AuthProvider, useAuth } from "../lib/auth";
import { Spinner } from "../components/ui/Spinner";
import { ToastContainer } from "../components/ui/Toast";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(app)",
};

function RootLayoutNav() {
  const { loading } = useAuth();

  useEffect(() => {
    Uniwind.setTheme("system");
  }, []);

  if (loading) {
    return <Spinner text="Cargando..." />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <ToastContainer />
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
