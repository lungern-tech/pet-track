import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';
import { ApiError } from '../services/RequestManager';
import { registerUser } from '../services/usersApi';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  border: '#E5E4E1',
};

type RegisterNav = NativeStackNavigationProp<RootStackParamList>;

type RegisterErrors = Partial<{
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: string;
  submit: string;
}>;

type RegisterTouched = Partial<Record<'nickname' | 'email' | 'password' | 'confirmPassword', boolean>>;

const ERROR_ORDER: (keyof RegisterErrors)[] = [
  'nickname',
  'email',
  'password',
  'confirmPassword',
  'agree',
  'submit',
];

function getFirstErrorKey(errors: RegisterErrors): keyof RegisterErrors | null {
  for (const k of ERROR_ORDER) {
    if (errors[k]) return k;
  }
  return null;
}

function validateField(
  field: keyof RegisterTouched,
  input: {
    nickname: string;
    email: string;
    password: string;
    confirmPassword: string;
  },
): string | undefined {
  const trimmedNickname = input.nickname.trim();
  const trimmedEmail = input.email.trim();

  switch (field) {
    case 'nickname':
      return trimmedNickname ? undefined : '请输入昵称';
    case 'email':
      if (!trimmedEmail) return '请输入邮箱';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return '邮箱格式不正确';
      return undefined;
    case 'password':
      return input.password.length >= 8 ? undefined : '密码至少 8 位';
    case 'confirmPassword':
      return input.confirmPassword === input.password
        ? undefined
        : '两次输入的密码不一致';
  }
}

function validateRegister(input: {
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}): RegisterErrors {
  const errors: RegisterErrors = {};

  const trimmedNickname = input.nickname.trim();
  const trimmedEmail = input.email.trim();

  if (!trimmedNickname) errors.nickname = '请输入昵称';

  if (!trimmedEmail) {
    errors.email = '请输入邮箱';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = '邮箱格式不正确';
  }

  if (input.password.length < 8) errors.password = '密码至少 8 位';
  if (input.confirmPassword !== input.password)
    errors.confirmPassword = '两次输入的密码不一致';

  if (!input.agree) errors.agree = '请先勾选同意《用户协议》和《隐私政策》';

  return errors;
}

