import { useState } from "react";
import { Link } from "expo-router";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { getErrorMessage } from "../../lib/errors";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Alert";
import { AuthCard } from "../../components/ui/AuthCard";

const demoUsers = [
  { label: "Admin", email: "admin@motek.local", password: "admin123" },
  { label: "Recepción", email: "recepcion@motek.local", password: "recepcion123" },
  { label: "Taller", email: "tecnico@motek.local", password: "tecnico123" },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleLogin(emailValue: string, passwordValue: string) {
    setSaving(true);
    setError("");
    try {
      await login(emailValue, passwordValue);
    } catch (e) {
      setError(getErrorMessage(e, "Error al iniciar sesión"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!email || !password) {
      setError("Completá email y contraseña");
      return;
    }
    await handleLogin(email, password);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-canvas">
      <AuthCard title="Iniciar sesión">
        <View className="gap-4">
          {error ? <Alert variant="danger" message={error} /> : null}
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" autoCapitalize="none" keyboardType="email-address" />
          <Field label="Contraseña" value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry />
          <Button onPress={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Ingresando..." : "Iniciar sesión"}
          </Button>
          <View className="gap-2 border-t border-border pt-4">
            <Text className="text-center text-xs text-subtle">Acceso rápido de demo</Text>
            <View className="flex-row gap-2">
              {demoUsers.map((demo) => (
                <Button
                  key={demo.email}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  disabled={saving}
                  onPress={() => void handleLogin(demo.email, demo.password)}
                >
                  {demo.label}
                </Button>
              ))}
            </View>
          </View>
          <View className="flex-row justify-center pt-1">
            <Text className="text-sm text-muted">¿No tenés cuenta? </Text>
            <Link href="/register" asChild><Text className="text-sm text-primary font-semibold">Registrate</Text></Link>
          </View>
        </View>
      </AuthCard>
    </KeyboardAvoidingView>
  );
}
