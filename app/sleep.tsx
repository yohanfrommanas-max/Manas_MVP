import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Modal, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useApp } from '@/context/AppContext';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { useColors, type Colors } from '@/constants/colors';

// ─── Sleep-screen colour palette (dark, always) ───────────────────────────────
const IRIS = '#7b6ef6';
const IRIS2 = '#9d93f8';
const SAGE = '#3ec9a7';
const DUSTY = '#b8a9f0';
const SBG = '#07080f';
const W1 = '#f0ecff';
const W2 = '#8b88a8';
const W3 = '#3d3a58';
const RIM = 'rgba(255,255,255,0.055)';
const RIM2 = 'rgba(255,255,255,0.10)';

type Tab = 'Sleepcasts' | 'Visuals' | 'Stretches';
type SleepView = 'home' | 'detail' | 'player';
type SleepMode = 'read' | 'focus' | 'listen';
type SleepSpeed = 1 | 1.2 | 1.5 | 2;

type SleepItem = {
  id: string;
  type: 'cast' | 'visual' | 'stretch';
  title: string;
  sub: string;
  grad: readonly [string, string, string];
  narrator: string;
  duration: string;
  durationSecs: number;
  category: string;
  text: string;
  stretchId?: string;
  difficulty?: string;
  steps?: number;
};