export function RegisterScreen() {
  const navigation = useNavigation<RegisterNav>();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [touched, setTouched] = useState<RegisterTouched>({});

  const visibleErrors: RegisterErrors = attemptedSubmit
    ? errors
    : {
        nickname: touched.nickname ? errors.nickname : undefined,
        email: touched.email ? errors.email : undefined,
        password: touched.password ? errors.password : undefined,
        confirmPassword: touched.confirmPassword ? errors.confirmPassword : undefined,
      };

  const firstErrorKey = getFirstErrorKey(visibleErrors);

  const clearFieldError = (field: keyof RegisterTouched) => {
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      submit: undefined,
    }));
  };

  const runFieldValidation = (field: keyof RegisterTouched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateField(field, { nickname, email, password, confirmPassword });
    setErrors((prev) => ({
      ...prev,
      [field]: msg,
      submit: undefined,
    }));
  };

  const handleRegister = async () => {
    if (submitting) return;
    setAttemptedSubmit(true);

    const v = validateRegister({
      nickname,
      email,
      password,
      confirmPassword,
      agree,
    });
    setTouched({
      nickname: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    const trimmedEmail = email.trim();
    const displayName = nickname.trim();

    setSubmitting(true);
    try {
      await registerUser({
        email: trimmedEmail,
        password,
        displayName,
      });

      navigation.navigate(RootStackRoute.Login);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '注册失败，请稍后再试';
      setErrors({ submit: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>注册</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>创建您的账户</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>昵称</Text>
              <TextInput
                style={[
                  styles.input,
                  firstErrorKey === 'nickname' && styles.inputError,
                ]}
                placeholder="请输入昵称"
                placeholderTextColor={COLORS.textMuted}
                value={nickname}
                onChangeText={setNickname}
                onFocus={() => clearFieldError('nickname')}
                onBlur={() => runFieldValidation('nickname')}
              />
              {firstErrorKey === 'nickname' && visibleErrors.nickname && (
                <Text style={styles.fieldError}>{visibleErrors.nickname}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>邮箱</Text>
              <TextInput
                style={[
                  styles.input,
                  firstErrorKey === 'email' && styles.inputError,
                ]}
                placeholder="请输入邮箱"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => clearFieldError('email')}
                onBlur={() => runFieldValidation('email')}
              />
              {firstErrorKey === 'email' && visibleErrors.email && (
                <Text style={styles.fieldError}>{visibleErrors.email}</Text>
              )}
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>密码</Text>
                <Text style={styles.labelHint}>至少 8 位</Text>
              </View>
              <View
                style={[
                  styles.passwordRow,
                  firstErrorKey === 'password' && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="请输入密码"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => clearFieldError('password')}
                  onBlur={() => runFieldValidation('password')}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                >
                  <Feather
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              </View>
              {firstErrorKey === 'password' && visibleErrors.password && (
                <Text style={styles.fieldError}>{visibleErrors.password}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>确认密码</Text>
              <View
                style={[
                  styles.passwordRow,
                  firstErrorKey === 'confirmPassword' && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="请再次输入密码"
                  placeholderTextColor={COLORS.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  onFocus={() => clearFieldError('confirmPassword')}
                  onBlur={() => runFieldValidation('confirmPassword')}
                />
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={8}
                >
                  <Feather
                    name={showConfirm ? 'eye' : 'eye-off'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              </View>
              {firstErrorKey === 'confirmPassword' &&
                visibleErrors.confirmPassword && (
                  <Text style={styles.fieldError}>
                    {visibleErrors.confirmPassword}
                  </Text>
                )}
            </View>

            <View style={styles.agreementRow}>
              <Pressable
                style={[
                  styles.checkbox,
                  agree && styles.checkboxChecked,
                ]}
                onPress={() => setAgree((v) => !v)}
              >
                {agree && (
                  <Feather name="check" size={16} color="#FFFFFF" />
                )}
              </Pressable>
              <Text style={styles.agreementText}>我已阅读并同意</Text>
              <Pressable
                onPress={() => navigation.navigate(RootStackRoute.TermsOfService)}
              >
                <Text style={styles.agreementLink}>《用户协议》</Text>
              </Pressable>
              <Text style={styles.agreementText}>和</Text>
              <Pressable
                onPress={() => navigation.navigate(RootStackRoute.PrivacyPolicy)}
              >
                <Text style={styles.agreementLink}>《隐私政策》</Text>
              </Pressable>
            </View>
            {firstErrorKey === 'agree' && visibleErrors.agree && (
              <Text style={styles.agreementError}>
                {visibleErrors.agree}
              </Text>
            )}

            <Pressable
              style={[
                styles.primaryButton,
                submitting && styles.primaryButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? '注册中...' : '注册'}
              </Text>
            </Pressable>
            {firstErrorKey === 'submit' && errors.submit && (
              <Text style={styles.submitError}>{errors.submit}</Text>
            )}
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>已有账户？</Text>
            <Pressable
              onPress={() => navigation.navigate(RootStackRoute.Login)}
            >
              <Text style={styles.bottomLink}>立即登录</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 24,
    height: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelHint: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  passwordRow: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  agreementText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  agreementLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  agreementError: {
    marginTop: -8,
    fontSize: 12,
    color: '#E05252',
  },
  submitError: {
    marginTop: -4,
    fontSize: 12,
    color: '#E05252',
    fontWeight: '500',
  },
  fieldError: {
    fontSize: 12,
    color: '#E05252',
    marginTop: 6,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#E05252',
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  bottomText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bottomLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

