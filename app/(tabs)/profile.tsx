import React, { useState, useRef, useCallback, useEffect } from 'react';
// @ts-ignore
const LOGO = require('@/assets/logo.png');
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Modal, Image,
  TextInput, Alert, Animated, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useColors, DARK, LIGHT, type Colors } from '@/constants/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const LEVELS = [
  { name: 'Seedling', min: 0, max: 9, icon: 'leaf-outline' as const, desc: 'Just planted the seed of wellness' },
  { name: 'Wanderer', min: 10, max: 24, icon: 'compass-outline' as const, desc: 'Exploring the path to inner peace' },
  { name: 'Seeker', min: 25, max: 49, icon: 'search-outline' as const, desc: 'Actively seeking balance and clarity' },
  { name: 'Practitioner', min: 50, max: 99, icon: 'fitness-outline' as const, desc: 'Building a consistent daily practice' },
  { name: 'Sage', min: 100, max: 199, icon: 'school-outline' as const, desc: 'Wisdom earned through dedication' },
  { name: 'Guardian', min: 200, max: 499, icon: 'shield-checkmark-outline' as const, desc: 'Protecting your peace with mastery' },
  { name: 'Luminary', min: 500, max: Infinity, icon: 'sunny-outline' as const, desc: 'A beacon of mental wellness' },
];

function getLevel(logs: number) {
  return LEVELS.find(l => logs >= l.min && logs <= l.max) || LEVELS[0];
}
function getNextLevel(logs: number) {
  const idx = LEVELS.findIndex(l => logs >= l.min && logs <= l.max);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}
function getLevelProgress(logs: number) {
  const level = getLevel(logs);
  if (level.max === Infinity) return 1;
  const range = level.max - level.min + 1;
  return Math.min((logs - level.min) / range, 1);
}

const REMINDER_TIMES = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
  '12:00', '15:00', '18:00', '20:00', '21:00', '22:00',
];