// ─── Original STRETCHES data (preserved verbatim) ─────────────────────────────
const STRETCHES = [
  {
    id: 'str-winddown',
    title: '5-Min Wind Down',
    desc: 'Signal your body it is time to rest',
    duration: '5 min',
    difficulty: 'Easy' as const,
    steps: 6,
    icon: 'body',
    color: '#A78BFA',
    poses: [
      { pose: 'Neck Rolls', cue: 'Sit comfortably. Let your chin drop to your chest, then slowly roll your head to the right. Breathe out as you roll, breathe in as you return to centre. Move with complete gentleness — no forcing.', hold: '30 sec each side' },
      { pose: 'Shoulder Rolls', cue: 'Roll both shoulders backward in slow, full circles. Then forward. Let your arms be completely loose. Feel the tension in the upper trapezius begin to soften with each rotation.', hold: '30 sec' },
      { pose: 'Knees to Chest', cue: 'Lie on your back. Bend both knees and draw them in toward your chest. Wrap your arms around your shins. Rock very gently from side to side. This massages the lower back and releases the hip flexors.', hold: '60 sec' },
      { pose: 'Supine Twist (Right)', cue: 'From knees-to-chest, drop both knees to the right. Extend your arms wide, palms up. Turn your head to the left. Breathe into your belly. With each exhale, let the left shoulder soften toward the floor.', hold: '60 sec' },
      { pose: 'Supine Twist (Left)', cue: 'Draw your knees back to centre, then drop them to the left. Turn your head to the right. Settle the right shoulder toward the floor. Breathe. Let everything soften.', hold: '60 sec' },
      { pose: 'Savasana', cue: 'Bring your legs flat, arms slightly away from your sides, palms facing up. Close your eyes. Take one long, full breath and release it completely. Let your body be entirely heavy. There is nothing left to do.', hold: '90 sec' },
    ],
  },
  {
    id: 'str-neck',
    title: 'Neck & Shoulder Release',
    desc: 'Dissolve the tension carried in your upper body from the day',
    duration: '8 min',
    difficulty: 'Easy' as const,
    steps: 8,
    icon: 'man',
    color: '#D6AEFF',
    poses: [
      { pose: 'Neck Roll (Left)', cue: 'Sit upright with your eyes closed. Let your left ear drop toward your left shoulder. Do not lift the right shoulder to meet it — let the right side stretch. Breathe slowly. Hold the stretch without pushing.', hold: '45 sec' },
      { pose: 'Neck Roll (Right)', cue: 'Slowly bring your head to centre, then let the right ear drop toward the right shoulder. Keep your face relaxed. Your lips can part slightly. Breathe into the left side of your neck.', hold: '45 sec' },
      { pose: 'Shoulder Rolls', cue: 'Roll both shoulders in large, slow backward circles. Then forward. Then alternate — one shoulder at a time, like a slow shrug. Notice where you feel resistance and breathe into it.', hold: '60 sec' },
      { pose: 'Thread the Needle (Left)', cue: 'Come to hands and knees. Slide your right arm underneath your left arm along the floor, palm up. Let your right shoulder and right ear rest on the mat. Your left arm can stay extended or bend. Breathe into the back of the right shoulder.', hold: '60 sec' },
      { pose: 'Thread the Needle (Right)', cue: 'Come back to hands and knees. Now slide your left arm underneath your right arm, palm up. Left shoulder and left ear rest on the mat. This releases the left side of the upper back and the rhomboids.', hold: '60 sec' },
      { pose: "Child's Pose", cue: "From hands and knees, sink your hips back toward your heels. Extend your arms forward, forehead to the mat. Allow your whole back to soften and widen. Your shoulders should be passive — not holding, just resting. Breathe slowly and fully.", hold: '90 sec' },
      { pose: 'Seated Forward Fold', cue: 'Sit with your legs extended. Inhale to lengthen your spine, then exhale and fold forward from the hips — not from the waist. Let your hands rest wherever they comfortably reach. Relax your neck completely, letting your head hang.', hold: '60 sec' },
      { pose: 'Savasana', cue: 'Lie flat on your back. Arms resting naturally at your sides, palms open. Let the floor hold the full weight of your body — legs, hips, back, shoulders, head. Take three deep breaths and then let your breathing return to its natural rhythm. Rest.', hold: '90 sec' },
    ],
  },
  {
    id: 'str-fullbody',
    title: 'Full Body Unwind',
    desc: 'A head-to-toe sequence to prepare every muscle for rest',
    duration: '15 min',
    difficulty: 'Moderate' as const,
    steps: 12,
    icon: 'fitness',
    color: '#6EE7B7',
    poses: [
      { pose: 'Cat-Cow', cue: 'Come to hands and knees with wrists under shoulders and knees under hips. Inhale and let your belly drop toward the floor, lifting your tailbone and head (Cow). Exhale and round your entire spine toward the ceiling, tucking chin and tailbone (Cat). Move with your breath. This is your spine waking up gently.', hold: '60 sec' },
      { pose: "Child's Pose", cue: 'From Cat-Cow, sink your hips back to your heels and walk your hands forward. Forehead to the mat. Arms extended or resting at your sides. Breathe deeply into your back body, feeling your ribcage expand outward with each inhale.', hold: '90 sec' },
      { pose: 'Thread the Needle (Left)', cue: 'Return to hands and knees. Slide your right arm under your left, palm up, right shoulder and ear to the mat. Left arm extended, breathing into the thoracic spine and back of the shoulder.', hold: '60 sec' },
      { pose: 'Thread the Needle (Right)', cue: 'Come to centre, then slide the left arm under the right. Left shoulder and ear to the mat. Breathe. The upper back releases layer by layer.', hold: '60 sec' },
      { pose: 'Seated Forward Fold', cue: 'Sit with legs extended. Inhale to lengthen, exhale to fold forward from the hips. Hands wherever they reach without strain. Head heavy, neck long. Each exhale, allow the fold to deepen slightly of its own accord.', hold: '60 sec' },
      { pose: 'Happy Baby', cue: 'Lie on your back. Bend both knees and draw them toward your armpits. Reach for the outer edges of your feet. Flex your feet, pressing them into your hands. Rock gently left and right. This opens the hips and sacrum.', hold: '60 sec' },
      { pose: 'Knees to Chest', cue: 'Draw both knees in toward your chest. Arms wrapped around shins. Rock gently from side to side, massaging the lumbar spine against the mat. Let your forehead relax and your jaw go soft.', hold: '45 sec' },
      { pose: 'Reclined Figure-4 (Left)', cue: 'Bend your right knee, foot flat on the floor. Cross your left ankle over your right knee. If this is enough sensation, stay here. Otherwise, thread your hands behind your right thigh and draw it toward you. Keep your left foot flexed to protect the knee.', hold: '60 sec' },
      { pose: 'Reclined Figure-4 (Right)', cue: 'Uncross and reset. Bend your left knee, foot flat. Cross your right ankle over your left knee. Draw the left thigh toward you if needed. Breathe into the right outer hip — the piriformis and the gluteus medius, where so much desk-tension accumulates.', hold: '60 sec' },
      { pose: 'Supine Twist (Left)', cue: 'Bring both knees to your chest and drop them to the right. Arms wide, left shoulder softening toward the floor. Turn your head left. Breathe into the front of the left hip and the left side of the chest.', hold: '60 sec' },
      { pose: 'Supine Twist (Right)', cue: 'Draw knees to centre and drop them left. Right shoulder softens toward the floor. Head turns right. Take five long, slow breaths here. With each exhale, notice your body growing heavier.', hold: '60 sec' },
      { pose: 'Savasana', cue: 'Extend both legs long. Arms fall to the sides, palms up. Close your eyes. Feel the whole length of your body in contact with the floor. You have moved through every major area of tension. Now there is nothing left to do. Simply rest. Let the floor hold everything.', hold: '120 sec' },
    ],
  },
  {
    id: 'str-hip',
    title: 'Hip & Lower Back',
    desc: 'Open the areas most affected by sitting and stress',
    duration: '10 min',
    difficulty: 'Moderate' as const,
    steps: 9,
    icon: 'body-outline',
    color: '#818CF8',
    poses: [
      { pose: 'Cat-Cow', cue: 'On hands and knees, move through five slow rounds of Cat and Cow, breathing fully with each movement. Pay particular attention to the lumbar curve — in Cow, let it gently arch; in Cat, let it fully round. Your lower back sets the pace.', hold: '60 sec' },
      { pose: "Child's Pose", cue: "Sit your hips back toward your heels. If there is space between your hips and heels, place a pillow or folded blanket there. Let your torso relax completely. Breathe into the back of the pelvis. With each inhale, your sacrum lifts slightly; with each exhale, the hips soften downward.", hold: '90 sec' },
      { pose: 'Reclined Figure-4 (Left)', cue: 'Lie on your back. Right knee bent, foot flat. Cross your left ankle above your right knee. Thread your hands behind your right thigh. This targets the left piriformis — a muscle that, when tight, contributes enormously to lower back pain.', hold: '75 sec' },
      { pose: 'Reclined Figure-4 (Right)', cue: 'Switch sides. Left foot flat, right ankle crossed above the left knee. Draw the left thigh in. Breathe. You may notice one side is significantly tighter — this is very common. Simply breathe and wait.', hold: '75 sec' },
      { pose: 'Happy Baby', cue: 'Draw both knees toward your armpits. Hold the outer edges of your feet. Press your feet into your hands and let your inner thighs stretch gently. Rock from side to side if that feels good. The lower back presses and broadens against the floor.', hold: '60 sec' },
      { pose: 'Knees to Chest', cue: 'Wrap both arms around your shins and draw your knees close to your chest. This is a counter-pose and a completion — a simple, total hug for the lower back. Hold here and breathe slowly, feeling the lumbar vertebrae decompress.', hold: '60 sec' },
      { pose: 'Supine Twist (Right)', cue: 'From knees-to-chest, drop both knees to the right. Right arm extended along the floor. Turn your head to the left. Left arm rests wherever comfortable. Feel the rotation through the entire spine, not just the lower back.', hold: '75 sec' },
      { pose: 'Supine Twist (Left)', cue: 'Draw knees to centre, then drop them to the left. Head turns right. Let the right shoulder be heavy. Take your time here — spinal twists work slowly, and the longer you remain, the more the tissue releases.', hold: '75 sec' },
      { pose: 'Savasana', cue: 'Legs long, arms at your sides, palms up. Eyes closed. Your hips are open. Your lower back is long and soft. There is a spaciousness in the pelvis that was not there when you began. Let your body absorb and integrate everything. Breathe slowly. Rest completely.', hold: '90 sec' },
    ],
  },
  {
    id: 'str-spine',
    title: 'Gentle Spine Stretch',
    desc: 'Slow, careful movements to decompress and lengthen the spine',
    duration: '7 min',
    difficulty: 'Easy' as const,
    steps: 7,
    icon: 'accessibility',
    color: '#F9A8D4',
    poses: [
      { pose: 'Cat-Cow', cue: 'Begin on hands and knees. Take five full rounds, moving very slowly. Linger in each position — do not rush from Cow to Cat. In Cow, let the spine hang down gently. In Cat, press the floor away and draw the navel up. This is your spine remembering its range of motion.', hold: '60 sec' },
      { pose: "Child's Pose", cue: 'Sit back and extend forward. Let your whole body soften. If your forehead does not reach the mat, rest it on a pillow. Your arms can extend in front of you for a lat stretch, or rest alongside your body for a more passive hold. Breathe slowly into the back of the ribcage.', hold: '90 sec' },
      { pose: 'Seated Forward Fold', cue: 'Come to sitting with your legs extended. Flex your feet. On an inhale, sit tall. On the exhale, hinge from the hips and fold forward. Let the spine be long rather than rounded. Let your hands rest on your shins or ankles. Breathe and soften the backs of the legs.', hold: '60 sec' },
      { pose: 'Supine Twist (Left)', cue: 'Lie on your back. Draw your knees to your chest, then let them fall to the right. Open your arms. Let the left shoulder rest toward the floor. Feel the rotation through the thoracic and lumbar spine — long, spacious, unhurried.', hold: '75 sec' },
      { pose: 'Supine Twist (Right)', cue: 'Draw knees to centre and lower them to the left. Right shoulder eases toward the floor. Head can turn right. Take six slow breaths here, feeling the right side of the back body lengthen with each exhale.', hold: '75 sec' },
      { pose: 'Legs Up the Wall', cue: 'Scoot your hips close to the wall (or the headboard of your bed) and swing your legs up so they rest vertically. Arms at your sides. This reverses the compression of standing and sitting — the lower back softens and the legs are gently drained of tension. Very easy. Very restoring.', hold: '120 sec' },
      { pose: 'Savasana', cue: 'Lower your legs gently and lie flat. Arms just away from the body, palms open. Your spine has been stretched, rotated, and released. It is now long and quiet. The discs between your vertebrae are slightly less compressed than when you started. Take three long breaths and let your body be completely still.', hold: '90 sec' },
    ],
  },
];

