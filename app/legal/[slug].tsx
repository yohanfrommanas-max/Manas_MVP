import React, { useState } from 'react';
// @ts-ignore
const LOGO = require('@/assets/logo.png');
import {
  View, Text, ScrollView, Pressable, Platform, Image, TextInput, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useColors, type Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function Section({ title, C }: { title: string; C: Colors }) {
  return <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: C.lavender, marginTop: 20, marginBottom: 8 }}>{title}</Text>;
}

function Body({ children, C }: { children: string; C: Colors }) {
  return <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 22, marginBottom: 12 }}>{children}</Text>;
}

function FAQItem({ question, answer, C }: { question: string; answer: string; C: Colors }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 10 }}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.text, flex: 1 }}>{question}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
      </Pressable>
      {open && (
        <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 21, paddingBottom: 16 }}>
          {answer}
        </Text>
      )}
    </View>
  );
}

function AboutScreen({ C }: { C: Colors }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Image source={LOGO} style={{ width: 56, height: 56, borderRadius: 16, marginBottom: 20 }} />
      <Body C={C}>
        Manas is a premium mental wellness app designed to help you build a meaningful daily practice around the things that matter most — your mind, your calm, and your sense of self.
      </Body>
      <Body C={C}>
        The name Manas comes from Sanskrit, where it means mind or soul. It reflects our belief that mental wellbeing is not a destination but a living, breathing practice — one that grows with you over time.
      </Body>
      <Body C={C}>
        We built Manas because we believe that the tools for mental fitness should be as considered and beautiful as the goals they help you reach. Too many wellness apps feel clinical, cluttered, or generic. Manas is different. Every screen, every sound, every word has been designed with intention.
      </Body>
      <Section title="What Manas offers" C={C} />
      <Body C={C}>
        Manas brings together four pillars of mental wellness into one cohesive experience. Brain Training sharpens your cognitive fitness through games designed to build focus, memory, and mental agility. Calm Tools give you access to guided breathwork, sleep soundscapes, and curated music to help you find stillness whenever you need it. Journalling offers a private, reflective space to process your thoughts, track your mood, and grow your self-awareness over time.
      </Body>
      <Section title="Our philosophy" C={C} />
      <Body C={C}>
        We believe that small, consistent actions compound into meaningful change. A few minutes of breathwork. A journal entry before bed. A moment of stillness in a busy day. Manas is here to make those moments easier to find and easier to keep.
      </Body>
      <Body C={C}>
        We are committed to building a product that respects your privacy, supports your wellbeing, and earns your trust every day.
      </Body>
      <Section title="The team" C={C} />
      <Body C={C}>
        Manas is built by a small, dedicated team who are deeply passionate about mental wellness and the role that thoughtful technology can play in supporting it. We are always listening, always learning, and always working to make Manas better for you.
      </Body>
      <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, marginTop: 12, textAlign: 'center' }}>Version 1.0.0</Text>
    </View>
  );
}

function PrivacyScreen({ C }: { C: Colors }) {
  return (
    <View>
      <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, marginBottom: 16 }}>Last updated: March 2025</Text>
      <Body C={C}>Your privacy matters to us. This policy explains what information Manas collects, how we use it, and the choices you have. We have written it to be clear and honest, not to bury important things in difficult language.</Body>
      <Section title="What we collect" C={C} />
      <Body C={C}>When you create an account, we collect your name and email address. As you use the app, we collect information about your activity — including journal entries, mood logs, session completions, streaks, and preferences. We collect this information to personalise your experience and help you track your progress.</Body>
      <Body C={C}>If you choose to subscribe to Manas Premium, payment is processed securely through Apple or Google. We do not store your payment card details.</Body>
      <Body C={C}>We may also collect anonymous usage data — such as which features are used most often — to help us improve the app. This data cannot be used to identify you.</Body>
      <Section title="How we use your information" C={C} />
      <Body C={C}>We use your information to provide and improve the Manas experience, to personalise your content and recommendations, to send you reminders and notifications if you have enabled them, and to respond to your support requests.</Body>
      <Body C={C}>We do not sell your personal data to third parties. We do not use your journal entries or mood logs for advertising purposes. Your reflections are yours.</Body>
      <Section title="Data storage and security" C={C} />
      <Body C={C}>Your data is stored securely using industry-standard encryption. We retain your data for as long as your account is active. If you delete your account, your personal data is permanently removed within 30 days.</Body>
      <Section title="Your rights" C={C} />
      <Body C={C}>You have the right to access the personal data we hold about you, to correct any inaccuracies, to request deletion of your data, and to withdraw consent for data processing at any time. To exercise any of these rights, contact us through the Help & Support section of the app.</Body>
      <Section title="Children" C={C} />
      <Body C={C}>Manas is not intended for use by anyone under the age of 13. We do not knowingly collect data from children.</Body>
      <Section title="Changes to this policy" C={C} />
      <Body C={C}>We may update this policy from time to time. If we make significant changes, we will notify you within the app. Continued use of Manas after changes are posted constitutes acceptance of the updated policy.</Body>
      <Body C={C}>If you have any questions about this policy, please contact us through Help & Support.</Body>
    </View>
  );
}

