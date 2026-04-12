import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Modal, useWindowDimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
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

type Tab = 'Sleepcasts' | 'Visualizations' | 'Stretches';
type SleepView = 'home' | 'detail' | 'player';
type SleepMode = 'read' | 'focus' | 'listen';
type SleepSpeed = 1 | 1.2 | 1.5 | 2;

type SleepItem = {
  id: string;
  type: 'cast' | 'visual' | 'stretch';
  title: string;
  sub: string;
  desc: string;
  grad: readonly [string, string, string];
  narrator: string;
  duration: string;
  durationSecs: number;
  category: string;
  depth?: string;
  text: string;
  stretchId?: string;
  difficulty?: string;
  steps?: number;
  videoUrl?: string;
  coverIcon?: string;
};


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

const SLEEP_ITEMS: SleepItem[] = [
  {
    id: 'sc-01',
    type: 'cast',
    title: 'How to Stop Chasing Sleep',
    sub: 'Releasing sleep pressure · 28 min',
    desc: "For nights when sleep feels like something you keep missing. Let go of the chase, the mental maths, and the pressure — and find out what rest actually feels like when you stop reaching for it.",
    grad: ['#564890', '#6e5eac', '#8678c4'],
    narrator: '',
    duration: '28 min',
    durationSecs: 1680,
    category: 'Sleepcast',
    videoUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/Manas_Intro_Video_New.mp4',
    coverIcon: 'moon',
    text: `Hey… it's late.

If you're here with me, you've probably been trying to fall asleep for a while.
Maybe you've checked the time.
Maybe you've done that quiet math in your head:
"If I fall asleep now… I still get this many hours."

Let's put the maths down for tonight.

We're not going to chase sleep.
We're going to rest.
And if sleep wants to join us, it's welcome.
But it's not a test.

Take a slow breath in through your nose…
and let it leave gently through your mouth.

[PAUSE 10–15s of silence]

Sleep isn't something you perform.
It isn't a skill you either pass or fail.
It's something your body already knows how to do,
when it feels safe enough.

Tonight, we're creating that sense of safety.
Softly. Gradually. No rush.

Notice how much pressure you've been putting on yourself to "sleep well."
The perfect routine.
The perfect timing.
The perfect number of hours.

For now, set all of that to the side.

Imagine putting it into a small box beside the bed.
Close the lid.
You can pick it up again tomorrow if you want.
But not now.

Right now, the only job you have
is to lie here and be held by the bed.

Let your shoulders drop just a little.
Let your jaw loosen.
Let your tongue rest softly in your mouth.

Feel the mattress underneath you.
It isn't asking anything of you.
It's just holding you.

[PAUSE 20–30s]

Your body has fallen asleep thousands of times before this night.
You don't need to supervise it.
You don't need to manage it.

You can step away from the control panel.

Let's give your nervous system a very simple signal of safety.

Inhale through your nose for a gentle count of four…
1… 2… 3… 4…

Exhale through your mouth for a count of six…
1… 2… 3… 4… 5… 6…

Again.
Inhale 4…
Exhale 6…

Longer exhales tell your body,
"We're safe enough to soften."

[PAUSE ~60s while the host repeats the breath count a few times]

If your mind says,
"Is it working? Am I getting sleepy yet?"
you can answer kindly:

"We're not trying to sleep. We're resting."

That's our only goal tonight.
Resting.

Now imagine you're sitting beside a river at night.

The water is moving steadily.
You're not pushing it.
You're not measuring it.
You're just watching it move.

Sleep is like that river.
It doesn't flow because you push harder.
It flows because that's what it does
when you stop interfering.

Thoughts might float down that river like leaves.
A worry about tomorrow.
A replay of a conversation.
A random memory from years ago.

You don't need to jump in after them.
You can just watch them pass.

If one catches your attention,
notice it… and gently let it drift downstream.

[PAUSE 30–45s]

Drift with the river.
You don't have to arrive anywhere.
You're just here,
next to something that knows how to move on its own.

Now shift your attention back to your body.

Feel the weight of your legs.
Feel the way your heels sink into the bed.
Feel your hips supported.
Feel your back releasing,
one little section at a time.

Allow your arms to be heavy.
Let your hands soften.

Your breath is quieter now.
You don't need to control it.
Just notice it.

If sleep hasn't come yet, that's okay.
You are still doing exactly what your body needs:
you're off your feet,
you're warm,
you're safe,
you're resting.

As we come toward the end of this broadcast,
remember this:

You are not behind on sleep.
You are not failing at the night.

There is no scoreboard in the dark.

If sleep arrives while I'm talking,
let it take you.

If you're still awake,
stay with the feeling of being supported,
instead of the idea that you should be doing more.

Let your thoughts grow a little fuzzier around the edges.
Let your body feel heavier.
Let your to-do list fade into tomorrow where it belongs.

I'll turn the volume of my voice down slowly now.

You can stay right here,
in this soft, in-between place
where nothing is required of you.

Sleep will find you when it's ready.

Until then,
you're allowed to simply rest.`,
  },
  {
    id: 'sc-02',
    type: 'cast',
    title: 'If You Feel Overstimulated',
    sub: 'Calming overstimulation · 28 min',
    desc: 'When your body is in bed but your nervous system is still somewhere out there. A gentle way to turn the volume down — no forcing, no fixing, just a gradual softening.',
    grad: ['#3a5688', '#5070a4', '#6888bc'],
    narrator: '',
    duration: '28 min',
    durationSecs: 1680,
    category: 'Sleepcast',
    text: `Hey… you're tuned into Manas FM.

If you're here tonight,
there's a decent chance your body is in bed,
but your mind and your nervous system are still somewhere else.

Maybe still in a conversation.
Still in bright lights.
Still in the feed you were scrolling.
Still in the day you just had.

That wired-but-tired feeling.

We're not going to force calm.
We're going to gently turn the volume down.

Take a slow breath in through your nose…
and let it out through your mouth a little more slowly than usual.

[PAUSE 10–15s]

Overstimulation is not a flaw.
It simply means your brain and body processed a lot today.
A lot of sound.
A lot of colour.
A lot of input.

Now we invite everything to get just 10% quieter.

Imagine you're in a radio studio late at night.

Most of the equipment is off.
Just a few tiny lights are glowing.
There's a soft lamp in the corner,
casting a gentle, warm light.

You can hear a faint hum in the background.
Not loud. Not intrusive.
Just a quiet reminder that the room is still alive.

That hum is your nervous system.
It doesn't need to vanish.
It just needs to soften.

Inhale for a count of four…
2… 3… 4…

Exhale for a count of six…
2… 3… 4… 5… 6…

Each exhale is like sliding one switch a little lower.

[PAUSE ~45–60s while you repeat this pattern gently]

Now imagine your body has a few "dials" as well.

The tension in your shoulders.
The tightness in your jaw.
The little furrow between your eyebrows.

You don't have to turn them from 100 to 0.
Just ease them down a few notches.

Let your shoulders drop.
Let your jaw unclench.
Let your forehead smooth out a little.

Notice any place that feels buzzy or tight.
Imagine turning that dial down.

From "high alert" to "just aware."
From "ready to respond" to "it can wait."

When you're overstimulated,
your thoughts often don't line up politely.
They overlap.
They interrupt each other.
They talk over one another.

That's okay.
You don't have to make them take turns.

Think of them as radio stations
you're not fully tuned into.

Static.
Snippets of voices.
Bits of music.

You don't have to pick one to listen to.
You can let them all drift into the background.

If a thought pulls at you,
instead of arguing with it,
just say gently:

"Not right now. I'll think about you tomorrow."

No anger.
No fight.
Just a boundary.

[PAUSE 20–30s]

Bring your attention now
to the parts of your body that feel closest to the bed.

Your heels.
Your calves.
The backs of your thighs.
Your hips.
Your spine.
Your shoulders.

Feel how each of those places is supported.

You don't need to hold any of them up.
The mattress is doing that for you.

Allow your legs to feel heavier.
Allow your arms to feel heavier.

You have carried yourself all day.
You don't need to carry anything right now.

Let the softness underneath you slowly absorb the stress of the day,
like a sponge taking in water.

As we come to the end of this session,
notice what has shifted.

Maybe the room feels a little quieter.
Maybe your body feels a little heavier.
Maybe your mind is still a bit active,
but not at the same volume as before.

That's enough.

Calm doesn't need to be perfect.
Stillness doesn't need to be complete.

You have already moved in the right direction:
from loud to softer,
from bright to dim,
from busy to slower.

If sleep arrives, let it take the mic from me.
If not, stay with this feeling of "quieter than before."

You are still resting.
Your nervous system is still unwinding.

And you are doing enough,
just by lying here,
listening in the dark.`,
  },
  {
    id: 'sc-03',
    type: 'cast',
    title: "If You're Overthinking the Future",
    sub: 'Quieting future worry · 28 min',
    desc: 'For the nights when tomorrow feels louder than today ever was. A practice for rescheduling worry, returning to now, and giving your body permission to rest before everything is figured out.',
    grad: ['#8a4e6e', '#a66488', '#be7ca0'],
    narrator: '',
    duration: '28 min',
    durationSecs: 1680,
    category: 'Sleepcast',
    text: `Some nights,
tomorrow is louder than today ever was.

You lie down,
and suddenly your mind is time-travelling.

Into conversations that haven't happened.
Into problems that haven't arrived.
Into plans that don't need to be final yet.

If that's you,
you're not alone.
And there's nothing wrong with you.

Your brain is just trying to get ahead of things.
We're going to gently bring it back to now.

Take a soft breath in.
Let it fall out,
no rush.

[PAUSE 10–15s]

Tonight is not for solving the future.
It's for resting the body that has to live it.

Let's come back to what is certain in this moment.

You are in a room.
There is a surface beneath you.
There is air around you.
There is fabric against your skin.

Notice the weight of the blanket.
The shape of the pillow beneath your head.
The way your chest rises and falls.

None of that belongs to tomorrow.
It all belongs to now.

If your mind jumps ahead,
just say:

"Not tonight. Tomorrow can wait."

You're not ignoring it.
You're rescheduling it.

Now imagine every future thought
is a little note.

"I need to sort that."
"What if this happens?"
"Don't forget to…"

You don't have to tear them up.
You don't have to pretend they don't exist.

Instead, imagine placing each note
into a small box.

Gently.
No rush.

When you're done,
close the lid.

Now picture yourself
carrying that box
to the bedroom door,
and placing it just outside.

It will be there in the morning.
None of it will vanish.

But it doesn't need to lie in bed with you.

Bring your attention back to your breath.

Inhale slowly…
Exhale even more slowly.

You do not need all the answers tonight.
You do not need to be fully prepared tonight.

You are allowed to be a work in progress
and still rest.

If a new "what if" appears,
you can nod at it,
and mentally place it in that box,
outside the door.

Over and over, if needed.

[PAUSE 30–45s]

Your only job right now
is to lie here,
breathe,
and let your body know
that it's safe to relax
even when your life isn't perfectly organised.

As we close,
ask yourself one gentle question:

"Right now, in this exact minute,
am I safe enough to rest?"

Not forever.
Not for the whole year.

Just this minute.

If the answer is even slightly yes,
then let that be your permission.

Let your muscles loosen,
a little more with each exhale.

Let your thoughts blur around the edges.

You're not in tomorrow.
You're not fixing yesterday.

You're just here,
in this quiet room,
with this quiet breath,
listening to a soft voice
reminding you that you are allowed
to rest before everything is figured out.

If sleep arrives,
let it switch off the station.

If not,
it's okay.

You're still resting.
And that matters.`,
  },
  {
    id: 'sc-04',
    type: 'cast',
    title: "When Your Body Is Tired But Your Mind Isn't",
    sub: 'Slowing the restless mind · 28 min',
    desc: 'The body is heavy, but the mind is still pacing the corridors. A gentle practice for slowing your thoughts down to a drift — without forcing anything to stop.',
    grad: ['#2e6878', '#4a8898', '#60a0b0'],
    narrator: '',
    duration: '28 min',
    durationSecs: 1680,
    category: 'Sleepcast',
    text: `Your body is sending one clear message:
"I'm done for the day."

Heavy limbs.
Slow movements.
Eyes that want to close.

But your mind…
is still pacing the corridors.

This mismatch is one of the most common things people feel at night.
So if that's you,
you're very much not alone.

Tonight we're not going to force your mind to be silent.
We're just going to slow its walking pace.

Take a slow breath in.
Let it drift out.

No effort.

Imagine your thoughts like cars on a late-night highway.

Some are small and harmless.
Some are big and loaded with meaning.

Right now, they're moving faster than they need to.

There's no traffic behind them.
No one to impress.

So, in your mind,
lower the speed limit.

From 70… down to 50.

The cars don't slam on the brakes.
They just cruise a little slower.

After a while,
you lower it again.

From 50 down to 30.

They're still moving.
But now you can see more space between them.

Choose a word you'd like to ride on your exhale.

"Slow."
"Soft."
"Ease."
"Rest."

Whatever feels kind.

Inhale gently…
and as you exhale,
let that word drift out with your breath.

Slow…

Inhale again.
Exhale: Soft…

Like you're talking to your own nervous system.

You don't have to push thoughts away.
You're just inviting them to move slower.

Now, instead of focusing on the mind,
focus on your body.

Feel the weight of your feet.
Your calves.
Your thighs.
Your hips.

Let them sink.

Feel your back against the mattress.
Your shoulders supported.
Your head cradled by the pillow.

Your body is already in "rest mode."
It knows the routine.

The mind is just late to the party.

As you feel each part of your body get heavier,
imagine your thoughts matching that pace.

Less sprinting.
More drifting.

As we come toward the end,
remember this:

Your brain is doing what it was built to do — think.
Even at odd hours.

But thoughts don't have to move at full speed all the time.

You've nudged them into a slower gear tonight.

If they pick up again,
that's okay.
Gently bring them back down,
with your word on the exhale…
and the image of that quiet highway.

There is no race.
No deadline.
No perfect moment when you "should" have fallen asleep.

There's just this body,
in this bed,
on this night,
gradually softening.

If sleep comes,
let it take over.

If it doesn't yet,
you're still giving your body exactly what it needs:
a chance to be still.`,
  },
  {
    id: 'sc-05',
    type: 'cast',
    title: 'Turning Down the Inner Critic',
    sub: 'Silencing self-criticism · 28 min',
    desc: "When your own voice is the loudest thing in the room. A compassionate way to turn down the self-critic's volume and find your way to rest — without needing to have had a perfect day.",
    grad: ['#48508a', '#6068a8', '#7880c0'],
    narrator: '',
    duration: '28 min',
    durationSecs: 1680,
    category: 'Sleepcast',
    text: `Some nights,
the loudest noise in the room
isn't traffic,
or neighbours,
or a ticking clock.

It's your own voice.

Replaying the day.
Rewriting what you said.
Questioning what you did.

If that's happening for you,
I want you to know this:
that critical voice is trying, in its own clumsy way,
to keep you safe.

But tonight,
it doesn't need to be in charge.

We're going to turn its volume down.

Take a slow breath in.
Let it fall out.

[PAUSE 10–15s]

Imagine that critical voice as a person
sitting in a chair across the room.

Not right on your pillow.
Not whispering directly into your ear.

Just… over there.

It's allowed to exist.
But it doesn't get to run the room.

Notice what it says.
Notice its tone.
Is it harsh?
Sarcastic?
Tired?

Now imagine asking it,
quietly:

"Do you actually need to be this loud right now?"

You might feel it soften a notch,
just from being seen.

Now picture a friend
telling you the same story about their day
that you're telling yourself.

Same mistake.
Same awkward moment.
Same unfinished task.

Would you speak to them
the way you're speaking to you?

Probably not.

You'd likely be softer.
More patient.
More understanding.

So let's borrow that tone.

You don't have to change every word.
Just the volume and warmth behind it.

Instead of,
"I can't believe I did that,"

maybe:

"Okay… that wasn't ideal.
But I'm human.
And I'm learning."

Now imagine there's a dial on that inner voice.

Right now, maybe it's turned way up.

Gently, without forcing,
turn it down a little.

From 10 to 7.

You still hear it,
but it's not dominating.

After a few breaths,
turn it down again.

From 7 to 4.

More in the background.
Less in your face.

Eventually,
it becomes more like a radio in another room.
You can make out the sound,
but you don't have to listen to the words.

Here's an important truth:
You do not need to be perfectly pleased with yourself
to deserve rest.

You do not need to have had a flawless day
to be allowed to sleep.

You are not a project
that must be completed
before you're worthy of closing your eyes.

Tonight,
you're a human
who has lived through another day,
with all of its messiness,
and has reached the part
where rest is the next step.

Let your breath lengthen.
Let your muscles loosen.
Let that critical voice fade
into a softer, more distant sound.

If you like,
replace its last words for the night
with something kinder:

"I did enough for today."
"I can try again tomorrow."
"I'm allowed to rest now."

Let those be the final messages
you send yourself
before sleep — or simple rest — arrives.

You don't have to earn this.

You're already here.

And that's enough.`,
  },

  {
    id: 'vis-01',
    type: 'visual',
    title: 'The Quiet Descent',
    sub: 'Progressive Relaxation · 20 min',
    desc: 'A full-body release that moves from face to feet, tension to rest. Each exhale carries the day a little further away until there is nothing left to carry.',
    grad: ['#4a5a9a', '#6272b4', '#7a8acc'] as const,
    narrator: '',
    duration: '20 min',
    durationSecs: 1200,
    category: 'Visual',
    depth: 'Deep release',
    text: `Welcome.

You made it to the end of this day.

Whatever it held, whatever it asked of you, it is behind you now. The only thing in front of you is rest.

Find your position. Let your body arrange itself the way it wants to, not the way you think it should. On your back, on your side, curled or straight. Let it choose.

And close your eyes.

Before we go any further, I want to offer you something simple.

Say this to yourself, just once, from somewhere honest:

Tonight, I give myself permission to rest.

Let that land wherever it lands.

Now let us begin with the breath.

Not a special breath. Not a technique. Just the next breath, taken a little more deliberately than usual.

In through the nose. Slow and full. Let the belly rise before the chest. Fill all the way to the top.

Hold it there for just a moment. Feel the fullness of it.

And release. Long and slow through the mouth. Let every last bit go.

Again. In, filling from the bottom up.

Hold at the top.

And a long, slow, complete exhale. As if you are setting something down.

One more. In.

Hold.

And out. Let the breath take the last of the day's effort with it.

Breathe normally now.

Notice that the body already feels different. Heavier, perhaps. Or simply more still.

Now we are going to move through the body, area by area. At each place we will invite a brief, deliberate tension, and then release it completely. The release is everything. The tension is only there to make the release possible, to show the body the contrast between held and free.

You carry more than you know. By the time we finish, you will feel it leaving.

We begin with the face.

Scrunch it all together. Forehead wrinkling, eyes squeezing shut, cheeks lifted, jaw clenched. Everything pulling toward the centre.

Hold it. A little longer.

And release.

Let the face go completely slack. The forehead smooth. The space around the eyes wide and easy. The jaw falling open just slightly. The whole face softening like something that was clenched around nothing and has finally let go.

Feel that.

Now the neck and shoulders.

Draw your shoulders up toward your ears. As high as they will go. Hold everything tight.

Hold. A little longer.

And drop.

Let the shoulders fall all the way down. Further than feels natural. Let them be heavy. Feel the neck lengthen. Feel how much space there is now that was not there a moment ago.

Breathe out.

Now the hands and arms.

Squeeze both hands into tight fists. Feel the tension travel up through the forearms, the upper arms. Everything gripped.

Hold.

And open. Let the hands fall open. Let every finger release. Let the arms grow heavy, the elbows soft, the whole length of both arms settling into rest.

Breathe out.

Now the chest and belly.

Take a breath in and hold it, drawing the muscles of the chest and abdomen inward at the same time. Everything held and pulled tight.

A little longer.

And release. Let the breath go. Let the belly be completely soft, completely open. Let the chest expand without effort.

Breathe out.

Now the lower back and the seat.

Squeeze and hold. The deep muscles of the lower back, the buttocks, everything tightening at once.

Hold. A little more.

And let go. Feel the lower back settle into the surface beneath you. Not holding itself up, not bracing. Simply resting, held by the ground.

Breathe out.

Now the legs, all the way down.

Tighten the thighs, press the knees together, flex the calves, curl the toes. The entire length of both legs, held tense and heavy.

Hold.

And release. Let everything go at once. The legs growing heavy and warm. The feet still. The toes soft.

Breathe out.

Take a moment now to feel the whole body.

From the crown of your head to the soles of your feet, every muscle you visited has now been released. The body is heavier than it was a few minutes ago. Not the heaviness of burden, the heaviness of rest. Of something that has finally stopped working.

This is what your body feels like when it is not afraid.

Now bring your attention to the breath.

Just the breath. Nothing else.

Notice that it has changed. It is slower now, more quiet, moving at a different depth than when we began. You did not do that deliberately. The body did it because you gave it permission.

Feel the belly rise on the inhale. And fall on the exhale.

Rise.

Fall.

If a thought comes, let it pass the way a light passes across a wall. You do not need to follow it. You can always come back to the breath. To the rise and fall.

There is nothing you need to figure out tonight.

Nothing that requires your attention until morning.

The day is complete. Whatever it was, it is finished.

You are allowed to disappear into sleep now. Fully. Without reservation.

Let the breath slow a little more.

Let the body grow a little heavier.

Let the edges of your thoughts go soft.

You are very close now.

The breath. The dark. The warmth. The quiet.

Let it take you.

Good night.`,
  },
  {
    id: 'vis-02',
    type: 'visual',
    title: 'Back to Rest',
    sub: 'Body Scan · Back to sleep · 15 min',
    desc: 'Waking in the night is not failure. This practice meets you exactly where you are and guides a warm light through the body until rest finds its way back.',
    grad: ['#483e80', '#6058a0', '#7870b8'] as const,
    narrator: '',
    duration: '15 min',
    durationSecs: 900,
    category: 'Visual',
    depth: 'Return to sleep',
    text: `You are awake.

And that is perfectly alright.

Waking in the night does not mean something has gone wrong. It does not mean sleep is lost. It simply means you are here, in this in-between place, and what the body and mind need right now is permission to find their way back.

I will be here with you. We are in no hurry.

There is no pressure in this practice. No goal to achieve. We are not trying to force sleep or rush toward anything. We are simply creating the right conditions and trusting the body to do what it knows how to do when we stop standing in the way.

Take a moment now to settle into your position. If something is uncomfortable, adjust. A small shift, a different placement of the arms, a pillow moved slightly. This is your time. Comfort is the only instruction.

And when you are ready, let the eyes close.

Feel the surface beneath you. The mattress, the pillow, the weight of whatever covers you. Notice how completely you are held. You are not falling. You are held. You always have been.

Let the body grow a little heavier.

Now bring your attention gently to the breath. Not to change it. Not to improve it. Simply to notice it as it is right now.

Is it fast? Slow? Shallow? Deep?

Just notice. You are not watching the breath from the outside. You are feeling it from the inside. The cool air entering the nostrils on the inhale. The slight pause at the top as the direction changes. The warm air leaving on the exhale. The body softening slightly with each release.

This is the breath. It has been happening without your help your entire life. You can trust it completely.

If thoughts are present, that is normal. The mind does not simply stop because we wish it to. When a thought arises, notice it without judgment, and return to the breath. Return as many times as you need to. There is no limit. There is no score being kept. Each return is its own small act of kindness toward yourself.

Now let us slow the breath together for a few cycles.

Breathe in through your nose for a count of four. Two, three, four.

And out through your mouth for a count of six. Two, three, four, five, six.

Again. In. Two, three, four.

And out. Two, three, four, five, six.

One more time. In. Two, three, four.

And out. Two, three, four, five, six.

Now let go of the counting. Let the breath return to its own natural rhythm. Simply notice if it has shifted at all. Perhaps a little slower. Perhaps a little more at ease.

Whatever has happened is right.

Now I want to guide a warm light through your body. Imagine it beginning at the soles of your feet. Soft and golden. Not bright. Just warm, the way the sun feels on skin on a quiet afternoon.

Allow this warmth to settle at your feet. The toes softening. The arches releasing. The heels growing heavy.

The warmth moves up through the ankles. The calves. The shins. The muscles of the lower legs releasing on each exhale.

Up through the knees. The joints easing. Any stiffness gently dissolving.

Into the thighs. The large muscles of the upper legs, heavy and warm, releasing fully.

Into the hips and pelvis. Feel this area soften. The sitting bones releasing into the mattress.

The warmth rises through the belly. Let the belly be completely soft. Rising and falling with the breath, effortlessly.

Up through the chest. The warmth spreading gently across the ribcage. The heart, steady and unhurried. The lungs, easy and open.

Across the shoulders. Feel them melt. Away from the ears. Down toward the mattress. Fully released.

Down through the arms. The upper arms. The elbows. The forearms. The wrists.

Into both hands. The palms growing warm. Each finger softening and releasing.

Up into the neck. The muscles at the sides and the back of the neck, releasing.

Into the face. The jaw, soft. The lips, resting. The cheeks. The space around the eyes, wide and easy. The forehead, smooth and still.

Your whole body now, from feet to face, washed through with warmth.

Heavy. Soft. Held.

If you are still awake, that is alright. This rest, this quality of stillness, is itself deeply nourishing. The body is restoring itself even now.

Stay with the warmth. Stay with the breath.

Sleep will come when the body is ready.

And the body is almost ready.

Rest now. All the way.`,
  },
  {
    id: 'vis-03',
    type: 'visual',
    title: 'The River Between Worlds',
    sub: 'Yoga Nidra · 20 min',
    desc: 'A complete yoga nidra practice with sankalpa, full body rotation, and the dissolving of boundaries between heaviness and light. Rest in the silence between waves.',
    grad: ['#2a6068', '#427882', '#5a909c'] as const,
    narrator: '',
    duration: '20 min',
    durationSecs: 1200,
    category: 'Visual',
    depth: 'Yoga Nidra',
    text: `This practice will meet you wherever you are.

In bed, on a mat, in a chair, in a seat far from home. The practice does not require a particular place. It requires only your willingness to arrive.

Take a moment now to notice whether there is any small adjustment that would allow you to be even slightly more at ease. Five or ten percent more comfortable. The position of the head. The placement of the arms. A small shift of the hips. Make that adjustment now.

And settle.

Open your senses.

Notice the taste inside the mouth.

Notice the sounds around you, near and far, received not just by the ears but by the whole body. Not listening for anything in particular. Simply receiving.

Notice the quality of the air as it enters the nose. Its temperature tonight.

And let the eyes rest. Not looking for anything. Not watching anything. The visual field simply dark and soft and yours.

Feel the skin. The temperature of the air against it. The weight of fabric. The exact and particular geography of the surface that holds you.

You are here. Present and arrived.

Now set your sankalpa.

Your heart's intention. Not a goal. Not a resolution. Something quieter and truer than those things. The thing that lives at the centre of your longing for this period of your life. The wish you would choose above all others if you could choose clearly.

Ask yourself now, with genuine curiosity and without judgment: what do I most deeply want?

Let the answer come from the chest, not the head.

Now imagine your life with this intention already fulfilled. Not as an idea. As a felt reality. What does it look like? What sounds surround it? How does the body feel, moving through days in which this is already true?

Let it be as real in the body as you can make it.

Say it to yourself three times, in your own words, from the heart, in the present tense. As if it is already so.

Then offer it to the night. Release it. Trust that it has been received.

Allow the breath to return.

Not controlled. Not adjusted. Simply allowed. The breath breathing you.

Feel the body in stillness, and notice how it resembles something like water. Spread across the surface that holds it. Shaped by what contains it. At rest in its own nature.

Feel the tide of the breath. The slow rise. The pause at the crest. The long fall. The pause at the depth. And within that pause, a quality of stillness that is unlike anything else. The place between breaths. The silence between waves.

Feel how this rhythm mirrors the larger rhythms of the world. The tide going out and returning. The day dissolving into night and night opening back into day. You are part of all of it, without effort, simply by breathing.

Now begin to count back on each exhalation from ten to zero. Resting awareness at the heart. Each out-breath carrying you one layer deeper.

Ten. Nine. Eight. Seven. Six. Five. Four. Three. Two. One. Zero.

Now move through the body.

The hollow space of the throat.

The tongue.

The jaw.

The gums. The teeth. The lips. The whole interior of the mouth, full of sensation.

The cheeks. The cheekbones. The chin.

Both ears. The earlobes.

The nose. Both nostrils. The tip of the nose.

Both eyes in their sockets. The space beneath the eyes. Both eyelids. Both eyebrows. The space between the eyebrows.

The temples. The forehead. The crown of the head. The back of the skull. The back of the neck.

The whole head as one sphere of sensation.

Both shoulders. Both upper arms. Both elbows. Both forearms. Both wrists.

The palms. The backs of the hands. The thumbs. The index fingers. The middle fingers. The ring fingers. The small fingers.

The spaces between the fingers. The tips of the fingers. Each one like a small stream flowing out into the space beyond.

The chest. The upper back. The ribcage. The middle back.

The belly. The low back. The pelvis. The hips.

Both thighs. Both knees. The space beneath the knees.

Both lower legs. Both ankles. The heels.

The soles of the feet. The tops of the feet. The big toes. The second toes. The middle toes. The fourth toes. The small toes.

The spaces between the toes. The tips of the toes. Each one a small stream dissolving into the space beyond.

Feel the whole body at once.

Every point of sensation you have visited, softening into a single continuous field of awareness. Not separate parts. One whole presence.

Now let awareness descend beneath the surface.

Feel the skin. And pass through it. Into the warm insulating layers beneath.

Deeper into the muscles. Feeling every muscle in the body give up its work. Not just relax. Give it up entirely. Let the body be carried by the ground.

Deeper into the bones. Their dense and patient weight. The bones settling completely.

Deeper into the soft organs. The body's interior quietly tending to itself. The heart. Its slow and steady rhythm.

The fluids and waterways. The body's rivers in their ancient courses.

The cells, humming and glowing in their millions. Like stars in a night sky seen from somewhere perfectly still.

And beneath even that, the energy behind all sensation. Silent. Vast. The ground beneath the ground.

Rest there for a moment.

Now bring your attention to the sensation of heaviness.

The body growing heavy. The limbs heavy. The head heavy. The whole body weighted and sinking, slowly and pleasantly, into what holds it.

Give yourself completely to heaviness.

Now shift your attention to the sensation of lightness.

The body growing light. The limbs weightless. The torso barely present. Everything floating, dissolving, almost not there.

Give yourself completely to lightness.

Back to heaviness. Sinking. Heavy. Held.

Back to lightness. Floating. Dissolving. Weightless.

Now feel both simultaneously.

Don't try to think about it. Just feel.

Heavy and light together, dissolving into each other, into something that has no name.

Let the question arise quietly: what is the body now? Is it solid? Does it have a centre? Where are its edges?

Let the body answer. Not the mind.

And then release even the question.

Nothing to do. Nothing to know. Nothing to hold.

Fall back into the heart.

The mind emptying. Thoughts arising and dissolving before they fully form.

Stories of the day releasing. The shape of tomorrow releasing.

Falling back and back and back.

Into deep, quiet, complete rest.

The night is long and welcoming.

There is nothing more.`,
  },
  {
    id: 'vis-04',
    type: 'visual',
    title: 'Water and Energy',
    sub: 'Yoga Nidra · 20 min',
    desc: 'A pranamaya kosha practice through the body of breath and vital force. Awareness flows like water from the crown downward, touching everything, resting at each energy centre.',
    grad: ['#2c5872', '#447090', '#5c88a8'] as const,
    narrator: '',
    duration: '20 min',
    durationSecs: 1200,
    category: 'Visual',
    depth: 'Energy body',
    text: `Welcome to this practice.

Tonight we work within the pranamaya kosha, the second layer of the self in the ancient map of Yoga Nidra. This is the body of energy, of breath, of the vital force that flows through everything living. It is associated with the element of water, with fluidity, with the quality of movement that finds its own level and does not resist.

Water does not force its way. It flows around what it meets. It takes the shape of what contains it. And when it is still, it becomes a mirror.

Tonight we will invite that quality of water into the body.

Find your position now. Wherever feels most comfortable and safe.

Take a moment to make any small adjustments. Five percent more comfortable. Then settle.

Take a slow breath in through the nose, all the way to the top.

And release it as a long sigh through the mouth.

Again. In through the nose, filling completely from below.

And a long, slow release.

Allow the breath to find its own rhythm now. Let the body breathe for you. Give it your complete trust.

Let the eyes soften. The tongue release from the roof of the mouth. The jaw fall slightly open. The throat widen and relax.

Let the chest and shoulders soften into the support beneath you.

Let the belly be completely free.

Now your sankalpa.

A cultivation. A seed. Something you are growing in yourself, something your life is asking of you right now.

Ask yourself gently: what do I need? What does my body need in this period of my life? What does my mind need? What does my heart most deeply need?

You might choose something of your own that is already forming at the edges of awareness.

Or you might work with the intention of this practice, the quality of water: I am adaptable. I flow with what is. I am resilient.

Whatever you choose, hold it in the chest.

Say it to yourself three times.

Then allow it to float away gently, like a leaf on a current. Trust that the water of the body will carry it to where it needs to go.

Now we move through the body. We will travel from the top of the head downward, and then return upward. Allow your attention to move like water, trickling and flowing from point to point.

We begin at the very top of the head.

Notice what is here.

Allow attention to flow down to the forehead.

The eyebrows.

The temples.

The eyes.

The cheeks.

Both nostrils.

The space behind the nose.

Both lips.

The roof of the mouth.

The floor of the mouth.

The teeth. The gums.

The tip of the tongue. The back of the tongue.

The jaw.

Both ears.

The sides of the neck.

The front of the throat.

The collarbones.

The chest.

Right shoulder. Right elbow. The wrist. The palm of the right hand. The back of the right hand. The thumb. The first finger. The second finger. The third finger. The little finger.

Sense the space around the right hand. Any subtle energy. Any warmth or vibration.

Allow awareness to flow back up the right arm to the heart centre.

Left shoulder. Left elbow. The wrist. The palm of the left hand. The back of the left hand. The thumb. The first finger. The second finger. The third finger. The little finger.

Sense the left hand and the space surrounding it.

Allow awareness to flow back up the left arm to the heart centre.

The ribcage. The navel. The belly. The pelvis.

Right hip. Right knee. The ankle. The heel. The sole of the right foot. The top of the foot. The first toe. The second toe. The third toe. The fourth toe. The fifth toe.

Sense the right foot and the space beyond it.

Allow awareness to flow back up the right leg.

Left hip. Left knee. The ankle. The heel. The sole of the left foot. The top of the foot. The first toe. The second toe. The third toe. The fourth toe. The fifth toe.

Sense the left foot and the space around it.

Allow awareness to flow back up the left leg.

The tailbone. The lower back. The mid-back. The upper back. The back of the neck. The back of the head. The top of the head.

Any energy in the space above and around the crown.

Now allow awareness to flow slowly downward through the whole body, from the crown to the feet, like water moving through a vessel. Trickling and flowing, touching everything.

And then slowly back upward. Rising through the body from the feet to the crown. Awareness moving like a current.

Come to rest with a sense of the whole body at once.

Now we turn inward to sense the energy within.

Bring your attention to the space at the base of the spine. The root. What is present here? Energy may feel like warmth, a subtle hum, a density, a pulsing. Or simply the quiet fact of being alive in this place.

Allow attention to rise to the lower belly. The pelvic bowl. The hips. What is in this space? What has the day deposited here?

Up to the navel centre. The place of the digestive fire. The seat of the vital energy. Notice the breath moving here.

Up to the ribcage. The diaphragm at its centre, always moving. Feel the expansion of the inhale and the softening of the exhale.

Up to the heart centre. The chest and the upper back. Perhaps the heartbeat, felt from the inside. Whatever is present, simply meet it.

Up to the throat. The portal of breath and voice. What does this space feel like tonight?

Up to the space between the eyebrows. The seat of inner vision. Notice any sensation, any colour, any image forming at the edge of the mind.

Up to the crown of the head. And beyond, to the space above.

Now sense the whole column at once, from the root to the crown.

And now notice the movement in the body. The breath. The heartbeat. The subtle current of energy that never stops.

And notice the stillness that underlies all of it. The awareness that is present before sensation and after it.

Notice both together. Movement and stillness. Flow and rest.

Using your imagination now, allow images of water to arise and pass through you like a slow current.

A calm river at night, the surface dark and reflecting stars.

Rain falling into still water, rings spreading outward.

The edge of the ocean at low tide, the water barely moving.

A lake in the mountains, completely still at dawn.

Mist rising from water in the early morning.

The sound of a distant stream heard from somewhere warm and safe.

Water falling through open hands.

The particular stillness of a body of water just before sleep.

Allow the images to soften and dissolve.

Allow awareness to settle into the stillness beneath all movement.

Your heart's intention is within you now. The water of the body carries it. Trust that it will find its way.

Rest now, deeply and completely.

May you sleep well.`,
  },
  {
    id: 'vis-05',
    type: 'visual',
    title: 'The Ground Beneath You',
    sub: 'Yoga Nidra · 20 min',
    desc: 'Sleep is not manufactured — it is allowed. This yoga nidra clears the way through sankalpa, a slow journey through every part of the body, and the dissolving of weight itself.',
    grad: ['#3c5470', '#546c88', '#6c84a0'] as const,
    narrator: '',
    duration: '20 min',
    durationSecs: 1200,
    category: 'Visual',
    depth: 'Yoga Nidra',
    text: `This practice is for rest and sleep.

Wherever you are right now, this practice will meet you there. It asks nothing of your circumstances. Only your willingness to arrive.

Sleep is not something we manufacture. It is something we allow. Tonight we are simply removing what stands in the way.

Take a moment now to notice if there is any small adjustment that would make you 5 or 10% more comfortable.

And then be still.

Open your senses now.

Notice the taste inside your mouth. The ambient sounds of wherever you are, received with the whole body. The smell of the air as it enters your nostrils. And let the eyes rest completely.

Feel the skin. The temperature of the air against any exposed surface. The particular geography of the surface that holds you.

You are here. Completely, entirely here.

Now set your sankalpa.

Your intention. Your deepest, most honest desire for this period of your life.

Hold it gently. Don't grip it.

Now imagine your life with this desire already fulfilled. What does it look like? What sounds surround it? What does your body feel like, moving through a life in which this is already true?

Feel it. Don't just think it.

Repeat your sankalpa three times, in your own words, from the place in your chest where true things live. In the present tense. As if it is already so.

Then offer it to the night and let it go.

Now allow your attention to rest softly on the breath.

Not controlling it. Not deepening or slowing it deliberately. Simply allowing the breath to breathe you.

Feel the tide of your breath. The slow rise. The pause. The gentle fall.

Now begin to count back on each exhalation from ten to zero. Resting your awareness at the centre of your chest. Each exhale carrying you one step deeper.

Ten. Nine. Eight. Seven. Six. Five. Four. Three. Two. One. Zero.

Now begin a slow journey through the body.

The throat. The tongue resting in the mouth. The jaw. The gums. The teeth. The lips.

The whole mouth, full of sensation.

The cheeks. The cheekbones. The chin.

The ears. The earlobes.

The nose. Both nostrils. The bridge of the nose. The tip of the nose.

Both eyes resting in their sockets. The space just beneath each eye. Both eyelids, soft and heavy. Both eyebrows. The space between the eyebrows.

The temples. The forehead. The crown of the head. The back of the skull. The base of the skull where it meets the neck.

The whole head, felt as one soft sphere of sensation.

Both shoulders. Both upper arms. Both elbows. Both forearms. Both wrists.

The palms of the hands. The backs of the hands. The thumbs. The index fingers. The middle fingers. The ring fingers. The small fingers.

The spaces between the fingers. The tips of the fingers.

The chest. The upper back. The ribcage. The middle back.

The belly. The lower back. The pelvis. The sitting bones. The hips.

Both thighs. Both knees. The space beneath both knees.

Both lower legs. Both ankles. The heels.

The soles of the feet. The tops of the feet. The big toes. The second toes. The middle toes. The fourth toes. The small toes.

The spaces between the toes.

Now feel the whole body at once.

Every individual sensation beginning to soften into one continuous field.

Now let awareness move beneath the surface.

Feel the skin as a boundary, and then pass through it. Into the warm layers beneath.

Deeper into the muscles. Feeling them release their command.

Deeper into the bones. The architecture that holds you upright through the waking hours, now carried entirely by the ground.

Deeper into the soft organs. The heartbeat, unhurried.

The fluids and waterways. The body's rivers.

And the cells, humming, pulsing, glowing in their millions. Like a sky full of stars seen from somewhere very still.

And beneath even that, the energy behind all sensation. The ground of everything.

Now bring your attention to the sensation of heaviness.

Feel the body growing heavy. The limbs heavy. The head heavy. Everything sinking gently, pleasantly, into the ground.

Give yourself up to heaviness.

Now shift attention to lightness.

Feel the body growing light. The limbs weightless. The head floating. Everything lifting, dissolving.

Give yourself up to lightness.

Back to heaviness. Arms and legs heavy, sinking. Head and body heavy, held.

Back to lightness. Arms and legs floating. Head and body barely touching the surface.

Now feel both at once.

Heavy and light together. Don't think about it. Just feel.

Let the body answer: where are you? Is there a boundary? Is there a centre?

Let the body answer. Not the mind.

And then let even the question go.

Set your attention free.

Nothing to do. Nothing to know. Nothing to hold or want or reach for.

Fall back into the warmth of the heart.

Let the mind empty completely.

Falling back and back and back.

Into deep, quiet, complete rest.`,
  },
  {
    id: 'vis-06',
    type: 'visual',
    title: 'Dissolving Into Night',
    sub: 'Yoga Nidra · Back to sleep · 20 min',
    desc: 'A back-to-sleep yoga nidra for the in-between hours. Sankalpa, body rotation, the contrast of heaviness and lightness, until only presence remains and you fall back into it.',
    grad: ['#4a3868', '#625080', '#7a6898'] as const,
    narrator: '',
    duration: '20 min',
    durationSecs: 1200,
    category: 'Visual',
    depth: 'Return to sleep',
    text: `This practice is yours, wherever you are.

On a bed, in a chair, on a floor somewhere unfamiliar. The practice travels with you. It meets you in the body you have, in the position you're in, right now.

Sometimes sleep comes easily. Sometimes it requires an invitation. Tonight we are extending that invitation as openly and gently as we can.

We are not trying to manufacture sleep. We are creating the conditions and trusting the body to do what it already knows how to do.

Take a moment now to settle. To make the smallest adjustments that might bring you even a fraction more comfort.

Comfort is not indulgence tonight. Comfort is the work.

Now open your senses.

The interior taste of the mouth. The sounds of wherever you are. The quality of the air entering the nose. And the eyes, closing now, the visual world receding, internal space opening up behind the eyelids.

And the skin. The touch of air. The touch of fabric. The precise and particular way this surface meets your body.

Here. Present. Arrived.

Now your sankalpa.

The intention you carry into sleep. Not a goal. Not an ambition. Something deeper, the quiet wish at the centre of this period of your life.

Hold it in the chest, not the mind.

Now let it expand into vision. What does your life look like with this already true?

Let it be real in your body, not just a thought.

Say it to yourself three times. Your own words. The present tense. The truth you are choosing.

Then offer it forward, into the territory of sleep, and let it go.

Let the breath come back now.

Not summoned. Not controlled. Simply noticed.

The breath breathing you.

Feel how stillness turns the body into something like water. Spreading to fill its container. Finding its own level. At rest in its own nature.

Count back now on each exhale from ten to zero. Resting awareness at the heart.

Ten. Letting go. Nine. Softer. Eight. Quieter. Seven. Deeper. Six. Still. Five. Stiller. Four. Almost nothing. Three. Just breath. Two. Just presence. One. Just rest. Zero.

Now a slow and deliberate journey through the body.

The hollow of the throat. The tongue. The roof of the mouth. The floor of the mouth. The gums. The teeth. The lips. The whole interior of the mouth.

The cheeks. The cheekbones. The jaw, soft now, released.

The ears. The earlobes.

The nose. The nostrils. The bridge. The tip.

The eyes, resting in their sockets. The skin beneath each eye. The eyelids, heavy and warm. The eyebrows. The long space between them.

The temples. The forehead, smooth and wide. The crown. The back of the head. The base of the skull.

The whole head as a single soft sphere.

Both shoulders. Both upper arms. Both elbows. Both forearms. Both wrists.

The palms. The backs of the hands. The thumbs. The index fingers. The middle fingers. The ring fingers. The small fingers.

The spaces between the fingers. The very tips of the fingers.

The chest. The upper back. The ribcage. The middle back.

The belly. The low back. The pelvis. The sitting bones. The hips.

Both thighs. Both knees. The soft space behind both knees.

Both lower legs. Both ankles. The heels.

The soles of the feet. The arches. The tops of the feet.

The big toes. The second toes. The middle toes. The fourth toes. The small toes.

The spaces between the toes.

The whole body now.

All of it held in awareness simultaneously.

Now move beneath the surface.

The skin, and then through it. The warm layers beneath.

Into the muscles. All of them, one by one, giving up their work.

Into the bones. Their density. Their quiet weight. Their patient architecture.

Into the organs. The heart, its slow and steady beat.

The blood moving in its ancient courses.

The cells. Millions of them. Each one a small light. Together, a galaxy.

And behind all of it, the energy that underlies sensation. Quiet. Vast. The ground of everything.

Rest in that.

Now the sensation of heaviness.

Feel the body growing heavy. Dense and sinking.

Give yourself up to it.

Now lightness.

Feel the body growing light. Barely present. Almost floating.

Give yourself up to that.

Back to heaviness. Limbs sinking. Body yielding to gravity.

Back to lightness. Limbs dissolving. Body barely there.

Now both together.

Heavy and light. Sinking and floating.

Feel them dissolving into each other.

Now let the question arise, gently: where is the body? Is it solid? Is it bounded?

Let the body answer.

And then release even the question.

Nothing to find. Nothing to solve. Nothing to hold.

Fall back into the heart.

Everything emptying. Thoughts drifting out like mist.

What remains when all of that has gone?

You remain.

Simply. Quietly. Here.

Fall into that.

Fall back and back and back into the deepest rest.

The night is long.

There is nothing more to do.`,
  },
  {
    id: 'vis-07',
    type: 'visual',
    title: 'The Inner Sky',
    sub: 'Yoga Nidra · 20 min',
    desc: 'Rest in the vast, dark space that underlies all thought and sensation. A complete body rotation leads you to the place where identity dissolves and only stillness remains.',
    grad: ['#38367a', '#5050a0', '#6868b8'] as const,
    narrator: '',
    duration: '20 min',
    durationSecs: 1200,
    category: 'Visual',
    depth: 'Yoga Nidra',
    text: `This is a practice for rest, relaxation, and sleep.

It will meet you wherever you are. You need only this: a willingness to arrive in the body you have, exactly as it is.

Sleep comes like weather. We do not command it. But we can create the conditions in which it finds us more easily.

Take a moment now to notice your position. And notice whether there is any small adjustment that would make you more comfortable. Make that adjustment now. And then be still.

Now open each sense in turn.

The taste inside the mouth. Noticing it without comment.

Sound. The sounds of wherever you are, received by the whole body. Not listening for anything. Just receiving.

Smell. The quality of the air entering the nostrils.

And the eyes, resting now, the world of shapes and light receding, the inner space expanding.

And the skin. The air against it. The texture and temperature of everything that touches you.

Here. In the body. Arrived.

Now your sankalpa.

Your deepest desire. Not what you have been told to want, but the thing that lives quietly at the centre of your longing for this time in your life.

Let it surface without forcing.

Now feel your life with this desire already fulfilled. Don't think about it. Feel it.

Say it to yourself three times, from the heart, in the present tense.

Then offer it to the night. And release it.

Come back to the breath.

Not to manage it. Not to change it. To receive it.

Feel the tide of breathing. The slow rise and fall. The pause at the peak and the pause at the base.

Begin now to count back on each exhalation from ten to zero. Awareness resting at the heart.

Ten. Nine. Eight. Seven. Six. Five. Four. Three. Two. One. Zero.

Now move through the body.

The throat. The tongue. The jaw. The gums. The teeth. The lips.

The whole interior of the mouth.

The cheeks. The cheekbones. The chin.

Both ears. Both nostrils. The bridge. The tip of the nose.

Both eyes in their sockets. The skin beneath them. The eyelids. Both eyebrows. The still space between them.

The temples. The forehead. The crown. The back of the skull. The base of the skull.

The whole head, held in awareness as one soft, warm orb.

Both shoulders. Both upper arms. The elbows. The forearms. The wrists.

The palms. The backs of the hands. The thumbs. The index fingers. The middle fingers. The ring fingers. The small fingers.

The spaces between the fingers. The fingertips.

The chest. The upper back. The ribcage. The middle back.

The belly. The low back. The pelvis. The hips.

Both thighs. Both knees. The space behind both knees.

Both lower legs. Both ankles. The heels.

The soles of the feet. The arches. The tops of the feet.

All ten toes.

The spaces between the toes.

Now the whole body at once.

Every point of sensation melting into every other. Not parts but wholeness.

Move now beneath the surface.

The skin and then past it. The warm insulating layers beneath.

Into the muscles. Feeling them release. Not just relax. Release. Giving up the effort of the day entirely.

Deeper into the bones. Their patient heaviness.

Into the soft interior. The organs in their dark and steady labour. The heart. The lungs.

The waterways of the body.

The cells, alive, pulsing, luminous. A universe in the dark. Like stars behind closed eyes.

And underneath all sensation, the ground of it. The stillness that underlies all movement. The silence beneath all sound.

Rest there.

Now the sensation of heaviness.

Feel the body growing heavy. Limbs heavy. Head heavy. Everything sinking, pleasantly, into the ground.

Give yourself completely to heaviness.

Now lightness.

Feel the body becoming light. Barely there. The limbs floating.

Give yourself completely to lightness.

Back to heaviness. Dense and sinking.

Back to lightness. Floating and dissolving.

Now both together.

Simultaneous. Heavy and light at the same time.

Feel them dissolving into each other.

Now let the question come softly: what is the body now? Is it solid? Where are its edges?

Let the body answer. Don't help it.

And then release the question too.

Set attention free.

No identity to maintain. No time to keep track of. No place you need to be.

What is here when all of that falls away?

Stay with whatever remains.

Fall back now, all the way back, into the open space of the heart.

The mind, emptying.

Into deep rest.

Into the quiet that was always here beneath everything else.

The inner sky. Vast and dark and full of light.

Fall into it.

There is nothing more.`,
  },
  {
    id: 'vis-08',
    type: 'visual',
    title: 'The Night Shore',
    sub: 'Progressive Relaxation · 15 min',
    desc: 'Stand at the edge of a warm, star-lit shore. Each wave carries a thought away. The water rises slowly around you until the pull of sleep becomes as natural as the tide.',
    grad: ['#24607a', '#3a7a98', '#4e92b0'] as const,
    narrator: '',
    duration: '15 min',
    durationSecs: 900,
    category: 'Visual',
    depth: 'Immersive',
    text: `Welcome.

This is a sleep meditation for deep and restful rest.

Find your position now. Whatever feels most natural to you. Let your body settle into the surface beneath you.

Close your eyes.

Repeat these words silently to yourself.

I release this day. I release this day. I release this day.

Your mind already knows how to sleep. We are simply clearing the path.

Take a moment to notice where you are right now. Not the room, not the day behind you, but the feeling of your own body, heavy and still, exactly where it is.

You don't need to go anywhere tonight. You are already here.

Breathe in slowly through your nose. Fill your lungs completely. Hold it there for just a moment. And release through your mouth, long and slow.

Again. Breathe in. Hold. And out.

One more time. In. Hold. And a long, slow exhale.

Breathe normally now.

I want you to imagine that you are standing at the edge of a shore at night.

The water is still. The sky above you is deep and dark and full of quiet stars. The air is cool against your skin, just cool enough to feel clean and real.

You can hear the water. Soft, rhythmic waves pulling slowly in and out. In and out. There is no urgency in those waves. They have been doing this for longer than memory.

You take a step forward until the water just touches your feet.

It is warm.

Warmer than you expected.

And with that warmth, something in your chest releases.

Now let's allow your body to release as well.

Tighten your feet and toes. Curl them gently. Hold the tension. Hold it. And let go.

Feel the wave of softness move up through your feet.

Your calves and shins. Tighten them. Hold. And release. The warmth moves upward.

Your thighs. Squeeze them together. Hold the tension. And release.

Your hands. Make two gentle fists. Tight. Hold. And open your hands slowly. Feel the tension leave through your fingertips.

Your arms and shoulders. Draw your shoulders up toward your ears. Hold them there. Hold. And let them drop completely.

Your face. Tighten your jaw, your cheeks, your forehead. Hold everything tight. And release. Let your jaw fall soft. Let your forehead smooth out.

Your whole body is softer now.

The shore is still there. The warm water is still at your feet. The waves are still moving in their ancient unhurried rhythm.

You walk a few steps further in. The water rises to your ankles. Still warm. Still safe.

With each wave that passes, you feel yourself becoming quieter.

One wave. A thought drifts by. You let it go.

Another wave. A worry rises briefly and dissolves.

Another wave. Your breath slows a little more.

The water is at your knees now and you are perfectly calm. The stars above you are impossibly beautiful and you are here, small and warm and held by the night.

There is nothing to solve tonight.

Your mind has done its work for today and it is allowed to rest.

You begin to feel the soft pull of sleep, like a current, gentle and inevitable.

You don't need to swim. You only need to float.

Let the water hold you.

Let the night hold you.

Let sleep come in the way the tide comes. Not forced, not rushed, just arriving, as it always does.

Your breathing is slow now. Each exhale a little longer than the last.

The shore, the stars, the warm dark water.

You are almost there.

And now you are.

Good night. Sleep deeply. Wake renewed.`,
  },
  {
    id: 'vis-09',
    type: 'visual',
    title: 'The Mountain Cabin',
    sub: 'Progressive Relaxation · 12 min',
    desc: 'Inside a warm cabin high in the mountains, snow falls softly outside. A low fire. Heavy blankets. No signal. No expectations. Nothing left to do but sleep.',
    grad: ['#4a4e70', '#606488', '#78809e'] as const,
    narrator: '',
    duration: '12 min',
    durationSecs: 720,
    category: 'Visual',
    depth: 'Immersive',
    text: `Welcome.

This meditation will guide you into deep, uninterrupted sleep.

Settle into your position now. Let your weight fall fully into wherever you are lying. You don't need to hold anything up tonight.

Close your eyes.

Say this quietly to yourself.

My body knows how to rest. My body knows how to rest. My body knows how to rest.

That is true. It has always been true. We are simply reminding it.

Tonight I want to take you somewhere quiet.

Imagine you are inside a small wooden cabin high in the mountains. It is night. Outside, snow is falling, not heavy, just soft and steady, the kind of snow that muffles the world and makes everything feel far away and safe.

Inside the cabin it is warm. There is a low fire. You can hear the faint sound of wood settling, the occasional soft pop of embers. The light is amber and dim, the kind of light that asks nothing of your eyes.

You are in a bed. The blankets are heavy and warm. The pillow is exactly right.

There is nowhere to go. No signal. No notifications. No one expecting anything from you until morning.

Just the fire. The snow. The silence underneath both.

Let's take three breaths together before we continue.

In through your nose, deep and slow. Hold for a moment. And out through your mouth, long and complete.

Again. In. Hold. And out.

One more. In. Hold. And release everything.

Good.

Now scan your body from your feet upward and wherever you find tension, breathe into it and let it go.

Start at your feet. Notice them. Are they holding anything? Let them release. Feel them become heavy.

Move to your calves. Any tightness here? Breathe into it. And let it soften.

Your knees. Your thighs. Let them sink. Heavy and warm against the mattress.

Your lower back. This is a place that carries a great deal. Breathe here. Let the mattress take the weight your back has been carrying all day.

Your stomach. Let it be soft. Let it rise and fall freely.

Your chest. Let your chest open. Let your next breath be a little fuller.

Your shoulders. Drop them. Further than you think you can. There. That's it.

Your neck. Your jaw. The small muscles around your eyes.

Let everything soften.

You are lying in that warm cabin bed now, every muscle quiet, the fire still burning low, the snow still falling outside.

You are perfectly safe.

As you lie there, you notice the sound of the snow against the window. It is barely a sound at all, more like the absence of sound, a softness that surrounds everything.

Your thoughts are slowing down.

They come, and they pass, like snowflakes drifting past the window. You don't need to catch them. They are just weather. They pass.

Your breath is slower now than when we began.

The fire has settled into a deep steady glow.

The cabin is warm.

The mountain outside is ancient and still.

You are held here, in this quiet, in this warmth, completely safe and completely free to rest.

Sleep is very close now.

You can feel it the way you feel warmth spreading through your chest, not something you reach for, something that simply arrives.

Let it arrive.

There is nothing more to do tonight.

Let your eyes be heavy.

Let your thoughts dissolve.

Let the warmth take you.

Good night. Sleep long. Wake full of light.`,
  },
  {
    id: 'vis-10',
    type: 'visual',
    title: 'Weightless',
    sub: 'Progressive Relaxation · 12 min',
    desc: 'The day is done. What you did was enough. As the body grows lighter and thoughts lose their edges, you cross the familiar border between waking and sleep — as you do every night.',
    grad: ['#3a4870', '#526488', '#6a7ca0'] as const,
    narrator: '',
    duration: '12 min',
    durationSecs: 720,
    category: 'Visual',
    depth: 'Gentle release',
    text: `Welcome.

This is your invitation to rest.

You've carried a great deal today. Before we begin, I want to acknowledge that. The day is done. What you did was enough. What you didn't do can wait.

You are allowed to stop now.

Find your stillness. Close your eyes.

Repeat these words once, slowly, in your own mind.

I am safe. I am still. I am ready to sleep.

Let those words settle.

Now breathe with me.

A long breath in through your nose. Let your belly rise first, then your chest. Fill completely. Hold for just a moment at the top. And a slow, extended exhale through your mouth. Let every last bit of breath leave you.

Again. In. Full and deep. Hold. And out. Long and slow.

One more. In. Hold at the top. And release. All of it.

Breathe normally now and notice how different your body already feels from when we began.

I want to offer you an image.

Imagine that your body is becoming lighter.

Not in a strange way, just the particular lightness that comes in the last moments before sleep, when the weight of the day begins to lift, when your limbs feel distant and soft and no longer entirely yours.

That lightness begins at your feet.

Your feet feel distant now. Warm and far away. You can barely feel them.

It moves up through your ankles, your calves. Your legs feel heavy in the way that only means they are completely relaxed, sinking gently through the mattress toward somewhere deeper and quieter.

Your hands. Your fingers. They feel warm, slightly tingling, releasing.

Your arms. Your shoulders. All of it softening, releasing, letting go of the shape of the day.

Your neck. The base of your skull. The muscles behind your eyes.

Soft. Still. Quiet.

You are becoming weightless.

Not floating. Resting. Deeply, completely resting. The kind of rest your body has been asking for.

Your breath is doing something interesting now. It's slowing down on its own. You don't need to manage it. Your body is already moving toward sleep, and your breath is following.

In. And out.

In. And out.

Each cycle a little slower. Each exhale a little longer.

You might notice your thoughts becoming less sharp now. Less urgent. They are losing their edges. They are becoming more like shapes than words, more like colours than ideas.

That is the border of sleep.

You are very close to it.

There is a quality to this place, the place between waking and sleep, that is unlike anywhere else. Quiet, but alive. Still, but full of something that feels like possibility.

You've been here before. Every night of your life, you've passed through here.

Tonight, like every night, sleep is waiting for you just beyond this place.

You don't need to do anything to get there.

Only this.

One more breath in.

And a long, slow breath out.

Let your body go.

Let your thoughts go.

Let the night hold you.

You're done for today.

Sleep now.

Good night.`,
  },
  {
    id: 'vis-11',
    type: 'visual',
    title: 'Laying It Down',
    sub: 'Breath-Led Release · 10 min',
    desc: 'Let each out-breath take something with it. The day\'s decisions, friction, effort — it all flows out through the hands and feet until a soft, open space is all that remains.',
    grad: ['#3c4e62', '#547080', '#6c8898'] as const,
    narrator: '',
    duration: '10 min',
    durationSecs: 600,
    category: 'Visual',
    depth: 'Breath-led',
    text: `Allow your eyes to close.

Let them close softly, without effort. Let the lids be heavy and still.

And breathe out.

As you do, let the breath carry something with it. You don't need to know what. Just let the out-breath take whatever is ready to leave.

Let your jaw soften. Let your mouth part slightly. Let the face you wore through the day begin to dissolve.

And breathe out again.

Let your shoulders drop. Not just a little. All the way. Further than you think they can go.

And breathe out.

Let your arms grow loose. Let your hands open or simply stop holding. Let the fingers uncurl.

Breathe out.

Let your chest release. Let it all soften now. Let the chest be open and easy.

Breathe out.

Let your belly soften. Let it be completely soft. No holding. No bracing. Just soft and natural, rising and falling on its own.

Breathe out.

Let your legs grow heavy. The thighs, the calves, the ankles. All of it heavy and at rest.

Let the feet release. Let the toes uncurl.

Breathe out.

And let the stuff of the day flow out with each breath.

Not because you have to name it or sort it or resolve it. Just let it flow. Like water finding its natural course. Out from the shoulders. Down the arms. Out through the hands.

Out from the chest. Out from the belly. Down through the legs. Out through the feet.

Out and away.

Out and away.

Out and away.

Now allow the softness in.

Around your eyes. Let your eyes know they don't have to work right now. They can rest completely.

Let the softness move to your mind.

Your mind has been working so hard all day. And now you can let it know, gently, kindly, that it can stop. That there is nothing more it needs to do tonight.

Let the mind soften.

Breathe out.

Let the hard edges of the day dissolve. The sharpness. The urgency. The friction. Let it soften and flow out on the breath. Out and away.

Let the softness spread.

Through the mind.

Through the body.

Through every part of you that worked hard today.

Let all of it know: you can rest now. Not later. Now.

Feel the ground beneath you. The solid, steady, patient ground. It has been here the whole time, holding you without asking anything in return.

Let the ground receive the weight of the day.

Lay it down. All of it. The decisions. The worries. The things you said and the things you didn't.

Lay it all down.

It is just energy. The ground can hold it tonight while you rest.

Say the words now, inside yourself.

I let go of the day.

I let go of the day.

Feel what happens when you say that.

I let go of the day.

Now let the softness turn toward the self.

The self that has been in the centre of all of it today. Doing its best, which is all any self can ever do.

Let this self know it can rest now.

Draw it back from wherever it has been scattered. Back to here. Back to this breath. Back to this body. Back to now.

And breathe out.

Let the shoulds go. The shouldn'ts. The should-have-dones. Out and away.

Breathe out.

And say the words.

I let go of everything from the day.

Let it flow out. All of it. Out and away on the breath.

And let a space open up around you.

A space that is just for you.

Soft and open and at rest.

Let the softness fill the space.

Breathe into it.

And rest.

You have done enough today.

You have been enough today.

Now there is only this.

This breath.

This softness.

This rest.

Rest well.

Rest for you.`,
  },
  {
    id: 'vis-12',
    type: 'visual',
    title: 'Soften and Flow',
    sub: 'Breath-Led Release · 10 min',
    desc: 'A gentle breath-led release that lets the day flow out through every exhale. Soften the face, the mind, the self. Come home. Lay it all on the ground. Rest here.',
    grad: ['#56406a', '#705888', '#8870a0'] as const,
    narrator: '',
    duration: '10 min',
    durationSecs: 600,
    category: 'Visual',
    depth: 'Breath-led',
    text: `Close your eyes.

Let them close gently. Let the weight of the lids do what they have wanted to do for some time now. Let the world of waking simply recede.

And breathe out.

As the breath goes, let something go with it. Whatever has been sitting in the chest or the shoulders or the jaw waiting for permission to leave.

Let it go on the breath.

Out and away.

Let your face soften. The face you wore today, all its expressions, its concentration, its composure. Let it go. Jaw loose. Cheeks soft. The space around the eyes open and easy.

And breathe out.

Let your shoulders soften. Let them drop. And then let them drop a little more. There is nothing for them to carry right now.

And breathe out.

Let your arms grow heavy. Let your hands release whatever they have been holding. Let the tension drain from the palms. From the fingers. Out through the fingertips. Out and away.

And breathe out.

Let your chest be open and easy. Let the breath move through it freely. If there is something held here, let the breath carry it out.

Out and away.

And breathe out.

Let your belly be completely soft. Completely open. Simply rising and falling on its own.

And breathe out.

Let your legs release. Your hips. Your thighs. Your knees. Your calves. Your feet. All of it releasing into the ground.

Breathe out.

And now just let everything flow.

From the top of your body to the bottom. From the shoulders down the arms out through the hands. From the chest out through the breath. From the belly down through the legs out through the feet.

Out and away.

Out and away.

Out and away.

Don't try to direct it. Just let the out-breath carry it.

Now let the softness come in.

Let it come around your eyes. A soft permission to stop looking. To stop watching.

Let the softness move to the mind.

Your mind has been working. And right now you can tell it, with genuine kindness, that it has done enough for today.

There is nothing left to solve tonight.

Nothing that cannot wait until the morning, when you will meet it rested and clear.

Let the mind hear that.

And let it begin to soften.

Breathe out.

Let the hard edges of the day flow out of the mind. The friction. The sharpness. Out and away.

Let the softness spread.

Through the mind. Through the body. Through every part of you that worked today.

You can let it all know now.

The day is done. You can rest. Real permission to stop.

To really stop.

Deep, complete, full rest.

Feel the ground beneath you.

How solid it is. How it has been here this whole time, steady and patient and utterly reliable.

Let the ground take the day from you.

Lay it down. Everything. The worry, the effort, the things you got right, the things you got wrong.

Lay it all on the ground.

And say the words now, quietly inside yourself.

I let go of the day.

I let go of the day.

Feel what moves when you say that.

I let go of the day.

Now let the softness find the self.

The self that has been running everything today. That has been doing its absolute best with everything available to it.

Let that self come in from the scattered places it has been.

Come home.

Back to here. Back to this breath. Back to this body. Back to now.

Breathe out.

Let the shoulds go. The shouldn'ts. The should-have-dones. Out and away.

And say the words.

I let go of everything from the day.

Let it all go. Out through the breath. Out and away.

And let a space open up.

Right here. Right around you. A space that is only yours.

Rest in that space.

Let the softness fill it.

Let it hold you.

Let it nourish you simply by being here.

Soft. Open. Still.

This is yours.

Rest here.

Rest well.

Rest for you.`,
  },

  {
    id: 'str-winddown',
    type: 'stretch',
    title: '5-Min Wind Down',
    sub: 'Easy · 6 poses · 5 min',
    desc: 'Six gentle poses that signal your body the day is done. No mat needed, no experience required. Just you, your breath, and five quiet minutes before sleep.',
    grad: ['#2e6854', '#428070', '#569a88'],
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
    sub: 'Easy · 8 poses · 8 min',
    desc: 'Four poses for the places where tension quietly lives. The shoulders carry more than we notice. This is the gentle work of letting it down.',
    grad: ['#524a8a', '#6a64a8', '#827ec0'],
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
    sub: 'Moderate · 10 poses · 15 min',
    desc: "A head-to-toe release for the evenings when nothing quite settled. Ten poses, one breath at a time. By the end, you'll mean it when you say you're ready for sleep.",
    grad: ['#7a4e44', '#9a6860', '#b2807c'],
    narrator: '',
    duration: '15 min',
    durationSecs: 900,
    category: 'Stretch',
    text: 'A complete full-body flow from Cat-Cow to Savasana.',
    stretchId: 'str-fullbody',
    difficulty: 'Moderate',
    steps: 10,
  },
  {
    id: 'str-spine-open',
    type: 'stretch',
    title: 'Spine & Hip Open',
    sub: 'Easy · 7 poses · 10 min',
    desc: 'Gentle mobility for the joints that carry you all day. Slow, intentional, deeply releasing. The spine is long. The hips hold more than they should. This helps.',
    grad: ['#2c6070', '#446e88', '#5a86a0'],
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


type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];


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


function HomeView({ onSelect, onBack, activeTab, setActiveTab }: {
  onSelect: (item: SleepItem) => void;
  onBack: () => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const items = activeTab === 'Sleepcasts' ? CAST_ITEMS : activeTab === 'Visualizations' ? VISUAL_ITEMS : STRETCH_ITEMS;

  return (
    <View style={{ flex: 1, backgroundColor: SBG }}>
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
          {(['Sleepcasts', 'Visualizations', 'Stretches'] as Tab[]).map(tab => (
            <Pressable
              key={tab}
              onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center',
                backgroundColor: activeTab === tab ? 'rgba(123,110,246,0.15)' : 'transparent',
                borderWidth: 1,
                borderColor: activeTab === tab ? 'rgba(123,110,246,0.35)' : RIM,
              }}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: activeTab === tab ? W1 : W3 }}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        {(() => {
          const featuredItem = items[new Date().getDate() % items.length];
          const typeLabel = featuredItem.type === 'cast' ? 'SLEEPCAST' : featuredItem.type === 'visual' ? 'GUIDED VISUAL' : 'SLEEP STRETCH';
          return (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(featuredItem); }}
              style={{ marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', height: 180 }}
            >
              <LinearGradient colors={featuredItem.grad} style={{ flex: 1, padding: 18 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: W1, letterSpacing: 0.8 }}>
                      {typeLabel} · {featuredItem.duration.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="play" size={20} color={W1} style={{ marginLeft: 3 }} />
                  </View>
                </View>
                <View style={{ position: 'absolute', bottom: 18, left: 18, right: 72 }}>
                  <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 22, color: W1, marginBottom: 4 }} numberOfLines={1}>{featuredItem.title}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(240,236,255,0.75)' }}>Recommended for tonight</Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })()}

        <View style={{ paddingHorizontal: 20, gap: 6 }}>
          {items.map((item) => (
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
              <LinearGradient colors={item.grad} style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                {item.coverIcon ? (
                  <Ionicons name={item.coverIcon as any} size={22} color="rgba(255,255,255,0.9)" />
                ) : null}
              </LinearGradient>
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

  const isVisual = item.type === 'visual';
  const meta = isStretch ? [
    { key: 'Duration', val: item.duration },
    { key: 'Poses', val: item.steps ? `${item.steps}` : '—' },
    { key: 'Level', val: item.difficulty ?? 'Easy' },
  ] : isVisual ? [
    { key: 'Duration', val: item.duration },
    { key: 'Type', val: 'Visual' },
    { key: 'Depth', val: item.depth ?? 'Restful' },
  ] : [
    { key: 'Narrator', val: item.narrator },
    { key: 'Duration', val: item.duration },
    { key: 'Category', val: item.category },
  ];
  const tagLabel = item.type === 'cast' ? 'Sleepcast' : item.type === 'visual' ? 'Guided Visual' : 'Sleep Stretch';

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
        {item.coverIcon && (
          <View style={{ position: 'absolute', top: 16, right: 24, width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={item.coverIcon as any} size={28} color="rgba(255,255,255,0.95)" />
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 20, left: 24, right: 24, gap: 8 }}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: tagBg, borderWidth: 1, borderColor: tagBorder }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: tagColor, letterSpacing: 1.1, textTransform: 'uppercase' }}>{tagLabel}</Text>
          </View>
          <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 26, color: W1, lineHeight: 34 }}>{item.title}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: W2, lineHeight: 25, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: RIM }}>
          {item.desc}
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
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: SBG }}>Begin session</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPlay(); }}>
                <LinearGradient colors={[IRIS, '#5b4ed4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                  <Ionicons name="play" size={18} color={W1} />
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: W1 }}>{isVisual ? 'Begin visualisation' : 'Play story'}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRead(); }}
                style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: RIM2 }}
              >
                <Ionicons name="book-outline" size={18} color={W2} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: W2 }}>{isVisual ? 'Read guide' : 'Read story'}</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}


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

  const videoPlayer = useVideoPlayer(item.videoUrl ?? null, (player) => {
    player.loop = true;
    player.muted = true;
  });

  useEffect(() => {
    if (!item.videoUrl || mode !== 'listen') {
      videoPlayer.pause();
      return;
    }
    if (isPlaying) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }, [isPlaying, mode, item.videoUrl]);

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
    if (isPlaying) {
      play(item.id);
    } else {
      stop();
    }
  }, [isPlaying]);

  useEffect(() => {
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
      {mode === 'listen' && item.videoUrl && (
        <>
          <VideoView
            style={StyleSheet.absoluteFill}
            player={videoPlayer}
            contentFit="contain"
            nativeControls={false}
            allowsFullscreen={false}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(4,4,14,0.35)' }]} />
        </>
      )}
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
          onPress={() => { setMode('focus'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: RIM, borderWidth: 0.5, borderColor: RIM2, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 16, color: W1 }}>◉</Text>
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
          {!item.videoUrl && (
            <LinearGradient colors={item.grad} style={{ width: 140, height: 140, borderRadius: 28, marginBottom: 28, alignItems: 'center', justifyContent: 'center' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              {item.coverIcon && <Ionicons name={item.coverIcon as any} size={52} color="rgba(255,255,255,0.85)" />}
            </LinearGradient>
          )}
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

      {mode === 'focus' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 }}>
          <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 22, lineHeight: 36, color: W1, textAlign: 'center', marginBottom: 40 }}>
            {paragraphs[currentParaIdx]?.words.join(' ') ?? ''}
          </Text>
          <Pressable
            onPress={() => { setMode('read'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={{ paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
          >
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: W2 }}>Exit focus</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}


export default function SleepScreen() {
  const [view, setView] = useState<SleepView>('home');
  const [activeItem, setActiveItem] = useState<SleepItem | null>(null);
  const [stretchEntry, setStretchEntry] = useState<typeof STRETCHES[0] | null>(null);
  const [readerVisible, setReaderVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Sleepcasts');
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
        <HomeView onSelect={goDetail} onBack={() => router.back()} activeTab={activeTab} setActiveTab={setActiveTab} />
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