// ─── Sleep content data ────────────────────────────────────────────────────────
const SLEEP_ITEMS: SleepItem[] = [
  // ── Sleepcasts ──────────────────────────────────────────────────────────────
  {
    id: 'sc-library',
    type: 'cast',
    title: 'The Old Library',
    sub: 'A quiet evening among towering shelves and the scent of old books.',
    grad: ['#0e0c24', '#1e1660', '#2c1e80'],
    narrator: 'James',
    duration: '45 min',
    durationSecs: 2700,
    category: 'Sleepcast',
    text: `The door opens with a soft creak, and a breath of warm, paper-scented air rolls over you. Outside, rain falls in long quiet curtains against the tall windows. Inside, everything is amber. The library is vast — four floors of shelves rising into shadows, connected by wrought-iron staircases that spiral upward and disappear.

You step onto the dark wooden floor. Your footsteps are swallowed by the hush of the room. Somewhere above, a clock ticks with slow authority. The fire in the far corner crackles gently, sending long orange fingers of light dancing across the spines of a thousand books.

You run your hand along the nearest shelf. The books are old — cloth covers in deep burgundy and forest green, their titles pressed in faded gold. You pull one free and open it. The pages are cream-coloured and smell faintly of vanilla and cedar. You don't read the words. You only look at them, and let the shapes of the letters blur pleasantly.

You find a chair by the fire. It is deep and upholstered in worn leather the colour of dark honey. You sink into it, and it holds you completely. A small table beside you holds a cup of tea, still steaming. You wrap both hands around it.

The rain grows heavier against the glass. You can hear it tapping in layered rhythms, dozens of small percussions all at once, forming a sound like static, like white noise, like the sound of everything outside the world slowing to a stop.

The fire settles. A log shifts with a quiet thud and a spray of sparks. The clock above you counts the seconds in long, even pulses. The room breathes around you — warm and full and completely still.

Your eyes grow heavy. The book in your lap is a comfortable weight. The tea cools slowly in your hands. You do not need to go anywhere. There is nowhere to go. There is only the library, and the rain, and the fire, and the slow, amber drift toward sleep.

The shelves rise around you like a forest of paper and ink. You are safe inside them. You close your eyes and let the library hold you. The clock ticks. The rain falls. Everything is very quiet, and very still, and you are exactly where you need to be.`,
  },
  {
    id: 'sc-train',
    type: 'cast',
    title: 'Night Train to Nowhere',
    sub: 'Drift off to the gentle rumble of a sleeper train crossing dark countryside.',
    grad: ['#08121e', '#10243c', '#163050'],
    narrator: 'Sarah',
    duration: '38 min',
    durationSecs: 2280,
    category: 'Sleepcast',
    text: `You are lying in the narrow bunk of a sleeper carriage. The sheets are crisp and cool where your feet slide between them, and soft and warm where your body has pressed them down. A small lamp above the window gives off the gentlest glow — just enough light to see the dark countryside rolling past in the window opposite.

The train moves steadily. You can feel it in your whole body — a low, constant vibration that travels up through the mattress and settles somewhere behind your ribs. The carriage sways slightly from side to side, a slow rocking like a cradle. The rhythm of the wheels on the track comes in long, even beats. Da-dum. Da-dum. Da-dum.

Outside, the world is dark. Occasionally a farmhouse slides past — a warm yellow square against the black — and then it is gone. Trees appear and disappear. A river catches the moon for a moment and throws it back in silver fragments. Then darkness again, and the steady beat of the rails.

The carriage is quiet. Somewhere further back, someone is sleeping. You can hear nothing but the train and the very faint sound of the wind parting around the roof above you. The curtain at your window shifts slightly in some invisible current of air.

You pull the blanket up. It is heavy and familiar. Your pillow holds the exact shape of your head. Your body is completely supported — the bunk holds you from beneath and the darkness holds you from above, and the motion of the train rocks you with infinite patience.

You are going somewhere. You do not know where. It does not matter. The train knows. The train has been making this journey for years, through the same fields and the same forests and the same small darkened stations where no one waits on the platform at this hour.

Da-dum. Da-dum. Da-dum. The wheel-beats grow slower in your mind, or perhaps the gaps between them grow longer. You are not sure. Your breathing has matched the rhythm without you asking it to. In for two beats, out for two beats. In. Out. Da-dum. Da-dum.

The lamp above the window is very warm. The countryside outside is very dark. The train rocks you gently, endlessly, through the long quiet night, and you sink — slowly, gratefully, completely — into sleep.`,
  },
  {
    id: 'sc-provence',
    type: 'cast',
    title: 'Lavender Fields',
    sub: 'A slow walk through Provence as the evening light fades warm and golden.',
    grad: ['#1a0e10', '#3a1c28', '#4e2438'],
    narrator: 'James',
    duration: '42 min',
    durationSecs: 2520,
    category: 'Sleepcast',
    text: `The path begins at the edge of the village, past a low stone wall covered in climbing roses. The evening is warm — not hot, just the remnant warmth of a generous summer day — and the light has turned the colour of old gold. Long shadows fall from the cypress trees that line the road.

You walk slowly. There is no reason to hurry. The lavender fields begin at the next bend, and you know they will be there when you arrive, as they always are at this hour. You breathe in as you walk. The air has that particular quality it gets in Provence at evening — dry and herb-scented, with something floral underneath, like a promise.

Then you turn the corner and the fields open before you: row upon row of lavender, stretching to the foot of the limestone hills. The colour is extraordinary — deep violet at the tips, fading to silver-blue at the base — and the light catches it all sideways so that every row shimmers. A soft wind moves through the field and the whole landscape ripples like water.

The scent reaches you a moment later. It is clean and sweet and slightly medicinal, with something woody underneath. You breathe it in completely and hold it for a moment. The scent of lavender, you have read, slows the nervous system. You believe it. You feel something in your chest unknot.

You walk the path between two rows. The lavender brushes your hands as you pass. Bees move through the flowers with slow deliberation — they are full and unhurried at this hour, their work nearly done. The buzzing they make is low and continuous, more like a hum than a sound, more like a feeling than a hum.

At the far end of the path there is a stone bench beside an old olive tree. You sit on it. The wood is still warm from the afternoon sun. You face west, where the sky is burning in long stripes of rose and amber over the hills. The hills are very still. The village bell, far behind you, strikes once and lets the note dissolve into the air.

You remain here as the light fades. The sky moves through orange into rose into a deep soft blue. The first star appears above the eastern hills — a single white point, absolutely steady. The lavender darkens from violet to purple to a soft grey-blue. The bees are gone. The field is very quiet.

You are not sleepy in the way of exhaustion. You are sleepy in the way of total contentment — the feeling at the end of a perfect day when the body knows that what comes next is rest, well-earned and very near. You take one more slow breath of lavender and close your eyes.`,
  },
  {
    id: 'sc-lighthouse',
    type: 'cast',
    title: 'The Old Lighthouse',
    sub: 'Follow a shepherd home as the first stars appear above a highland valley.',
    grad: ['#081422', '#0e2438', '#103050'],
    narrator: 'Sarah',
    duration: '50 min',
    durationSecs: 3000,
    category: 'Sleepcast',
    text: `The valley lies below you in a long twilight haze, the river a thin silver thread winding between dark hills. You have been walking since the afternoon, and now the path descends between heather and bracken toward the far end of the valley where a stone cottage sits with one lit window.

The air up here has weight to it — cool and clean and smelling of wet rock and wild thyme. The sheep move slowly ahead of you on the path, their wool catching the last grey light. They know the way. They have walked it every evening since spring, and they do not hurry.

The shepherd walks beside you without speaking. He is not unfriendly — he simply has nothing to add to this particular hour. He has walked this path a thousand times and knows that the evening requires nothing of you except your presence. A collie moves around the edges of the flock, head low, perfectly calm. Occasionally it glances at the shepherd for instruction. He gives none. Everything is in order.

As you descend, the stars begin to appear. First one — you always see the first one clearly, a single point above the eastern ridge. Then two. Then, gradually, the sky fills with them, the Milky Way emerging as a soft luminous band from north to south. Down in the valley, the first mist is gathering in the low ground, white and still.

The bell at the ewe's neck strikes softly with each step. The sound carries in the cool air. You find yourself walking in time with it — your feet finding the rhythm, your breathing settling into it. The path levels out and the cottage grows closer.

The shepherd opens the gate. The sheep file through one by one, pulling at the grass as they go, settling. The collie circles once and lies down at the gate. Its job is done. The shepherd pulls the gate closed and latches it.

He nods to you. You follow him to the cottage. Inside, it is warm — a fire, a wooden table, a lamp. He puts a pot on without a word. You sit beside the fire. The window shows nothing but the dark hillside and the stars above it, a dense scatter of white points, brilliant and absolutely still.

The pot begins to simmer. The fire crackles and settles. Outside, the sheep are quiet. The collie is somewhere in the dark, curled in the grass. The valley below holds its mist. The stars hold their positions. And you sit in the warmth of the cottage and let the evening close around you like a hand, and everything in you grows still.`,
  },
  {
    id: 'sc-cabin',
    type: 'cast',
    title: 'Mountain Cabin',
    sub: "A summer garden at dusk — bees returning home, jasmine in the warm air.",
    grad: ['#100c20', '#1c163a', '#261e50'],
    narrator: 'James',
    duration: '35 min',
    durationSecs: 2100,
    category: 'Sleepcast',
    text: `The garden is at the end of its day, and it knows it. The sunflowers have turned their faces west where the light is going. The bees — dozens of them — are making their final runs through the lavender and the clover, their leg-baskets heavy with pollen, their movement slower and more deliberate now than it was at noon.

You are sitting in a hammock strung between two apple trees at the far end of the garden. It was warm here all afternoon, and now it is that particular temperature that asks nothing of you — not too warm, not cool enough to need a blanket, just exactly right. The hammock moves very slightly when you breathe.

The beekeeper is tending the hives at the garden's edge. She moves slowly and without urgency, her white suit luminous in the fading light. The bees circle her calmly. There is smoke from the smoker, a blue-grey thread drifting sideways and disappearing into the apple branches above you. It smells like cedar and something sweeter underneath.

The jasmine is beginning to open. It opens in the evenings, you remember — the white star-shaped flowers that stay closed all day and unfurl at dusk to release their scent into the cooling air. You smell it now, coming in soft waves when the air moves. It is the cleanest, sweetest smell in the world. You breathe it in slowly.

The last bees are returning to the hives. You can hear them — a low, diminishing sound as the garden empties of its visitors one by one. The sound of the hives changes as each forager lands and enters; it rises briefly with each arrival, then settles again, as if the hive is sighing. Each bee carries the whole afternoon with her — the flowers, the heat, the distances travelled. She goes inside and everything she carried becomes part of the collective warmth of the colony.

The light is leaving now in long horizontal streaks — rose and gold above the garden wall. A single swift cuts across the sky, impossibly fast, and is gone. The jasmine scent deepens as the air cools further. The hammock holds you. The apple tree is solid above you, its leaves going dark against the dimming sky.

The garden is very quiet now. A blackbird somewhere behind the wall gives its evening song — clear, unhurried, impossibly beautiful — and then stops. The hives make their low, steady sound. The jasmine breathes. The hammock barely moves. Your eyes grow heavy in the beautiful, warm, jasmine-scented dark.`,
  },

  // ── Visuals ─────────────────────────────────────────────────────────────────
  {
    id: 'vis-forest',
    type: 'visual',
    title: 'Forest Clearing',
    sub: 'A moonlit glade where silence holds you gently.',
    grad: ['#071410', '#0d2818', '#133820'],
    narrator: 'James',
    duration: '12 min',
    durationSecs: 720,
    category: 'Visualization',
    text: `Close your eyes and take three slow, deep breaths. With each exhale, let your body grow a little heavier, a little more still.

You are at the edge of a forest. It is night, but the moon is full and high, and its light comes through the canopy above in long silver shafts. The air smells of soil and moss and something faintly sweet — wild garlic, perhaps, or the night-opening flowers that grow along the path.

You walk forward slowly. The ground beneath your bare feet is soft — cool and slightly damp, covered in a thick layer of moss that gives gently with each step. The forest is quiet in the way that forests are at night — not silent, but full of small sounds that somehow add to the stillness rather than breaking it. An owl calls, once, from somewhere above you. Leaves shift in the high branches.

You step out of the trees into a clearing. The moon falls here without interruption, flooding the grass with pale silver light. The clearing is round and intimate, enclosed on all sides by tall trees that stand like quiet sentinels. At the centre is a flat rock, large and warm, still holding the day's heat.

You walk to the rock and lie down on it. It is perfectly sized for you. The stone is warm against your back, your legs, your arms. Above you, the full moon hangs in a deep blue-black sky. Stars are visible at the edges where the moonlight allows them — soft scattered points of light.

Your body sinks into the warmth of the rock. Feel the weight of your legs. The weight of your arms. Your shoulders soften and widen. Your jaw unclenches. Your hands open, palms upward, and rest at your sides.

The clearing is perfectly still. The moon moves imperceptibly across the sky. The trees breathe around you. The stone holds you with solid, unhurried warmth. There is nothing you need to do. There is nowhere you need to be. The clearing exists outside of time, and you exist within it, and the only thing happening is the slow, sweet dissolution of everything that held you tense today.

Breathe in. The night air is clean and cool. Breathe out. The tension leaves with it. Breathe in. The moonlight is silver and still. Breathe out. You are resting, completely. The clearing holds you. The night holds you. You are safe here, and you are very, very still.`,
  },
  {
    id: 'vis-water',
    type: 'visual',
    title: 'Floating on Still Water',
    sub: 'Drift on a calm, warm lake as every thought dissolves.',
    grad: ['#080e1e', '#0e1c38', '#142444'],
    narrator: 'Sarah',
    duration: '10 min',
    durationSecs: 600,
    category: 'Visualization',
    text: `Close your eyes. Take a long, slow breath in through your nose. Hold it for just a moment. Now let it go, completely.

You are floating on a lake. The water is warm — precisely the temperature of the air, so that the boundary between them disappears. You cannot feel where you end and the water begins. You are simply suspended, weightless, held.

The lake is completely calm. There is no current, no wind, no movement at all except the very slow rise and fall of your chest as you breathe. The water accepts your weight without effort. It does not ask you to swim. It does not require anything of you. It simply holds you, as it has always held everything that rests upon it.

Above you, the sky is the deep, absolute blue of a midsummer evening. The sun has not yet set but has softened into a warm amber light that falls across the water at a low angle, turning everything gold. You can feel it on your face — gentle, not hot, the last warmth of the day.

Your arms float at your sides, palms upward, fingers trailing in the water. Your legs extend naturally, buoyed without effort. Your hair spreads around your head like a halo in the still, warm water. Every part of you is supported.

A dragonfly lands momentarily on the tip of your finger and then is gone.

Let your thoughts float like leaves on the surface of the water. Do not chase them. Do not push them away. Simply notice them — there is one, and there is another — and watch as the current you cannot feel carries them gently away, one by one, until the surface is clear.

Breathe in. The sky above you is vast and entirely still. Breathe out. Your body sinks a fraction of an inch deeper into the water's embrace. Breathe in. The warmth of the evening settles over you like a hand. Breathe out.

You are lighter than you have been all day. You are carried completely. There is nothing to hold onto, and nothing to let go of. There is only the water beneath you, the sky above, and the slow, golden drift toward sleep.`,
  },
  {
    id: 'vis-mountain',
    type: 'visual',
    title: 'Mountain Summit at Dawn',
    sub: 'Breathe cool air above a valley slowly waking below.',
    grad: ['#100c1e', '#1c1438', '#281c50'],
    narrator: 'James',
    duration: '15 min',
    durationSecs: 900,
    category: 'Visualization',
    text: `Take a slow, full breath. As you inhale, imagine the air growing cooler, cleaner, thinner. You are very high up.

You are sitting on a flat grey rock at the summit of a mountain, just before dawn. The sky above you is deep indigo at the apex, softening toward the east where a pale line of gold is just beginning to form along the horizon. The stars are still visible overhead — fading, but there.

The air at this altitude is extraordinary. It tastes of nothing. It is perfectly clean, cool but not cold, and each breath feels like the first breath you have ever taken — clear and complete and deeply nourishing. Breathe it in slowly. Fill your lungs from the bottom to the top. Hold for a moment. Release.

Below you, the valley is still in darkness. You can see it — a long trough between two mountain ridges, its floor invisible beneath a layer of white mist. A river threads through it somewhere, catching no light yet. Small farms dot the lower slopes, their windows dark. Everything below is still and sleeping.

But here, on the summit, the light is already changing. The gold along the eastern horizon has deepened to amber, and above it the sky has shifted from indigo to a soft, clear blue. You can see the curvature of the world from here — the gentle arc of the ridgeline, the way the sky wraps around it.

The rock beneath you is cold but solid. Place your hands flat on it. Feel its texture — rough, ancient, utterly certain of itself. This rock has been here for ten thousand years. It will be here for ten thousand more. You are resting on something that does not move, does not change, does not worry. Something enormous and absolutely still.

Now the sun breaks the eastern ridge. The light comes sideways across the mountain tops, turning the snow caps above you into something burning, something almost too bright to look at. The valley below begins to emerge from its mist — a patchwork of green and dark soil, fields and trees, the silver line of the river.

You breathe in the cold, clean, luminous air of the summit. Everything is visible from here. Everything is quiet. Your body is still, your breath is slow, and the world lays itself out before you in all its ordinary splendour. There is nowhere higher to go. You have arrived. You rest.`,
  },
  {
    id: 'vis-desert',
    type: 'visual',
    title: 'Desert Night Sky',
    sub: 'Lie on warm sand beneath an infinite dome of stars.',
    grad: ['#060810', '#0a0e1e', '#0e1230'],
    narrator: 'Sarah',
    duration: '12 min',
    durationSecs: 720,
    category: 'Visualization',
    text: `Close your eyes and breathe out slowly. With each breath out, let your body become heavier, more settled, more still.

You are lying on warm desert sand. The sun set an hour ago but the sand still holds its heat, and it presses up against your back and legs in a warm, even embrace. Your body has formed a perfect impression in the fine grains. You are completely supported, completely still.

Above you is the most extraordinary sky you have ever seen.

There are no cities here, no lights at all — only the desert and the dark and the stars. They are beyond counting. The Milky Way stretches from one horizon to the other in a broad band of soft light — not the faint smear you see from a city, but a luminous river, white at the centre and deepening through blue to black at the edges. Individual stars pulse within it. Clusters gleam. And beyond the Milky Way, filling every remaining patch of sky, are more stars still — red giants, blue dwarfs, double stars that seem to breathe.

The desert around you is absolutely silent. There is no wind. No insects. No water. Only the soft sound of your own breathing, steady and slow, and the vast silence that surrounds it and holds it and makes it sound, somehow, like music.

Feel the warmth of the sand beneath you. It is the stored warmth of the day — the sun's energy held in ten million grains of silicon, released slowly into the cooling night, into you. You are being gently warmed by the sun, even now, hours after it set.

Look at the stars. There is no need to identify them or find patterns. Simply look. They are very far away and very old and they are nevertheless here, shining, for no reason other than that they are what they are. You are here for no reason other than that you are what you are. And in this place, at this hour, that is completely sufficient.

Breathe in the cool night air. Breathe out. A shooting star arcs across the upper sky and dissolves. The Milky Way turns imperceptibly above you. The sand holds you, warm and patient, in its perfect quiet, and you rest beneath the whole weight of the universe, which is, somehow, not heavy at all — only vast, and still, and full of light.`,
  },

  // ── Stretches ───────────────────────────────────────────────────────────────
  {
    id: 'str-winddown',
    type: 'stretch',
    title: '5-Min Wind Down',
    sub: 'Signal your body it is time to rest.',
    grad: ['#071a14', '#0d3024', '#114030'],
    narrator: '',
    duration: '5 min',
    durationSecs: 300,
    category: 'Stretch',
    text: 'A gentle sequence to signal the nervous system that rest is near.',
    stretchId: 'str-winddown',
    difficulty: 'Easy',
    steps: 6,
  },
  {
    id: 'str-neck',
    type: 'stretch',
    title: 'Neck & Shoulder Release',
    sub: 'Dissolve the tension carried in your upper body from the day.',
    grad: ['#100c28', '#1c1648', '#261e62'],
    narrator: '',
    duration: '8 min',
    durationSecs: 480,
    category: 'Stretch',
    text: 'Release upper-body tension built up through the day.',
    stretchId: 'str-neck',
    difficulty: 'Easy',
    steps: 8,
  },
  {
    id: 'str-fullbody',
    type: 'stretch',
    title: 'Full Body Unwind',
    sub: 'A head-to-toe sequence to prepare every muscle for rest.',
    grad: ['#1a0e08', '#301c10', '#402414'],
    narrator: '',
    duration: '15 min',
    durationSecs: 900,
    category: 'Stretch',
    text: 'A complete twelve-pose flow from Cat-Cow to Savasana.',
    stretchId: 'str-fullbody',
    difficulty: 'Moderate',
    steps: 12,
  },
  {
    id: 'str-spine-open',
    type: 'stretch',
    title: 'Spine & Hip Open',
    sub: 'Open the areas most affected by sitting and stress.',
    grad: ['#081420', '#102234', '#163044'],
    narrator: '',
    duration: '10 min',
    durationSecs: 600,
    category: 'Stretch',
    text: 'Seven targeted poses for the spine and hips.',
    stretchId: 'str-spine',
    difficulty: 'Easy',
    steps: 7,
  },
];

