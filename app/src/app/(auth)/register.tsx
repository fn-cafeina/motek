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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [nombre, setNombre] = useState("");
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
    const nextPasswordError = !password ? "Ingresá una contraseña" : password.length < 6 ? "La contraseña debe tener al menos 6 caracteres" : "";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setServerError("");
    if (nextEmailError || nextPasswordError) return;

    setSaving(true);
    try {
      await register(email.trim(), password, nombre.trim() || undefined);
    } catch (error) {
      setServerError(getErrorMessage(error, "No se pudo crear la cuenta"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCard title="Crear cuenta">
      <View className="gap-4">
        {serverError ? <Alert variant="danger" message={serverError} /> : null}
        <Field
          label="Nombre (opcional)"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
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
          hint="Mínimo 6 caracteres"
          placeholder="Tu contraseña"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void handleSubmit()}
        />
        <Button onPress={() => void handleSubmit()} loading={saving} className="w-full">
          {saving ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
        <View className="flex-row justify-center pt-1">
          <Text className="text-sm text-muted">¿Ya tenés cuenta? </Text>
          <Link href="/login" asChild>
            <Text className="text-sm font-semibold text-primary" accessibilityRole="link">
              Iniciá sesión
            </Text>
          </Link>
        </View>
      </View>
    </AuthCard>
  );
}
