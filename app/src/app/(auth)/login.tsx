import { useState } from "react";
import { Link } from "expo-router";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { getErrorMessage } from "../../lib/errors";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Alert";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError("Completá email y contraseña");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await login(email, password);
    } catch (e) {
      setError(getErrorMessage(e, "Error al iniciar sesión"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-canvas">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-fg">Motek</Text>
          <Text className="text-sm text-muted mt-1">Sistema para taller mecánico</Text>
        </View>

        {error ? <Alert variant="danger" message={error} /> : null}

        <View className="gap-4 mt-4">
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" autoCapitalize="none" keyboardType="email-address" />
          <Field label="Contraseña" value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry />
          <Button onPress={handleSubmit} disabled={saving}>
            {saving ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-sm text-muted">¿No tenés cuenta? </Text>
          <Link href="/register" asChild>
            <Text className="text-sm text-primary font-semibold">Registrate</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