const CAST_ITEMS = SLEEP_ITEMS.filter(i => i.type === 'cast');
const VISUAL_ITEMS = SLEEP_ITEMS.filter(i => i.type === 'visual');
const STRETCH_ITEMS = SLEEP_ITEMS.filter(i => i.type === 'stretch');

// ─── Ionicons name type helper ─────────────────────────────────────────────────
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── createReaderStyles ────────────────────────────────────────────────────────
function createReaderStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 12 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
    title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text, flex: 1 },
    headerBtns: { flexDirection: 'row', gap: 8 },
    audioBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    closeBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    speakingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    speakingText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 80 },
    para: { fontFamily: 'Lora_400Regular', fontSize: 17, lineHeight: 30, color: C.textSub, marginBottom: 20 },
    endMark: { paddingTop: 20, alignItems: 'center' },
    endMarkText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 14, color: C.textMuted },
    bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  });
}

// ─── createStretchModalStyles ──────────────────────────────────────────────────
function createStretchModalStyles(C: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  routineTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text, flex: 1, textAlign: 'center' },
  progressLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textMuted, minWidth: 64, textAlign: 'right' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  timerRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  timerFill: { position: 'absolute', inset: 0, borderRadius: 70 },
  timerNum: { fontSize: 36, fontFamily: 'Inter_700Bold' },
  timerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
  poseCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 8, borderWidth: 1, borderColor: C.border, flex: 1 },
  poseName: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  holdBadge: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textMuted },
  poseCue: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 26 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  nextBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.bg },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 40 },
  doneIcon: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  doneSub: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.textSub },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 100, marginTop: 10 },
  doneBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.bg },
}); }

