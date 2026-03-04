import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import C from '@/constants/colors';

const THEMES = ['Dark', 'Darker', 'Midnight'] as const;

function PremiumModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.premiumModal, { paddingBottom: insets.bottom + 24 }]}>
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
              ['AI reflection insights & weekly analysis', 'brain'],
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
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); }}
          >
            <LinearGradient colors={[C.gold, '#B45309']} style={StyleSheet.absoluteFill} start={{x:0,y:0}} end={{x:1,y:0}} />
            <Text style={styles.premiumCtaText}>Unlock Manas Premium</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
          <Text style={styles.premiumNote}>No pressure. Cancel anytime.</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useApp();
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<typeof THEMES[number]>('Midnight');
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const isPremium = user?.plan === 'premium';
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'M';

  const SETTINGS_ROWS = [
    { icon: 'notifications', label: 'Notifications', action: () => setNotifications(n => !n), right: notifications ? 'On' : 'Off', color: C.lavender },
    { icon: 'moon', label: 'Theme', action: () => {}, right: selectedTheme, color: '#818CF8' },
    { icon: 'time', label: 'Daily Reminder', action: () => {}, right: reminderTime, color: C.sage },
  ];

  const ABOUT_ROWS = [
    { icon: 'information-circle', label: 'About Manas', color: C.textSub },
    { icon: 'shield-checkmark', label: 'Privacy Policy', color: C.textSub },
    { icon: 'help-circle', label: 'Help & Support', color: C.textSub },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: botInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <LinearGradient colors={[C.wisteria, C.mauve, C.lightSky]} style={styles.logoGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name="heart" size={12} color="#fff" />
            </LinearGradient>
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
            <Text style={styles.avatarPlan}>{isPremium ? '✦ Premium Member' : 'Free Plan'}</Text>
          </View>
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

        {/* Theme selector */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="color-palette" size={16} color={C.lavender} />
            <Text style={styles.cardTitle}>Theme</Text>
          </View>
          <View style={styles.themeRow}>
            {THEMES.map(t => (
              <Pressable
                key={t}
                style={[styles.themeChip, selectedTheme === t && { borderColor: C.lavender, backgroundColor: C.lavender + '20' }]}
                onPress={() => { setSelectedTheme(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.themeChipText, { color: selectedTheme === t ? C.lavender : C.textSub }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Retake onboarding */}
        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.7 }]}
          onPress={() => {}}
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
              onPress={() => {}}
            >
              <Ionicons name={row.icon as any} size={16} color={C.textSub} />
              <Text style={styles.settingsLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginLeft: 'auto' }} />
            </Pressable>
          ))}
        </View>

        <View style={styles.brandRow}>
          <LinearGradient colors={[C.wisteria, C.mauve, C.lightSky]} style={styles.brandLogo} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Ionicons name="heart" size={10} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandText}>manas</Text>
        </View>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      <PremiumModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { gap: 14, paddingHorizontal: 20 },
  header: { paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoGrad: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
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
  avatarInfo: { gap: 4 },
  avatarName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  avatarPlan: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.gold },
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
  themeRow: { flexDirection: 'row', gap: 10 },
  themeChip: {
    flex: 1, paddingVertical: 10, borderRadius: 100, alignItems: 'center',
    borderWidth: 1, borderColor: C.border, backgroundColor: C.bg,
  },
  themeChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.lavender + '40',
  },
  outlineBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  brandLogo: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
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
});
