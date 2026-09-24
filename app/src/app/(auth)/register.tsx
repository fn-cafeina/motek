import { useState } from "react";
import { Link } from "expo-router";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { getErrorMessage } from "../../lib/errors";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Alert";
import { AuthCard } from "../../components/ui/AuthCard";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError("Completá email y contraseña");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await register(email, password);
    } catch (e) {
      setError(getErrorMessage(e, "Error al registrarse"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-canvas">
      <AuthCard title="Crear cuenta">
        <View className="gap-4">
          {error ? <Alert variant="danger" message={error} /> : null}
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" autoCapitalize="none" keyboardType="email-address" />
          <Field label="Contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" secureTextEntry />
          <Button onPress={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
          <View className="flex-row justify-center pt-1">
            <Text className="text-sm text-muted">¿Ya tenés cuenta? </Text>
            <Link href="/login" asChild><Text className="text-sm text-primary font-semibold">Iniciá sesión</Text></Link>
          </View>
        </View>
      </AuthCard>
    </KeyboardAvoidingView>
  );
}