function TermsScreen({ C }: { C: Colors }) {
  return (
    <View>
      <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, marginBottom: 16 }}>Last updated: March 2025</Text>
      <Body C={C}>By downloading or using Manas, you agree to these terms. Please read them carefully. If you do not agree, please do not use the app.</Body>
      <Section title="Using Manas" C={C} />
      <Body C={C}>Manas grants you a personal, non-transferable licence to use the app for your own private wellness purposes. You may not copy, modify, distribute, or reverse engineer any part of the app. You may not use Manas for any commercial purpose without our written permission.</Body>
      <Body C={C}>You are responsible for maintaining the confidentiality of your account and for all activity that occurs under your account.</Body>
      <Section title="Your content" C={C} />
      <Body C={C}>Journal entries, mood logs, and other content you create within Manas belong to you. By storing this content in the app, you grant us a limited licence to process it solely for the purpose of delivering the service to you. We will never read, share, or use your personal content for any other purpose.</Body>
      <Section title="Manas Premium" C={C} />
      <Body C={C}>Some features of Manas require a Premium subscription. Subscriptions are billed through Apple or Google on the terms you select at the time of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage or cancel your subscription at any time through your device's subscription settings.</Body>
      <Body C={C}>We do not offer refunds outside of what is required by applicable law or the policies of Apple or Google.</Body>
      <Section title="Disclaimers" C={C} />
      <Body C={C}>Manas is a wellness and self-improvement app. It is not a medical device and is not intended to diagnose, treat, cure, or prevent any medical condition. The content in Manas is for general informational and wellbeing purposes only. If you are experiencing a mental health crisis or require medical attention, please contact a qualified healthcare professional or your local emergency services.</Body>
      <Section title="Limitation of liability" C={C} />
      <Body C={C}>To the fullest extent permitted by law, Manas and its team shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app.</Body>
      <Section title="Changes to these terms" C={C} />
      <Body C={C}>We may update these terms from time to time. Continued use of Manas after changes are posted constitutes acceptance of the updated terms. We will notify you of significant changes within the app.</Body>
      <Body C={C}>For questions about these terms, please contact us through Help & Support.</Body>
    </View>
  );
}

function DataScreen({ C }: { C: Colors }) {
  const { clearAllData } = useApp();
  return (
    <View>
      <Section title="Your data belongs to you" C={C} />
      <Body C={C}>We believe you should always know what information Manas holds about you and have full control over it. This page explains what we store and gives you the tools to manage it.</Body>
      <Section title="What Manas stores" C={C} />
      <Body C={C}>Your account information — name and email address. Your wellness activity — journal entries, mood logs, session completions, streaks, and in-app preferences. Your onboarding quiz answers, which are used to personalise your experience. Anonymous usage data that helps us understand how the app is used overall and improve it over time.</Body>
      <Section title="What we never store" C={C} />
      <Body C={C}>We do not store payment card details. We do not read or share your journal entries. We do not sell your personal data to advertisers or third parties.</Body>
      <Section title="How long we keep your data" C={C} />
      <Body C={C}>Your data is retained for as long as your account remains active. If you delete your account, all personal data associated with it is permanently and irreversibly deleted within 30 days.</Body>
      <Section title="Your controls" C={C} />
      <ActionRow icon="download-outline" label="Download My Data" sub="Request a copy of your data" color={C.wisteria} C={C}
        onPress={() => Alert.alert('Download Data', 'A copy of your data will be prepared and sent to your email address within 48 hours.')} />
      <ActionRow icon="notifications-outline" label="Manage Notifications" sub="Control your communication preferences" color={C.sage} C={C}
        onPress={() => Alert.alert('Notifications', 'Notification preferences can be managed in the Settings section of your Profile.')} />
      <ActionRow icon="trash-outline" label="Delete My Account" sub="Permanently remove all data" color={C.error} C={C}
        onPress={() => {
          Alert.alert('Delete Account', 'Are you sure? This will permanently remove all your data.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete Everything', style: 'destructive', onPress: async () => {
              await clearAllData();
              router.replace('/login');
            }},
          ]);
        }} />
    </View>
  );
}

