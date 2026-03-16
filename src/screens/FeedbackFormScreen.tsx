import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  border: '#E5E4E1',
};

type FeedbackFormNav = NativeStackNavigationProp<RootStackParamList>;

type FeedbackType = 'problem' | 'suggestion';

export function FeedbackFormScreen() {
  const navigation = useNavigation<FeedbackFormNav>();
  const [type, setType] = useState<FeedbackType>('problem');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = () => {
    // 占位：后续接提交接口
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>意见反馈</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.desc}>
            请描述您遇到的问题或建议，我们会认真对待每一条反馈
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>反馈类型</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[
                  styles.typeOption,
                  type === 'problem' && styles.typeOptionActive,
                ]}
                onPress={() => setType('problem')}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    type === 'problem' && styles.typeOptionTextActive,
                  ]}
                >
                  问题反馈
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeOption,
                  type === 'suggestion' && styles.typeOptionActive,
                ]}
                onPress={() => setType('suggestion')}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    type === 'suggestion' && styles.typeOptionTextActive,
                  ]}
                >
                  功能建议
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>反馈内容</Text>
            <TextInput
              style={styles.textArea}
              placeholder="请详细描述您遇到的问题或建议..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={5}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>上传图片（选填）</Text>
            <Pressable style={styles.uploadButton}>
              <Feather name="image" size={24} color={COLORS.primary} />
              <Text style={styles.uploadButtonText}>点击上传图片</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>联系方式（选填）</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入您的邮箱或手机号"
              placeholderTextColor={COLORS.textMuted}
              value={contact}
              onChangeText={setContact}
              keyboardType="email-address"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>提交反馈</Text>
          </Pressable>
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
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
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
    padding: 24,
    paddingBottom: 40,
    gap: 20,
  },
  desc: {
    fontSize: 14,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  field: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  typeOptionTextActive: {
    color: COLORS.surface,
  },
  textArea: {
    height: 160,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  uploadButton: {
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
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
  submitButton: {
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
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