// ─── ReaderModal ───────────────────────────────────────────────────────────────
function ReaderModal({ visible, item, color, onClose }: {
  visible: boolean;
  item: { title: string; text: string } | null;
  color: string;
  onClose: () => void;
}) {
  const C = useColors();
  const readerStyles = useMemo(() => createReaderStyles(C), [C]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [visible]);

  if (!item) return null;
  const text = item.text;

  const handleSpeak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'en',
        rate: 0.85,
        pitch: 1.0,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleClose = () => {
    Speech.stop();
    setIsSpeaking(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={readerStyles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={[color + '30', C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.4 }} />
        <View style={readerStyles.handle} />
        <View style={readerStyles.header}>
          <Text style={readerStyles.title}>{item.title}</Text>
          <View style={readerStyles.headerBtns}>
            <Pressable
              style={[readerStyles.audioBtn, { backgroundColor: isSpeaking ? color + '40' : color + '20', borderColor: color + '60' }]}
              onPress={handleSpeak}
            >
              <Ionicons name={isSpeaking ? 'pause-circle-outline' : 'volume-high-outline'} size={18} color={color} />
            </Pressable>
            <Pressable style={[readerStyles.closeBtn, { backgroundColor: color + '25', borderColor: color + '50' }]} onPress={handleClose}>
              <Ionicons name="close" size={18} color={color} />
            </Pressable>
          </View>
        </View>
        {isSpeaking && (
          <View style={[readerStyles.speakingBanner, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            <Ionicons name="volume-high" size={14} color={color} />
            <Text style={[readerStyles.speakingText, { color }]}>Narrating...</Text>
          </View>
        )}
        <ScrollView style={readerStyles.scroll} contentContainerStyle={readerStyles.scrollContent} showsVerticalScrollIndicator={false}>
          {text.split('\n\n').map((para, i) => (
            <Text key={i} style={readerStyles.para}>{para.trim()}</Text>
          ))}
          <View style={readerStyles.endMark}>
            <Text style={readerStyles.endMarkText}>— end —</Text>
          </View>
        </ScrollView>
        <View style={[readerStyles.bottomFade, { pointerEvents: 'none' }]}>
          <LinearGradient colors={['transparent', C.bg]} style={StyleSheet.absoluteFill} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── StretchModal (preserved verbatim from original) ──────────────────────────
function StretchModal({ stretch, onClose, onComplete }: {
  stretch: typeof STRETCHES[0] | null;
  onClose: () => void;
  onComplete: () => void;
}) {
  const C = useColors();
  const stretchModalStyles = useMemo(() => createStretchModalStyles(C), [C]);
  const [poseIdx, setPoseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();

  const parseSecs = (hold: string): number => {
    const match = hold.match(/(\d+)\s*sec/);
    return match ? parseInt(match[1]) : 60;
  };

  useEffect(() => {
    if (!stretch) return;
    setDone(false);
    setPoseIdx(0);
    setSecondsLeft(parseSecs(stretch.poses[0].hold));
  }, [stretch]);

  useEffect(() => {
    if (!stretch || done) return;
    const secs = parseSecs(stretch.poses[poseIdx].hold);
    setSecondsLeft(secs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [poseIdx, stretch, done]);

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!stretch) return;
    if (poseIdx < stretch.poses.length - 1) {
      setPoseIdx(p => p + 1);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDone(true);
      onComplete();
    }
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDone(false);
    setPoseIdx(0);
    onClose();
  };

  if (!stretch) return null;
  const currentPose = stretch.poses[poseIdx];
  const totalSecs = parseSecs(currentPose.hold);
  const progress = secondsLeft / totalSecs;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secondsLeft}s`;

  return (
    <Modal visible={!!stretch} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={stretchModalStyles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={[stretch.color + '30', C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }} />
        <View style={stretchModalStyles.handle} />
        <View style={stretchModalStyles.header}>
          <Pressable style={stretchModalStyles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={20} color={C.textSub} />
          </Pressable>
          <Text style={stretchModalStyles.routineTitle}>{stretch.title}</Text>
          <Text style={stretchModalStyles.progressLabel}>
            {done ? 'Complete' : `${poseIdx + 1} of ${stretch.poses.length}`}
          </Text>
        </View>

        {!done ? (
          <View style={stretchModalStyles.content}>
            <View style={stretchModalStyles.dotsRow}>
              {stretch.poses.map((_, i) => (
                <View key={i} style={[stretchModalStyles.dot, { backgroundColor: i <= poseIdx ? stretch.color : C.border, width: i === poseIdx ? 20 : 8 }]} />
              ))}
            </View>

            <View style={[stretchModalStyles.timerRing, { borderColor: stretch.color + '40' }]}>
              <View style={[stretchModalStyles.timerFill, { backgroundColor: stretch.color + '15' }]} />
              <Text style={[stretchModalStyles.timerNum, { color: stretch.color }]}>{timeStr}</Text>
              <Text style={stretchModalStyles.timerSub}>remaining</Text>
            </View>

            <View style={stretchModalStyles.poseCard}>
              <Text style={[stretchModalStyles.poseName, { color: stretch.color }]}>{currentPose.pose}</Text>
              <Text style={stretchModalStyles.holdBadge}>{currentPose.hold}</Text>
              <Text style={stretchModalStyles.poseCue}>{currentPose.cue}</Text>
            </View>

            <Pressable style={[stretchModalStyles.nextBtn, { backgroundColor: stretch.color }]} onPress={advance}>
              <Text style={stretchModalStyles.nextBtnText}>
                {poseIdx < stretch.poses.length - 1 ? 'Next Pose' : 'Finish'}
              </Text>
              <Ionicons name={poseIdx < stretch.poses.length - 1 ? 'arrow-forward' : 'checkmark'} size={18} color={C.bg} />
            </Pressable>
          </View>
        ) : (
          <View style={stretchModalStyles.doneContainer}>
            <View style={[stretchModalStyles.doneIcon, { backgroundColor: stretch.color + '20', borderColor: stretch.color + '40' }]}>
              <Ionicons name="moon" size={48} color={stretch.color} />
            </View>
            <Text style={stretchModalStyles.doneTitle}>Session complete.</Text>
            <Text style={stretchModalStyles.doneSub}>Sleep well.</Text>
            <Pressable style={[stretchModalStyles.doneBtn, { backgroundColor: stretch.color }]} onPress={handleClose}>
              <Text style={stretchModalStyles.doneBtnText}>Close</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── HomeView ──────────────────────────────────────────────────────────────────
function HomeView({ onSelect, onBack }: {
  onSelect: (item: SleepItem) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [activeTab, setActiveTab] = useState<Tab>('Sleepcasts');

  const items = activeTab === 'Sleepcasts' ? CAST_ITEMS : activeTab === 'Visuals' ? VISUAL_ITEMS : STRETCH_ITEMS;

  return (
    <View style={{ flex: 1, backgroundColor: SBG }}>
      <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(123,110,246,0.09)', top: -100, left: -70 }} pointerEvents="none" />
      <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(62,201,167,0.06)', bottom: 140, right: -80 }} pointerEvents="none" />

      <View style={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: RIM, alignItems: 'center', justifyContent: 'center' }} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={W1} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 15, color: W1, letterSpacing: -0.2 }}>Sleep</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 100 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: DUSTY, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 10 }}>
            Sleep Library
          </Text>
          <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 36, color: W1, lineHeight: 44 }}>
            Wind down.{'\n'}<Text style={{ fontFamily: 'Lora_700Bold', fontStyle: 'normal' }}>Sleep deeply.</Text>
          </Text>
        </View>

        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 24 }}>
          {(['Sleepcasts', 'Visuals', 'Stretches'] as Tab[]).map(tab => (
            <Pressable
              key={tab}
              onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: activeTab === tab ? 'rgba(123,110,246,0.15)' : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === tab ? 'rgba(123,110,246,0.35)' : RIM,
              }}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: activeTab === tab ? W1 : W3 }}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20, gap: 6 }}>
          {items.map(item => (
            <Pressable
              key={item.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(item); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingVertical: 12, paddingHorizontal: 14,
                borderRadius: 16, backgroundColor: RIM,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
              }}
            >
              <LinearGradient colors={item.grad} style={{ width: 52, height: 52, borderRadius: 14 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: W1, marginBottom: 3 }} numberOfLines={1}>{item.title}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: W2 }} numberOfLines={1}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={W3} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── DetailView ────────────────────────────────────────────────────────────────
function DetailView({ item, onBack, onPlay, onRead, onStretch }: {
  item: SleepItem;
  onBack: () => void;
  onPlay: () => void;
  onRead: () => void;
  onStretch: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { toggleFavourite, isFavourite } = useApp();
  const fav = isFavourite(item.id);
  const isStretch = item.type === 'stretch';
  const tagColor = isStretch ? SAGE : IRIS2;
  const tagBg = isStretch ? 'rgba(62,201,167,0.15)' : 'rgba(123,110,246,0.2)';
  const tagBorder = isStretch ? 'rgba(62,201,167,0.3)' : 'rgba(123,110,246,0.35)';

  const meta = isStretch ? [
    { key: 'Duration', val: item.duration },
    { key: 'Poses', val: item.steps ? `${item.steps}` : '—' },
    { key: 'Level', val: item.difficulty ?? 'Easy' },
  ] : [
    { key: 'Narrator', val: item.narrator },
    { key: 'Duration', val: item.duration },
    { key: 'Category', val: item.category },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: SBG }}>
      <View style={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: RIM, alignItems: 'center', justifyContent: 'center' }} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={W1} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 13, color: W2 }} numberOfLines={1}>{item.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ height: 220, position: 'relative' }}>
        <LinearGradient colors={item.grad} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <LinearGradient colors={['transparent', SBG]} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }} />
        <View style={{ position: 'absolute', bottom: 20, left: 24, right: 24, gap: 8 }}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: tagBg, borderWidth: 1, borderColor: tagBorder }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: tagColor, letterSpacing: 1.1, textTransform: 'uppercase' }}>{item.category}</Text>
          </View>
          <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 26, color: W1, lineHeight: 34 }}>{item.title}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: W2, lineHeight: 25, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: RIM }}>
          {item.sub}
        </Text>

        <View style={{ flexDirection: 'row', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: RIM }}>
          {meta.map((m, i) => (
            <View key={m.key} style={{ flex: 1, paddingLeft: i > 0 ? 16 : 0, borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: RIM }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: W1, marginBottom: 4 }}>{m.val}</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: W3, textTransform: 'uppercase', letterSpacing: 0.8 }}>{m.key}</Text>
            </View>
          ))}
        </View>

        <View style={{ paddingVertical: 16, alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: RIM }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleFavourite({ id: item.id, type: 'sleep', title: item.title, color: IRIS, icon: 'moon' });
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={16} color={fav ? IRIS2 : W3} />
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: fav ? IRIS2 : W3 }}>
              {fav ? 'Saved to library' : 'Save to library'}
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 12, marginTop: 24 }}>
          {isStretch ? (
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onStretch(); }}>
              <LinearGradient colors={[SAGE, '#28a082']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <Ionicons name="body-outline" size={18} color={SBG} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: SBG }}>Begin Session</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPlay(); }}>
                <LinearGradient colors={[IRIS, '#5b4ed4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                  <Ionicons name="play" size={18} color={W1} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: W1 }}>Play Story</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRead(); }}
                style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: RIM2 }}
              >
                <Ionicons name="book-outline" size={18} color={W2} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: W2 }}>Read Story</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── PlayerView ────────────────────────────────────────────────────────────────
const PLAYER_TOOLS: Array<{ icon: IoniconsName; label: string }> = [
  { icon: 'partly-sunny-outline', label: 'Ambient' },
  { icon: 'bookmark-outline', label: 'Mark' },
  { icon: 'share-outline', label: 'Share' },
  { icon: 'heart-outline', label: 'Save' },
];

function PlayerView({ item, onBack }: { item: SleepItem; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { width: screenWidth } = useWindowDimensions();
  const { logWellnessSession } = useApp();
  const { play, stop } = useAmbientAudio();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mode, setMode] = useState<SleepMode>('read');
  const [speed, setSpeed] = useState<SleepSpeed>(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTimeRef = useRef(0);
  const speedRef = useRef<SleepSpeed>(1);
  const scrollRef = useRef<ScrollView>(null);
  const paraYPositions = useRef<{ [key: number]: number }>({});
  const totalSecs = item.durationSecs;

  // Animated blobs
  const blobX1 = useSharedValue(0);
  const blobY1 = useSharedValue(0);
  const blobX2 = useSharedValue(0);
  const blobY2 = useSharedValue(0);

  useEffect(() => {
    blobX1.value = withRepeat(withSequence(
      withTiming(22, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-18, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    blobY1.value = withRepeat(withSequence(
      withTiming(18, { duration: 13000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-12, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    blobX2.value = withRepeat(withSequence(
      withTiming(-20, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      withTiming(14, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
    blobY2.value = withRepeat(withSequence(
      withTiming(-16, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      withTiming(20, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
    ), -1, true);
  }, []);

  const blobStyle1 = useAnimatedStyle(() => ({ transform: [{ translateX: blobX1.value }, { translateY: blobY1.value }] }));
  const blobStyle2 = useAnimatedStyle(() => ({ transform: [{ translateX: blobX2.value }, { translateY: blobY2.value }] }));

  // Play button pulse
  const playScale = useSharedValue(1);
  useEffect(() => {
    if (isPlaying) {
      playScale.value = withRepeat(withSequence(
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ), -1, true);
    } else {
      playScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);
  const playBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: playScale.value }] }));

  // Karaoke data
  const paragraphs = useMemo(() => {
    return item.text.split('\n\n').map(p => ({ words: p.trim().split(/\s+/) }));
  }, [item.text]);

  const wordOffsets = useMemo(() => {
    let offset = 0;
    return paragraphs.map(p => { const s = offset; offset += p.words.length; return s; });
  }, [paragraphs]);

  const totalWords = useMemo(() => paragraphs.reduce((s, p) => s + p.words.length, 0), [paragraphs]);

  const currentWordIndex = Math.min(Math.floor((currentTime / totalSecs) * totalWords), totalWords - 1);

  const currentParaIdx = useMemo(() => {
    for (let i = wordOffsets.length - 1; i >= 0; i--) {
      if (currentWordIndex >= wordOffsets[i]) return i;
    }
    return 0;
  }, [currentWordIndex, wordOffsets]);

  useEffect(() => {
    if (mode === 'listen') return;
    const y = paraYPositions.current[currentParaIdx];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  }, [currentParaIdx, mode]);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const next = Math.min(currentTimeRef.current + 0.4 * speedRef.current, totalSecs);
        currentTimeRef.current = next;
        setCurrentTime(next);
        if (next >= totalSecs) {
          clearInterval(intervalRef.current!);
          setIsPlaying(false);
          logWellnessSession('sleep', item.id, item.title, totalSecs);
        }
      }, 400);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    play(item.id);
    return () => { stop(); };
  }, []);

  const togglePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(p => !p);
  };

  const skip = (secs: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(0, Math.min(currentTimeRef.current + secs, totalSecs));
    currentTimeRef.current = next;
    setCurrentTime(next);
  };

  const cycleSpeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeed(s => s === 1 ? 1.2 : s === 1.2 ? 1.5 : s === 1.5 ? 2 : 1);
  };

  const handleBack = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stop();
    onBack();
  };

  const progress = totalSecs > 0 ? currentTime / totalSecs : 0;
  const railWidth = screenWidth - 48;
  const fillWidth = Math.max(0, Math.min(progress * railWidth, railWidth));
  const remaining = Math.max(0, totalSecs - currentTime);
  const remMins = Math.floor(remaining / 60);
  const remSecs = Math.floor(remaining % 60);
  const timeLeft = `-${remMins}:${remSecs.toString().padStart(2, '0')}`;
  const totalDisplay = `${Math.floor(totalSecs / 60)}:00`;

  return (
    <View style={{ flex: 1, backgroundColor: SBG }}>
      <Reanimated.View style={[{ position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(123,110,246,0.07)', top: -130, alignSelf: 'center' }, blobStyle1]} pointerEvents="none" />
      <Reanimated.View style={[{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(62,201,167,0.05)', bottom: 160, right: -60 }, blobStyle2]} pointerEvents="none" />

      <View style={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: RIM, alignItems: 'center', justifyContent: 'center' }} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={W2} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 15, color: W1 }} numberOfLines={1}>{item.title}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: W3, marginTop: 1 }}>
            {item.narrator ? `${item.narrator} · ${item.duration}` : item.duration}
          </Text>
        </View>
        <Pressable
          onPress={() => { setMode(m => m === 'focus' ? 'read' : 'focus'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: mode === 'focus' ? 'rgba(123,110,246,0.5)' : RIM, backgroundColor: mode === 'focus' ? 'rgba(123,110,246,0.12)' : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Ionicons name="scan-circle-outline" size={14} color={mode === 'focus' ? IRIS2 : W3} />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: mode === 'focus' ? IRIS2 : W3 }}>Focus</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: RIM, borderRadius: 12, padding: 3 }}>
          {([
            { key: 'read' as SleepMode, label: 'Read along' },
            { key: 'focus' as SleepMode, label: 'Focus' },
            { key: 'listen' as SleepMode, label: 'Listen only' },
          ]).map(m => (
            <Pressable
              key={m.key}
              onPress={() => { setMode(m.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{
                flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center',
                backgroundColor: mode === m.key ? 'rgba(123,110,246,0.12)' : 'transparent',
                borderWidth: 1, borderColor: mode === m.key ? 'rgba(123,110,246,0.3)' : 'transparent',
              }}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: mode === m.key ? IRIS2 : W3 }}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {mode === 'listen' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <LinearGradient colors={item.grad} style={{ width: 140, height: 140, borderRadius: 28, marginBottom: 28 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 22, color: W1, textAlign: 'center', marginBottom: 8 }}>{item.title}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: W3, textAlign: 'center' }}>
            {isPlaying ? 'Narrating...' : 'Tap play to begin'}
          </Text>
        </View>
      ) : (
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
          {paragraphs.map((para, pi) => {
            const paraStart = wordOffsets[pi];
            const isPast = pi < currentParaIdx;
            const isCurrent = pi === currentParaIdx;
            const isNext = pi === currentParaIdx + 1;
            const paraOpacity = isPast ? 0.18 : isNext ? 0.35 : 1;

            return (
              <View key={pi} style={{ marginBottom: 28, opacity: paraOpacity }} onLayout={e => { paraYPositions.current[pi] = e.nativeEvent.layout.y; }}>
                {isCurrent ? (
                  <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 19, lineHeight: 34, color: W2 }}>
                    {para.words.map((word, wi) => {
                      const globalIdx = paraStart + wi;
                      const isLit = globalIdx === currentWordIndex;
                      const isDone = globalIdx < currentWordIndex;
                      return (
                        <Text key={wi} style={{ color: isLit ? W1 : isDone ? 'rgba(139,136,168,0.45)' : W2, fontFamily: isLit ? 'Lora_700Bold' : 'Lora_400Regular' }}>
                          {word + ' '}
                        </Text>
                      );
                    })}
                  </Text>
                ) : (
                  <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 19, lineHeight: 34, color: W2 }}>
                    {para.words.join(' ')}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: W3 }}>{timeLeft}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: W3 }}>{totalDisplay}</Text>
        </View>
        <View style={{ height: 2, backgroundColor: RIM2, borderRadius: 1 }}>
          <LinearGradient colors={[IRIS, SAGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 2, width: fillWidth, borderRadius: 1 }} />
          {fillWidth > 0 && (
            <View style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: W1, top: -4, left: fillWidth - 5, shadowColor: IRIS, shadowOpacity: 0.8, shadowRadius: 4 }} />
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24, marginTop: 20, marginBottom: 16 }}>
        <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: RIM, alignItems: 'center', justifyContent: 'center' }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="timer-outline" size={18} color={W2} />
        </Pressable>
        <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: RIM, alignItems: 'center', justifyContent: 'center' }} onPress={() => skip(-15)}>
          <Ionicons name="play-back" size={18} color={W2} />
        </Pressable>
        <Reanimated.View style={playBtnStyle}>
          <Pressable onPress={togglePlay} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: IRIS, alignItems: 'center', justifyContent: 'center', shadowColor: IRIS, shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 12 }}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={W1} style={{ marginLeft: isPlaying ? 0 : 3 }} />
          </Pressable>
        </Reanimated.View>
        <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: RIM, alignItems: 'center', justifyContent: 'center' }} onPress={() => skip(15)}>
          <Ionicons name="play-forward" size={18} color={W2} />
        </Pressable>
        <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: RIM, alignItems: 'center', justifyContent: 'center' }} onPress={cycleSpeed}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: speed !== 1 ? IRIS2 : W2 }}>{speed === 1 ? '1×' : `${speed}×`}</Text>
        </Pressable>
      </View>

      {toast !== null && (
        <View style={{ position: 'absolute', bottom: botPad + 90, alignSelf: 'center', backgroundColor: 'rgba(30,27,50,0.95)', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: RIM2 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: W1 }}>{toast}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingBottom: botPad + 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: RIM, justifyContent: 'space-around' }}>
        {PLAYER_TOOLS.map(tool => (
          <Pressable
            key={tool.label}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const msg = tool.label === 'Ambient' ? 'Ambient sound on' : tool.label === 'Mark' ? 'Position marked' : tool.label === 'Share' ? 'Sharing…' : 'Saved to library';
              showToast(msg);
            }}
            style={{ alignItems: 'center', gap: 5, opacity: 0.55 }}
          >
            <Ionicons name={tool.icon} size={20} color={W2} />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: W3 }}>{tool.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── SleepScreen (root) ────────────────────────────────────────────────────────
export default function SleepScreen() {
  const [view, setView] = useState<SleepView>('home');
  const [activeItem, setActiveItem] = useState<SleepItem | null>(null);
  const [stretchEntry, setStretchEntry] = useState<typeof STRETCHES[0] | null>(null);
  const [readerVisible, setReaderVisible] = useState(false);
  const { logWellnessSession } = useApp();

  const goHome = useCallback(() => { setView('home'); setActiveItem(null); }, []);
  const goDetail = useCallback((item: SleepItem) => { setActiveItem(item); setView('detail'); }, []);
  const goPlayer = useCallback(() => { setView('player'); }, []);
  const goDetailFromPlayer = useCallback(() => { setView('detail'); }, []);

  const openStretch = useCallback((item: SleepItem) => {
    if (!item.stretchId) return;
    const entry = STRETCHES.find(s => s.id === item.stretchId) ?? null;
    setStretchEntry(entry);
  }, []);

  const openReader = useCallback(() => {
    setReaderVisible(true);
  }, []);

  return (
    <>
      {view === 'player' && activeItem ? (
        <PlayerView item={activeItem} onBack={goDetailFromPlayer} />
      ) : view === 'detail' && activeItem ? (
        <DetailView
          item={activeItem}
          onBack={goHome}
          onPlay={goPlayer}
          onRead={openReader}
          onStretch={() => openStretch(activeItem)}
        />
      ) : (
        <HomeView onSelect={goDetail} onBack={() => router.back()} />
      )}

      <ReaderModal
        visible={readerVisible && view === 'detail'}
        item={activeItem ? { title: activeItem.title, text: activeItem.text } : null}
        color={IRIS}
        onClose={() => setReaderVisible(false)}
      />

      <StretchModal
        stretch={stretchEntry}
        onClose={() => setStretchEntry(null)}
        onComplete={() => {
          if (stretchEntry) {
            const item = SLEEP_ITEMS.find(i => i.stretchId === stretchEntry.id);
            if (item) logWellnessSession('sleep-stretch', item.id, item.title, item.durationSecs);
          }
        }}
      />
    </>
  );
}