function ActionRow({ icon, label, sub, color, C, onPress }: {
  icon: IconName; label: string; sub: string; color: string; C: Colors; onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => ({ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.7 : 1 })}
      onPress={onPress}
    >
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.text }}>{label}</Text>
        <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted }}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
    </Pressable>
  );
}

function HelpScreen({ C }: { C: Colors }) {
  const faqs = [
    { cat: 'Getting Started', items: [
      { q: 'How do I personalise my Manas experience?', a: 'When you first open Manas, you are guided through a short wellness quiz that helps us understand your goals, your experience level, and your preferred time to practise. Your answers shape the content and recommendations you see throughout the app. You can retake the quiz at any time from your Profile tab.' },
      { q: 'How do I track my progress?', a: 'Your Progress tab is your personal dashboard. It shows your current streak, your mood history over time, your total wellness minutes logged, your Brain Training stats, and any achievements you have unlocked.' },
      { q: 'What is the difference between the free plan and Manas Premium?', a: 'The free plan gives you access to a curated selection of features across all four pillars. Manas Premium unlocks the full library — all Brain Training games, all Breathe techniques with voice narration, layered sleep soundscapes, Sleep Stories, offline music, binaural beats, AI journal reflections, and advanced progress insights.' },
    ]},
    { cat: 'Brain Training', items: [
      { q: 'How do the Brain Training games work?', a: 'Each game is designed to target a specific cognitive skill — memory, focus, processing speed, or logical reasoning. You can filter games by category, choose your difficulty level, and track your scores over time.' },
      { q: 'Why are some games locked?', a: 'Games marked with a crown icon are available on Manas Premium. Tapping a locked game will show you what it involves and give you the option to unlock it.' },
    ]},
    { cat: 'Breathe', items: [
      { q: 'What breathing techniques does Manas include?', a: 'Manas includes five guided breathing techniques: Box Breathing, 4-7-8, Deep Calm, Energize, and Physiological Sigh. Each technique has a different rhythm and serves a different purpose.' },
      { q: 'Can I use the breathing sessions without sound?', a: 'Yes. You can adjust or mute the ambient audio on any breathing session from within the session screen.' },
    ]},
    { cat: 'Sleep', items: [
      { q: 'How do I set a sleep timer?', a: 'On any sleep sound or story, tap the timer icon to set a duration. Options include 15, 30, 60 minutes, or until morning. The audio will fade out gently.' },
      { q: 'Can I mix sleep sounds together?', a: 'Layered soundscapes — the ability to combine multiple sounds with individual volume controls — is a Manas Premium feature.' },
    ]},
    { cat: 'Journal', items: [
      { q: 'Are my journal entries private?', a: 'Yes. Your journal entries are private and encrypted. They are never read by our team or shared with any third party.' },
      { q: 'Can I delete a journal entry?', a: 'Yes. Open the entry and tap the trash icon in the top right corner. You will be asked to confirm before the entry is permanently deleted.' },
    ]},
    { cat: 'Account & Billing', items: [
      { q: 'How do I manage my subscription?', a: 'Go to Profile, then Account, then Manage Subscription. This will take you to your device\'s subscription settings.' },
      { q: 'How do I restore a purchase?', a: 'Go to Profile, then Account, then Restore Purchases. This will restore any active Premium subscription linked to your Apple or Google account.' },
      { q: 'How do I delete my account?', a: 'Go to Profile, scroll to the bottom, and tap Delete Account. You will be asked to confirm twice before your account and all associated data are permanently removed.' },
    ]},
  ];

  return (
    <View>
      {faqs.map(section => (
        <View key={section.cat}>
          <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text, marginTop: 20, marginBottom: 8 }}>{section.cat}</Text>
          {section.items.map(item => (
            <FAQItem key={item.q} question={item.q} answer={item.a} C={C} />
          ))}
        </View>
      ))}
    </View>
  );
}

