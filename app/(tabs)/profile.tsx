import React, { useState, useRef, useCallback } from 'react';
// @ts-ignore
const LOGO = require('@/assets/logo.png');
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Modal, Image, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import C from '@/constants/colors';

const THEMES = ['Dark', 'Darker', 'Midnight'] as const;

const REMINDER_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
  '12:00', '15:00', '18:00', '20:00', '21:00', '22:00',
];

function PremiumModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.premiumModal, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}>
          <LinearGradient colors={['#2A1A00', '#1A1035', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={styles.premiumHandle} />
          <View style={styles.premiumBadge}>
            <LinearGradient colors={[C.gold, '#B45309']} style={StyleSheet.absoluteFill} />
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={styles.premiumBadgeText}>Manas Premium</Text>
          </View>
          <Text style={styles.premiumTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.premiumSub}>Access every feature designed to transform your mental wellness.</Text>
          <View style={styles.premiumFeatures}>
            {[
              ['AI reflection insights & weekly analysis', 'analytics-outline'],
              ['Guided voice narration in breathwork', 'mic'],
              ['Layered soundscapes with custom mixing', 'layers'],
              ['Binaural beats & offline music', 'musical-notes'],
              ['Advanced cognitive training games', 'flash'],
              ['Downloadable journal summaries', 'download'],
            ].map(([feat, icon]) => (
              <View key={feat} style={styles.premiumFeatureRow}>
                <View style={styles.premiumFeatureIcon}>
                  <Ionicons name={icon as any} size={14} color={C.gold} />
                </View>
                <Text style={styles.premiumFeatureText}>{feat}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.premiumCta, pressed && { opacity: 0.85 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Coming Soon', "Premium subscriptions are launching soon. You'll be notified when it's available.");
            }}
          >
            <LinearGradient colors={[C.gold, '#B45309']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.premiumCtaText}>Unlock Manas Premium</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
          <Text style={styles.premiumNote}>No pressure. Cancel anytime.</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

function EditNameModal({ visible, currentName, onClose, onSave }: {
  visible: boolean; currentName: string; onClose: () => void; onSave: (n: string) => void;
}) {
  const [name, setName] = useState(currentName);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.editModal, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }]}>
          <LinearGradient colors={[C.lavender + '20', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={styles.premiumHandle} />
          <Text style={styles.editModalTitle}>Edit Name</Text>
          <TextInput
            style={styles.editInput}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={C.textMuted}
            autoFocus
            selectionColor={C.lavender}
            maxLength={30}
          />
          <View style={styles.editActions}>
            <Pressable style={styles.editCancel} onPress={onClose}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.editSave, { opacity: name.trim() ? 1 : 0.4 }]}
              onPress={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
            >
              <LinearGradient colors={[C.lavender, C.wisteria]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={styles.editSaveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ReminderModal({ visible, current, onClose, onSelect }: {
  visible: boolean; current: string; onClose: () => void; onSelect: (t: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.reminderModal, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }]}>
          <LinearGradient colors={[C.sage + '20', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={styles.premiumHandle} />
          <Text style={styles.editModalTitle}>Daily Reminder</Text>
          <Text style={styles.reminderSub}>Choose a time to check in each day</Text>
          <View style={styles.timeGrid}>
            {REMINDER_TIMES.map(t => (
              <Pressable
                key={t}
                style={[styles.timeChip, current === t && { backgroundColor: C.sage + '25', borderColor: C.sage }]}
                onPress={() => { onSelect(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
              >
                <Text style={[styles.timeChipText, { color: current === t ? C.sage : C.textSub }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useApp();
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<typeof THEMES[number]>('Midnight');
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const scrollRef = useRef<any>(null);
  useFocusEffect(useCallback(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, []));

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const isPremium = user?.plan === 'premium';
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'M';

  const nextTheme = () => {
    const idx = THEMES.indexOf(selectedTheme);
    setSelectedTheme(THEMES[(idx + 1) % THEMES.length]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const SETTINGS_ROWS = [
    {
      icon: 'notifications', label: 'Notifications',
      action: () => { setNotifications(n => !n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
      right: notifications ? 'On' : 'Off', color: C.lavender,
    },
    {
      icon: 'moon', label: 'Theme',
      action: nextTheme,
      right: selectedTheme, color: '#818CF8',
    },
    {
      icon: 'time', label: 'Daily Reminder',
      action: () => setReminderVisible(true),
      right: reminderTime, color: C.sage,
    },
  ];

  const ABOUT_ROWS = [
    {
      icon: 'information-circle', label: 'About Manas', color: C.textSub,
      onPress: () => Alert.alert('About Manas', 'Manas is a premium mental wellness app built to sharpen your mind, calm your body, and help you grow from within.\n\nVersion 1.0.0'),
    },
    {
      icon: 'shield-checkmark', label: 'Privacy Policy', color: C.textSub,
      onPress: () => Alert.alert('Privacy Policy', 'Manas stores all your data locally on your device. We do not collect, share, or sell personal information. Your journal entries and mood data never leave your phone.'),
    },
    {
      icon: 'help-circle', label: 'Help & Support', color: C.textSub,
      onPress: () => Alert.alert('Help & Support', 'For help, reach out at support@manas.app — we typically respond within 24 hours.'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingTop: topInset + 8, paddingBottom: botInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Image source={LOGO} style={styles.logoGrad} />
            <Text style={styles.screenTitle}>Profile</Text>
          </View>
        </View>

        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <LinearGradient colors={[C.lavender + '20', C.mauve + '10', C.card]} style={StyleSheet.absoluteFill} />
          <View style={styles.avatarCircle}>
            <LinearGradient colors={[C.wisteria, C.mauve]} style={StyleSheet.absoluteFill} />
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{user?.name ?? 'Manas User'}</Text>
            {isPremium ? (
              <View style={styles.premiumBadgeRow}>
                <Ionicons name="star" size={11} color={C.gold} />
                <Text style={styles.avatarPlan}>Premium Member</Text>
              </View>
            ) : (
              <Text style={[styles.avatarPlan, { color: C.textSub }]}>Free Plan</Text>
            )}
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => setEditNameVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="pencil" size={16} color={C.textSub} />
          </Pressable>
        </View>

        {/* Premium card */}
        <Pressable
          style={({ pressed }) => [styles.premiumCard, pressed && { opacity: 0.85 }]}
          onPress={() => { if (!isPremium) setPremiumVisible(true); }}
        >
          <LinearGradient colors={['#2A1A00', '#3D2200', '#2A1A00']} style={StyleSheet.absoluteFill} />
          <View style={styles.premiumCardLeft}>
            <View style={styles.premiumCardIcon}>
              <Ionicons name="star" size={20} color={C.gold} />
            </View>
            <View style={styles.premiumCardText}>
              <Text style={styles.premiumCardTitle}>{isPremium ? 'Premium Active' : 'Upgrade to Premium'}</Text>
              <Text style={styles.premiumCardSub}>{isPremium ? 'You have access to all features' : 'Unlock all games, sounds, and insights'}</Text>
            </View>
          </View>
          {!isPremium && (
            <View style={styles.premiumCardBadge}>
              <Text style={styles.premiumCardBadgeText}>Unlock</Text>
            </View>
          )}
        </Pressable>

        {/* Wellness Goals */}
        {user?.goals && user.goals.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={16} color={C.sage} />
              <Text style={styles.cardTitle}>Your Goals</Text>
            </View>
            <View style={styles.goalsRow}>
              {user.goals.map(g => (
                <View key={g} style={styles.goalChip}>
                  <Text style={styles.goalChipText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings" size={16} color={C.textSub} />
            <Text style={styles.cardTitle}>Settings</Text>
          </View>
          {SETTINGS_ROWS.map((row, i) => (
            <Pressable
              key={row.label}
              style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }, i < SETTINGS_ROWS.length - 1 && styles.settingsBorder]}
              onPress={row.action}
            >
              <View style={[styles.settingsIcon, { backgroundColor: row.color + '20' }]}>
                <Ionicons name={row.icon as any} size={16} color={row.color} />
              </View>
              <Text style={styles.settingsLabel}>{row.label}</Text>
              <Text style={styles.settingsRight}>{row.right}</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Retake onboarding */}
        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/onboarding' as any)}
        >
          <Ionicons name="refresh" size={18} color={C.lavender} />
          <Text style={[styles.outlineBtnText, { color: C.lavender }]}>Retake Wellness Quiz</Text>
        </Pressable>

        {/* About */}
        <View style={styles.card}>
          {ABOUT_ROWS.map((row, i) => (
            <Pressable
              key={row.label}
              style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }, i < ABOUT_ROWS.length - 1 && styles.settingsBorder]}
              onPress={row.onPress}
            >
              <Ionicons name={row.icon as any} size={16} color={C.textSub} />
              <Text style={styles.settingsLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginLeft: 'auto' }} />
            </Pressable>
          ))}
        </View>

        <View style={styles.brandRow}>
          <Image source={LOGO} style={styles.brandLogo} />
          <Text style={styles.brandText}>manas</Text>
        </View>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      <PremiumModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />
      <EditNameModal
        visible={editNameVisible}
        currentName={user?.name ?? ''}
        onClose={() => setEditNameVisible(false)}
        onSave={(n) => updateUser({ name: n })}
      />
      <ReminderModal
        visible={reminderVisible}
        current={reminderTime}
        onClose={() => setReminderVisible(false)}
        onSelect={setReminderTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { gap: 14, paddingHorizontal: 20 },
  header: { paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoGrad: { width: 28, height: 28, borderRadius: 10, overflow: 'hidden' },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  avatarCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 20, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card, overflow: 'hidden',
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff' },
  avatarInfo: { gap: 4, flex: 1 },
  avatarName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  avatarPlan: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.gold },
  premiumBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  premiumCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: C.gold + '40',
  },
  premiumCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  premiumCardIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.gold + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumCardText: { gap: 2, flex: 1 },
  premiumCardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.gold },
  premiumCardSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 18 },
  premiumCardBadge: {
    backgroundColor: C.gold, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
  },
  premiumCardBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.bg },
  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 18, gap: 14,
    borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text },
  goalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
    backgroundColor: C.lavender + '20', borderWidth: 1, borderColor: C.lavender + '40',
  },
  goalChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.lavender },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  settingsBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  settingsIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.text, flex: 1 },
  settingsRight: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.lavender + '40',
  },
  outlineBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  brandLogo: { width: 24, height: 24, borderRadius: 8, overflow: 'hidden' },
  brandText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.textSub },
  versionText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  premiumModal: {
    backgroundColor: C.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.gold + '30',
  },
  premiumHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 8 },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center',
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, overflow: 'hidden',
  },
  premiumBadgeText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  premiumTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' },
  premiumSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22 },
  premiumFeatures: { gap: 10 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumFeatureIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.gold + '20', alignItems: 'center', justifyContent: 'center' },
  premiumFeatureText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text, flex: 1 },
  premiumCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16, overflow: 'hidden',
  },
  premiumCtaText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  premiumNote: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center' },
  editModal: {
    backgroundColor: C.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.lavender + '30',
  },
  editModalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  editInput: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    fontSize: 17, fontFamily: 'Inter_400Regular', color: C.text,
    borderWidth: 1, borderColor: C.lavender + '50',
  },
  editActions: { flexDirection: 'row', gap: 12 },
  editCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  editCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.textSub },
  editSave: {
    flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    overflow: 'hidden',
  },
  editSaveText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  reminderModal: {
    backgroundColor: C.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.sage + '30',
  },
  reminderSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  timeChipText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
