import React, { useState } from 'react';
import {
  Image,
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
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../services/RequestManager';
import { loginUser } from '../services/authApi';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  border: '#E5E4E1',
};

type LoginNav = NativeStackNavigationProp<RootStackParamList>;

type LoginErrors = Partial<{
  email: string;
  password: string;
  submit: string;
}>;

type LoginTouched = Partial<Record<'email' | 'password', boolean>>;

const ERROR_ORDER: (keyof LoginErrors)[] = ['email', 'password', 'submit'];

function getFirstErrorKey(errors: LoginErrors): keyof LoginErrors | null {
  for (const k of ERROR_ORDER) {
    if (errors[k]) return k;
  }
  return null;
}

function validateField(
  field: keyof LoginTouched,
  input: { email: string; password: string },
): string | undefined {
  const trimmedEmail = input.email.trim();

  switch (field) {
    case 'email':
      if (!trimmedEmail) return '请输入邮箱';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return '邮箱格式不正确';
      return undefined;
    case 'password':
      return input.password ? undefined : '请输入密码';
  }
}

function validateLogin(input: { email: string; password: string }): LoginErrors {
  const errors: LoginErrors = {};
  const emailError = validateField('email', input);
  const passwordError = validateField('password', input);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

export function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [touched, setTouched] = useState<LoginTouched>({});
  const [errors, setErrors] = useState<LoginErrors>({});

  const visibleErrors: LoginErrors = attemptedSubmit
    ? errors
    : {
        email: touched.email ? errors.email : undefined,
        password: touched.password ? errors.password : undefined,
      };

  const firstErrorKey = getFirstErrorKey(visibleErrors);

  const clearFieldError = (field: keyof LoginTouched) => {
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      submit: undefined,
    }));
  };

  const runFieldValidation = (field: keyof LoginTouched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateField(field, { email, password });
    setErrors((prev) => ({
      ...prev,
      [field]: msg,
      submit: undefined,
    }));
  };

  const handleLogin = async () => {
    if (submitting) return;
    setAttemptedSubmit(true);
    setTouched({ email: true, password: true });

    const v = validateLogin({ email, password });
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    const trimmedEmail = email.trim();
    setSubmitting(true);
    try {
      const data = await loginUser({
        email: trimmedEmail,
        password,
      });

      const dn = data.user.displayName?.trim();
      const em = data.user.email?.trim();
      setSession({
        accessToken: data.accessToken,
        refreshToken: null,
        userId: String(data.user.id),
        displayName: dn ? dn : null,
        email: em ? em : trimmedEmail || null,
      });
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '登录失败，请稍后再试';
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.title}>欢迎回来</Text>
          <Text style={styles.subtitle}>登录您的账户</Text>

          <View style={styles.form}>
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
              <Text style={styles.label}>密码</Text>
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

            <Pressable
              style={styles.forgotPress}
              onPress={() => navigation.navigate(RootStackRoute.ForgotPassword)}
            >
              <Text style={styles.forgotText}>忘记密码？</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? '登录中...' : '登录'}
              </Text>
            </Pressable>
            {firstErrorKey === 'submit' && errors.submit && (
              <Text style={styles.submitError}>{errors.submit}</Text>
            )}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton
              iconColor="#07C160"
              label="微信"
              iconSet="feather"
              iconName="message-circle"
            />
            <SocialButton
              iconColor="#000000"
              label="Apple"
              iconSet="ionicons"
              ioniconsName="logo-apple"
            />
            <SocialButton
              iconColor="#4285F4"
              label="Google"
              iconSet="feather"
              iconName="globe"
            />
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>还没有账户？</Text>
            <Pressable
              onPress={() => navigation.navigate(RootStackRoute.Register)}
            >
              <Text style={styles.bottomLink}>立即注册</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type SocialButtonProps =
  | {
      iconColor: string;
      label: string;
      iconSet: 'feather';
      iconName: React.ComponentProps<typeof Feather>['name'];
    }
  | {
      iconColor: string;
      label: string;
      iconSet: 'ionicons';
      ioniconsName: keyof typeof Ionicons.glyphMap;
    };

function SocialButton(props: SocialButtonProps) {
  const { iconColor, label } = props;
  return (
    <View style={styles.socialButton}>
      <View style={[styles.socialIconCircle, { backgroundColor: '#FFFFFF' }]}>
        {props.iconSet === 'feather' ? (
          <Feather name={props.iconName} size={32} color={iconColor} />
        ) : (
          <Ionicons name={props.ioniconsName} size={32} color={iconColor} />
        )}
      </View>
      <Text style={styles.socialLabel}>{label}</Text>
    </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
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
  inputError: {
    borderColor: '#E05252',
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
  fieldError: {
    fontSize: 12,
    color: '#E05252',
    marginTop: 6,
    fontWeight: '500',
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    marginRight: 8,
  },
  forgotPress: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitError: {
    marginTop: -8,
    fontSize: 12,
    color: '#E05252',
    fontWeight: '500',
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  socialButton: {
    width: 80,
    alignItems: 'center',
    gap: 6,
  },
  socialIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1918',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
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