function PremiumModal({ visible, onClose, C }: { visible: boolean; onClose: () => void; C: Colors }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.modalOverlay} onPress={onClose}>
        <View style={[ms.sheetBase, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24, backgroundColor: C.bg2, borderColor: C.gold + '30' }]}>
          <LinearGradient colors={[C.gold + '20', C.lavender + '15', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={[ms.handle, { backgroundColor: C.border }]} />
          <View style={ms.premiumBadge}>
            <LinearGradient colors={[C.gold, '#B45309']} style={StyleSheet.absoluteFill} />
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={ms.premiumBadgeText}>Manas Premium</Text>
          </View>
          <Text style={[ms.sheetTitle, { color: C.text, textAlign: 'center' as const }]}>Unlock Your Full Potential</Text>
          <Text style={[ms.sheetSub, { color: C.textSub, textAlign: 'center' as const }]}>Access every feature designed to transform your mental wellness.</Text>
          <View style={{ gap: 10 }}>
            {[
              ['AI reflection insights & weekly analysis', 'analytics-outline'] as const,
              ['Guided voice narration in breathwork', 'mic'] as const,
              ['Layered soundscapes with custom mixing', 'layers'] as const,
              ['Binaural beats & offline music', 'musical-notes'] as const,
              ['Advanced cognitive training games', 'flash'] as const,
              ['Downloadable journal summaries', 'download'] as const,
            ].map(([feat, icon]) => (
              <View key={feat} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.gold + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={icon} size={14} color={C.gold} />
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text, flex: 1 }}>{feat}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [ms.premiumCta, pressed && { opacity: 0.85 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Coming Soon', "Premium subscriptions are launching soon. You'll be notified when it's available.");
            }}
          >
            <LinearGradient colors={[C.gold, '#B45309']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' }}>Unlock Manas Premium</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center' }}>No pressure. Cancel anytime.</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

function EditNameModal({ visible, currentName, onClose, onSave, C }: {
  visible: boolean; currentName: string; onClose: () => void; onSave: (n: string) => void; C: Colors;
}) {
  const [name, setName] = useState(currentName);
  useEffect(() => { if (visible) setName(currentName); }, [visible, currentName]);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.modalOverlay} onPress={onClose}>
        <Pressable style={[ms.sheetBase, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20, backgroundColor: C.bg2, borderColor: C.lavender + '30' }]}>
          <LinearGradient colors={[C.lavender + '20', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={[ms.handle, { backgroundColor: C.border }]} />
          <Text style={[ms.sheetTitle, { color: C.text }]}>Edit Name</Text>
          <TextInput
            style={{ backgroundColor: C.card, borderRadius: 14, padding: 16, fontSize: 17, fontFamily: 'Inter_400Regular', color: C.text, borderWidth: 1, borderColor: C.lavender + '50' }}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={C.textMuted}
            autoFocus
            selectionColor={C.lavender}
            maxLength={30}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border }} onPress={onClose}>
              <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.textSub }}>Cancel</Text>
            </Pressable>
            <Pressable
              style={{ flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', overflow: 'hidden', opacity: name.trim() ? 1 : 0.4 }}
              onPress={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
            >
              <LinearGradient colors={[C.lavender, C.wisteria]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' }}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ReminderModal({ visible, current, onClose, onSelect, C }: {
  visible: boolean; current: string; onClose: () => void; onSelect: (t: string) => void; C: Colors;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.modalOverlay} onPress={onClose}>
        <View style={[ms.sheetBase, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20, backgroundColor: C.bg2, borderColor: C.sage + '30' }]}>
          <LinearGradient colors={[C.sage + '20', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={[ms.handle, { backgroundColor: C.border }]} />
          <Text style={[ms.sheetTitle, { color: C.text }]}>Daily Reminder</Text>
          <Text style={[ms.sheetSub, { color: C.textSub }]}>Choose a time to check in each day</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {REMINDER_TIMES.map(t => (
              <Pressable
                key={t}
                style={{
                  paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100,
                  borderWidth: 1, borderColor: current === t ? C.sage : C.border,
                  backgroundColor: current === t ? C.sage + '25' : C.card,
                }}
                onPress={() => { onSelect(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: current === t ? C.sage : C.textSub }}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function ThemeModal({ visible, currentTheme, onClose, onSelect, C }: {
  visible: boolean; currentTheme: 'dark' | 'light'; onClose: () => void; onSelect: (t: 'dark' | 'light') => void; C: Colors;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.modalOverlay} onPress={onClose}>
        <View style={[ms.sheetBase, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20, backgroundColor: C.bg2, borderColor: C.lavender + '30' }]}>
          <LinearGradient colors={[C.lavender + '10', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={[ms.handle, { backgroundColor: C.border }]} />
          <Text style={[ms.sheetTitle, { color: C.text }]}>Choose Theme</Text>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {([['dark', DARK, 'Dark'], ['light', LIGHT, 'Light']] as const).map(([key, palette, label]) => {
              const selected = currentTheme === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => { onSelect(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
                  style={{
                    flex: 1, borderRadius: 16, padding: 14, gap: 8,
                    backgroundColor: palette.bg,
                    borderWidth: 2, borderColor: selected ? C.lavender : palette.border,
                  }}
                >
                  <View style={{ height: 24, backgroundColor: palette.card, borderRadius: 8 }} />
                  <View style={{ height: 10, width: '75%', backgroundColor: palette.textMuted, borderRadius: 4 }} />
                  <View style={{ height: 8, width: '50%', backgroundColor: palette.textMuted, borderRadius: 4 }} />
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.lavender }} />
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.sage }} />
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.gold }} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                    {selected && <Ionicons name="checkmark-circle" size={16} color={C.lavender} />}
                    <Text style={{ fontSize: 13, fontFamily: selected ? 'Inter_700Bold' : 'Inter_500Medium', color: palette.text, textAlign: 'center' }}>{label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    user, updateUser, theme, setTheme, totalWellnessLogs,
    clearAllData, signOut, moodLogs, journalEntries, gameStats,
  } = useApp();
  const C = useColors();

  const [premiumVisible, setPremiumVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showLevel, setShowLevel] = useState(false);
  const levelAnim = useRef(new Animated.Value(0)).current;

  const scrollRef = useRef<any>(null);
  useFocusEffect(useCallback(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, []));

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const isPremium = user?.plan === 'premium';
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'M';
  const level = getLevel(totalWellnessLogs);
  const nextLevel = getNextLevel(totalWellnessLogs);
  const progress = getLevelProgress(totalWellnessLogs);

  const toggleLevel = () => {
    const toValue = showLevel ? 0 : 1;
    setShowLevel(!showLevel);
    Animated.timing(levelAnim, { toValue, duration: 300, useNativeDriver: false }).start();
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => { signOut(); router.replace('/onboarding'); },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure? This will remove all your data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue', style: 'destructive',
        onPress: () => {
          Alert.alert('Permanent Action', 'This cannot be undone. All your wellness data, journal entries, and preferences will be permanently deleted.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete Everything', style: 'destructive',
              onPress: async () => {
                await clearAllData();
                router.replace('/onboarding');
              },
            },
          ]);
        },
      },
    ]);
  };

  const openExternal = (url: string, name: string) => {
    Alert.alert('Leave Manas?', `This will open ${name} in your browser.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open', onPress: () => Linking.openURL(url) },
    ]);
  };

  const SectionIcon = ({ name, color }: { name: IconName; color: string }) => (
    <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={14} color={color} />
    </View>
  );

  const SettingsRow = ({ icon, iconColor, label, right, onPress, last, textColor }: {
    icon: IconName; iconColor: string; label: string; right?: string; onPress: () => void; last?: boolean; textColor?: string;
  }) => (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 14,
        opacity: pressed ? 0.7 : 1,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border,
      })}
      onPress={onPress}
    >
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: iconColor + '20', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: textColor || C.text, flex: 1 }}>{label}</Text>
      {right && <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub }}>{right}</Text>}
      <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
    </Pressable>
  );

  const LEGAL_ROWS: { icon: IconName; label: string; slug: string }[] = [
    { icon: 'information-circle', label: 'About Manas', slug: 'about' },
    { icon: 'shield-checkmark', label: 'Privacy Policy', slug: 'privacy' },
    { icon: 'document-text', label: 'Terms of Service', slug: 'terms' },
    { icon: 'lock-closed', label: 'Data & Privacy', slug: 'data' },
    { icon: 'help-circle', label: 'Help & Support', slug: 'help' },
    { icon: 'mail', label: 'Contact Us', slug: 'contact' },
    { icon: 'bug', label: 'Report a Bug', slug: 'bug' },
    { icon: 'star', label: 'Rate Manas', slug: 'rate' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ gap: 20, paddingHorizontal: 20, paddingTop: topInset + 8, paddingBottom: botInset + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={LOGO} style={{ width: 28, height: 28, borderRadius: 10, overflow: 'hidden' }} />
            <Text style={{ fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text }}>Profile</Text>
          </View>
        </View>

        {/* Section 1 — Identity Card */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border, overflow: 'hidden', alignItems: 'center' }}>
          <LinearGradient colors={[C.lavender + '15', C.mauve + '08', 'transparent']} style={StyleSheet.absoluteFill} />
          <Pressable
            style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 10, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setEditNameVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="pencil" size={16} color={C.textSub} />
          </Pressable>

          <View style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <LinearGradient colors={[C.wisteria, C.mauve]} style={StyleSheet.absoluteFill} />
            <Text style={{ fontSize: 32, fontFamily: 'Inter_700Bold', color: '#fff' }}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, marginBottom: 16 }}>{user?.name ?? 'Manas User'}</Text>

          {/* Level badge */}
          <Pressable onPress={toggleLevel} style={{ alignItems: 'center', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Ionicons name={level.icon} size={16} color={C.lavender} />
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.lavender }}>{level.name}</Text>
              <Ionicons name={showLevel ? 'chevron-up' : 'chevron-down'} size={14} color={C.textMuted} />
            </View>
            {/* Progress bar */}
            <View style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.max(progress * 100, 2)}%`, borderRadius: 3, overflow: 'hidden' }}>
                <LinearGradient colors={[C.lavender, C.wisteria]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              </View>
            </View>
          </Pressable>

          {/* Expandable level detail */}
          <Animated.View style={{
            width: '100%', overflow: 'hidden',
            maxHeight: levelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] }),
            opacity: levelAnim,
          }}>
            <View style={{ marginTop: 16, backgroundColor: C.bg2 + (theme === 'light' ? '' : '80'), borderRadius: 14, padding: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={level.icon} size={20} color={C.lavender} />
                <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text }}>{level.name}</Text>
              </View>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 20 }}>{level.desc}</Text>
              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 4 }} />
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub }}>
                {totalWellnessLogs} wellness logs completed
              </Text>
              {nextLevel && (
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted }}>
                  {nextLevel.min - totalWellnessLogs} more to reach {nextLevel.name}
                </Text>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Section 2 — Premium Card */}
        {isPremium ? (
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.gold + '30', overflow: 'hidden' }}>
            <LinearGradient colors={['#2A1A0020', '#1A103510', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.gold + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="diamond" size={20} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: C.gold }}>Premium Member</Text>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub }}>Renews Mar 16, 2027</Text>
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => ({ borderRadius: 20, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.lavender + '30', opacity: pressed ? 0.85 : 1 })}
            onPress={() => setPremiumVisible(true)}
          >
            <LinearGradient colors={['#1A1035', '#2D1F5E', '#1A1035']} style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#E0D4FF' }}>Manas Premium</Text>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)', lineHeight: 20 }}>
                  Unlock every game, sound, and insight
                </Text>
              </View>
              <View style={{ backgroundColor: C.lavender, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' }}>Unlock</Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Section 3 — Wellness Profile */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SectionIcon name="heart" color={C.sage} />
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text }}>Wellness Profile</Text>
          </View>
          {user?.goals && user.goals.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {user.goals.map(g => (
                <View key={g} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: C.lavender + '15', borderWidth: 1, borderColor: C.lavender + '30' }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: C.lavender }}>{g}</Text>
                </View>
              ))}
            </View>
          )}
          {user?.experience && (
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub }}>
              Experience: {user.experience}
            </Text>
          )}
          {user?.time && (
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub }}>
              Preferred time: {user.time}
            </Text>
          )}
        </View>

        {/* Retake Wellness Quiz — card button */}
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.lavender + '25',
            flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.7 : 1,
          })}
          onPress={() => router.push('/onboarding')}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.lavender + '15', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="refresh" size={20} color={C.lavender} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.lavender }}>Retake Wellness Quiz</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, marginTop: 2 }}>
              Refresh your profile and personalise your experience
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.lavender} />
        </Pressable>

        {/* Section 4 — Account */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, gap: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <SectionIcon name="person" color={C.wisteria} />
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text }}>Account</Text>
          </View>
          <Pressable
            style={({ pressed }) => ({ flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.7 : 1 })}
            onPress={() => Alert.alert('Email', 'Email editing will be available soon.')}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.wisteria + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="mail-outline" size={16} color={C.wisteria} />
            </View>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: C.text, flex: 1, marginLeft: 12 }}>Email</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted }}>Not set</Text>
            <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.gold + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="card-outline" size={16} color={C.gold} />
            </View>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: C.text, flex: 1, marginLeft: 12 }}>Subscription</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub }}>{isPremium ? 'Premium' : 'Free'}</Text>
          </View>
          <SettingsRow icon="card" iconColor={C.wisteria} label="Manage Subscription" onPress={() => Alert.alert('Manage Subscription', 'This will open your device subscription settings.')} />
          <SettingsRow icon="refresh-circle" iconColor={C.sage} label="Restore Purchases" onPress={() => Alert.alert('Restore Purchases', 'Looking for previous purchases...', [{ text: 'OK' }])} />
          <SettingsRow
            icon="log-out-outline" iconColor="#E57373" label="Sign Out"
            onPress={handleSignOut} last textColor="#E57373"
          />
        </View>

        {/* Section 5 — Settings */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, gap: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <SectionIcon name="settings" color={C.textSub} />
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text }}>Settings</Text>
          </View>
          <SettingsRow
            icon="notifications" iconColor={C.lavender} label="Notifications"
            right={notifications ? 'On' : 'Off'}
            onPress={() => { setNotifications(n => !n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          />
          <SettingsRow
            icon="moon" iconColor="#818CF8" label="Theme"
            right={theme === 'light' ? 'Light' : 'Dark'}
            onPress={() => setThemeVisible(true)}
          />
          <SettingsRow
            icon="time" iconColor={C.sage} label="Daily Reminder"
            right={reminderTime}
            onPress={() => setReminderVisible(true)} last
          />
        </View>

        {/* Section 6 — Crisis & Mental Health Resources */}
        <View style={{
          backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1,
          borderColor: theme === 'light' ? '#E5D5C8' : '#3D2A1F', gap: 14, overflow: 'hidden',
        }}>
          <LinearGradient
            colors={theme === 'light' ? ['#FFF7ED08', 'transparent'] : ['#2A1A0015', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SectionIcon name="hand-left" color={C.gold} />
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text }}>Crisis Support</Text>
          </View>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 20 }}>
            You are not alone. Support is always available.
          </Text>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
            onPress={() => openExternal('https://www.crisistextline.org', 'Crisis Text Line')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.sage} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.text }}>Crisis Text Line</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted }}>Free and confidential, available 24/7</Text>
            </View>
            <Ionicons name="open-outline" size={14} color={C.textMuted} />
          </Pressable>
          <View style={{ height: 1, backgroundColor: C.border }} />
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
            onPress={() => openExternal('https://www.iasp.info/resources/Crisis_Centres/', 'IASP')}
          >
            <Ionicons name="globe-outline" size={18} color={C.wisteria} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.text }}>IASP Crisis Centres</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted }}>Global directory of support centres</Text>
            </View>
            <Ionicons name="open-outline" size={14} color={C.textMuted} />
          </Pressable>
          <View style={{ height: 1, backgroundColor: C.border }} />
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
            onPress={() => router.push('/breathe/sigh')}
          >
            <Ionicons name="sync-outline" size={18} color={C.lavender} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.text }}>Breathing Reset</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted }}>Quick in-app grounding exercise</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
          </Pressable>
        </View>

        {/* Section 7 — Legal & Support */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, gap: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <SectionIcon name="document-text" color={C.textSub} />
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text }}>Legal & Support</Text>
          </View>
          {LEGAL_ROWS.map((row, i) => (
            <Pressable
              key={row.slug}
              style={({ pressed }) => ({
                flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 13,
                opacity: pressed ? 0.7 : 1,
                borderBottomWidth: i < LEGAL_ROWS.length - 1 ? 1 : 0, borderBottomColor: C.border,
              })}
              onPress={() => router.push(`/legal/${row.slug}`)}
            >
              <Ionicons name={row.icon} size={16} color={C.textSub} />
              <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: C.text, flex: 1 }}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Section 8 — Delete Account */}
        <Pressable
          style={({ pressed }) => ({
            flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
            gap: 8, paddingVertical: 16, opacity: pressed ? 0.6 : 1,
          })}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={16} color={C.textMuted} />
          <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textMuted }}>Delete Account</Text>
        </Pressable>

        {/* Footer */}
        <View style={{ alignItems: 'center', gap: 8, paddingTop: 12, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={LOGO} style={{ width: 24, height: 24, borderRadius: 8, overflow: 'hidden' }} />
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: C.textSub }}>manas</Text>
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted }}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <PremiumModal visible={premiumVisible} onClose={() => setPremiumVisible(false)} C={C} />
      <EditNameModal
        visible={editNameVisible}
        currentName={user?.name ?? ''}
        onClose={() => setEditNameVisible(false)}
        onSave={(n) => updateUser({ name: n })}
        C={C}
      />
      <ReminderModal
        visible={reminderVisible}
        current={reminderTime}
        onClose={() => setReminderVisible(false)}
        onSelect={setReminderTime}
        C={C}
      />
      <ThemeModal
        visible={themeVisible}
        currentTheme={theme}
        onClose={() => setThemeVisible(false)}
        onSelect={setTheme}
        C={C}
      />
    </View>
  );
}

const ms = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheetBase: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 16, overflow: 'hidden', borderWidth: 1,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  sheetSub: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center',
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, overflow: 'hidden',
  },
  premiumBadgeText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  premiumCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16, overflow: 'hidden',
  },
});
