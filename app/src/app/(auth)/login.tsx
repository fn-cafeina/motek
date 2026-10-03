import { useRef, useState } from "react";
import { Link } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { getErrorMessage } from "../../lib/errors";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Alert";
import { AuthCard } from "../../components/ui/AuthCard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (saving) return;
    const nextEmailError = !email.trim() ? "Ingresá tu email" : !EMAIL_RE.test(email.trim()) ? "Revisá el formato del email" : "";
    const nextPasswordError = !password ? "Ingresá tu contraseña" : "";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setServerError("");
    if (nextEmailError || nextPasswordError) return;

    setSaving(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      setServerError(getErrorMessage(error, "No se pudo iniciar sesión"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCard title="Iniciar sesión">
      <View className="gap-4">
        {serverError ? <Alert variant="danger" message={serverError} /> : null}
        <Field
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (emailError) setEmailError("");
          }}
          error={emailError}
          placeholder="tu@email.com"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <Field
          ref={passwordRef}
          label="Contraseña"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) setPasswordError("");
          }}
          error={passwordError}
          placeholder="Tu contraseña"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void handleSubmit()}
        />
        <Button onPress={() => void handleSubmit()} loading={saving} className="w-full">
          {saving ? "Ingresando..." : "Iniciar sesión"}
        </Button>
        <View className="flex-row justify-center pt-1">
          <Text className="text-sm text-muted">¿No tenés cuenta? </Text>
          <Link href="/register" asChild>
            <Text className="text-sm font-semibold text-primary" accessibilityRole="link">
              Registrate
            </Text>
          </Link>
        </View>
      </View>
    </AuthCard>
  );
}