function ContactScreen({ C }: { C: Colors }) {
  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center', marginTop: 12 }}>
        We would love to hear from you.
      </Text>
      <Body C={C}>Whether you have a question, a piece of feedback, or something on your mind — we read every message and do our best to respond within 48 hours.</Body>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 16, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
        onPress={() => Linking.openURL('mailto:connect@joinmanas.com')}
      >
        <Ionicons name="mail" size={20} color={C.lavender} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text }}>Email Us</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted }}>connect@joinmanas.com</Text>
        </View>
        <Ionicons name="open-outline" size={14} color={C.textMuted} />
      </Pressable>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 16, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
        onPress={() => Linking.openURL('https://instagram.com/joinmanas')}
      >
        <Ionicons name="logo-instagram" size={20} color={C.lavender} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text }}>Follow Manas on Instagram</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted }}>@joinmanas</Text>
        </View>
        <Ionicons name="open-outline" size={14} color={C.textMuted} />
      </Pressable>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 16, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
        onPress={() => Linking.openURL('https://twitter.com/joinmanas')}
      >
        <Ionicons name="logo-twitter" size={20} color={C.lightSky} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text }}>Follow Manas on Twitter</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted }}>@joinmanas</Text>
        </View>
        <Ionicons name="open-outline" size={14} color={C.textMuted} />
      </Pressable>
      <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
        For urgent mental health support, please visit the resources in your Profile under Crisis Support.
      </Text>
    </View>
  );
}

function BugReportScreen({ C }: { C: Colors }) {
  const { user } = useApp();
  const [doing, setDoing] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 60 }}>
        <Ionicons name="checkmark-circle" size={48} color={C.sage} />
        <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.text, textAlign: 'center' }}>
          Thank you
        </Text>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22 }}>
          We have received your report and will be in touch if we need more details.
        </Text>
      </View>
    );
  }

  const inputStyle = {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    fontSize: 14, fontFamily: 'Inter_400Regular' as const, color: C.text,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  };

  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text, marginBottom: 4 }}>Something not working?</Text>
      <Body C={C}>Help us make Manas better. Describe what happened and we will look into it as soon as possible.</Body>
      <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub, marginTop: 8, marginBottom: 6 }}>What were you doing?</Text>
      <TextInput style={inputStyle} value={doing} onChangeText={setDoing} placeholder="Describe the action..." placeholderTextColor={C.textMuted} multiline numberOfLines={3} textAlignVertical="top" />
      <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub, marginBottom: 6 }}>What did you expect?</Text>
      <TextInput style={inputStyle} value={expected} onChangeText={setExpected} placeholder="Expected behaviour..." placeholderTextColor={C.textMuted} multiline numberOfLines={3} textAlignVertical="top" />
      <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub, marginBottom: 6 }}>What actually happened?</Text>
      <TextInput style={inputStyle} value={actual} onChangeText={setActual} placeholder="Actual behaviour..." placeholderTextColor={C.textMuted} multiline numberOfLines={3} textAlignVertical="top" />
      <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub, marginBottom: 6 }}>Your email</Text>
      <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={C.textMuted} keyboardType="email-address" autoCapitalize="none" />
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: C.lavender, borderRadius: 14, paddingVertical: 16, alignItems: 'center' as const,
          opacity: (doing.trim() && actual.trim()) ? (pressed ? 0.85 : 1) : 0.4, marginTop: 8,
        })}
        onPress={() => { if (doing.trim() && actual.trim()) setSubmitted(true); }}
      >
        <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' }}>Submit Report</Text>
      </Pressable>
    </View>
  );
}

function RateScreen({ C }: { C: Colors }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 40 }}>
      <Image source={LOGO} style={{ width: 64, height: 64, borderRadius: 18 }} />
      <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' }}>
        Enjoying Manas?
      </Text>
      <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 }}>
        Your review means more than you know. It helps other people find Manas and helps us keep building something worth using.
      </Text>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: C.lavender, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32,
          opacity: pressed ? 0.85 : 1,
        })}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Linking.openURL('https://apps.apple.com/app/manas/id0000000000');
          } else {
            Linking.openURL('https://play.google.com/store/apps/details?id=com.manas.app');
          }
        }}
      >
        <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' }}>Leave a Review</Text>
      </Pressable>
      <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center' }}>
        Thank you for being part of the Manas community.
      </Text>
    </View>
  );
}

const TITLES: Record<string, string> = {
  about: 'About Manas',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  data: 'Data & Privacy',
  help: 'Help & Support',
  contact: 'Contact Us',
  bug: 'Report a Bug',
  rate: 'Rate Manas',
};

export default function LegalScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const C = useColors();
  const insets = useSafeAreaInsets();
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const title = TITLES[slug] || slug;

  const renderContent = () => {
    switch (slug) {
      case 'about': return <AboutScreen C={C} />;
      case 'privacy': return <PrivacyScreen C={C} />;
      case 'terms': return <TermsScreen C={C} />;
      case 'data': return <DataScreen C={C} />;
      case 'help': return <HelpScreen C={C} />;
      case 'contact': return <ContactScreen C={C} />;
      case 'bug': return <BugReportScreen C={C} />;
      case 'rate': return <RateScreen C={C} />;
      default: return <Text style={{ color: C.text }}>Page not found</Text>;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen options={{ title }} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: botInset + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}
