import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Modal, useWindowDimensions, Image,
} from 'react-native';
import { Audio } from 'expo-av';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
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

const SLEEP_NARRATORS = [
  { id: 'rainbird', name: 'Rainbird', desc: 'Calm · British' },
  { id: 'clara', name: 'Clara', desc: 'Warm · British' },
  { id: 'oliver', name: 'Oliver', desc: 'Warm · British' },
];

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
  audioUrl?: string;
  coverIcon?: string;
  coverImage?: number;
  lightVideo?: boolean;
  tags?: string[];
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
    sub: 'Releasing sleep pressure · 7 min',
    desc: "For nights when sleep feels like something you keep missing. Let go of the chase, the mental maths, and the pressure. Find out what rest actually feels like when you stop reaching for it.",
    grad: ['#564890', '#6e5eac', '#8678c4'],
    narrator: 'Oliver',
    duration: '7 min',
    durationSecs: 420,
    category: 'Sleepcast',
    videoUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/video/candles.mp4',
    audioUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/audio/How%20to%20Stop%20Chasing%20Sleep.mp3',
    coverIcon: 'moon',
    coverImage: require('../assets/images/sleepcast-chasing-sleep.png'),
    tags: ['calm', 'ease', 'release'],
    text: `Hey there, its late.

If you're here with me, you've probably been trying to fall asleep for a while.

Maybe you've checked the time.

Maybe you've done that quiet math in your head:
If I fall asleep now I still get this many hours.

Let's put the maths down for tonight.

We're not going to chase sleep.

We're going to rest.

And if sleep wants to join us, it's welcome.
But it's not a test.

Take a slow breath in through your nose
and let it leave gently through your mouth.

Sleep isn't something you perform.

It isn't a skill you either pass or fail.

It's something your body already knows how to do,
when it feels safe enough.

Tonight, we're creating that sense of safety.
Softly. Gradually. No rush.

Notice how much pressure you've been putting on yourself to sleep well.

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

Your body has fallen asleep thousands of times before this night.

You don't need to supervise it.

You don't need to manage it.

You can step away from the control panel.

Let's give your nervous system a very simple signal of safety.

Inhale through your nose for a gentle count of four
1, 2, 3, 4

now, Exhale through your mouth for a count of six
1, 2, 3, 4, 5, 6

Again.

Inhale. 1, 2, 3, 4

Exhale. 1, 2, 3, 4, 5, 6

Longer exhales tell your body,
We're safe enough to soften.

If your mind says,
"Is it working? Am I getting sleepy yet?"
you can answer kindly:
"We're not trying to sleep. We're resting."

That's our only goal tonight. Resting.

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
notice it and gently let it drift downstream.

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

As we come toward the end of this sleepcast,
remember this:

You are not behind on sleep.

You are not failing at the night.

There is no scoreboard in the dark.

If sleep arrives while I'm talking,
let it take you.

If you're still awake,
stay with the feeling of being supported, instead of the idea that you should be doing more.

Let your thoughts grow a little fuzzier around the edge.

Let your body feel heavier.

Let your to-do list fade into tomorrow where it belongs.

I'll turn the volume of my voice down slowly now.

You can stay right here,
in this soft, in-between place
where nothing is required of you.

Sleep will find you when it's ready.

Until then, you're allowed to simply rest.`,
  },
  {
    id: 'sc-02',
    type: 'cast',
    title: "When Your Body is Tired but Your Mind Isn't",
    sub: 'Slowing a racing mind · 8 min 20 sec',
    desc: "For the nights when your body is exhausted but your thoughts won't stop moving. A slow drift down the quiet highway toward rest.",
    grad: ['#3a5688', '#5070a4', '#6888bc'],
    narrator: 'Clara',
    duration: '8 min 20 sec',
    durationSecs: 500,
    category: 'Sleepcast',
    videoUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/video/flower%20growing.mp4',
    audioUrl: "https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/audio/When%20Your%20Body%20is%20Tired%20but%20Your%20Mind%20Isn%27t.mp3",
    coverIcon: 'flower',
    coverImage: require('../assets/images/sleepcast-overstimulated.png'),
    lightVideo: true,
    tags: ['slow', 'drift', 'settle'],
    text: `When your body is tired but your mind isn't.

Your body is sending one clear message:
"I'm done for the day."

Heavy limbs.

Slow movements.

Eyes that want to close.

But your mind
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

From 70 down to 50.

The cars don't slam on the brakes.

They just cruise a little slower.

You might notice one of those cars carrying something familiar.

A conversation from earlier today.

A task you didn't finish.

A thought that seemed urgent at 2pm and still feels that way now.

You don't need to chase it.

You don't need to resolve it tonight.

Just watch it drive past.

Steady.

Unhurried.

After a while,
you lower the limit again.

From 50 down to 30.

They're still moving.

But now you can see more space between them.

Long stretches of quiet road.

Dark sky above.

No headlights coming toward you.

Just open road,
and cars that are in no rush to get anywhere.

Some of them are barely moving now.

Crawling forward.

And between each one
more silence.

More stillness.

More road with nothing on it at all.

Choose a word you'd like to ride on your exhale.

"Slow."

"Soft."

"Ease."

"Rest."

Whatever feels kind tonight.

Inhale gently
and as you exhale,
let that word drift out with your breath.

Slow.

Inhale again.

Exhale: Soft.

You're not commanding your mind.

You're just offering it somewhere quieter to land.

Inhale.

Ease.

Like placing a hand on the shoulder of something that's been working hard all day.

You don't have to push thoughts away.

You're just inviting them to move slower.

To take up less space.

To stop demanding answers right now.

Every exhale is a small act of letting go.

Not of everything.

Just of the urgency. The idea that something has to happen right now.

But nothing needs to happen right now.

You are already exactly where you need to be.

In this room.

In this body.

With this breath.

Inhale.

Rest.

Now, instead of focusing on the mind,
bring your attention all the way down to your feet.

Just notice them.

The weight of them.

The stillness of them.

They carried you today.

Every step.

Every errand.

Every room you walked into and out of.

Let them be heavy now.

Let them be done.

Move up to your calves.

Feel the muscle there.

Not tense.

Not working.

Just resting.

Your thighs.

Your hips.

All that held you upright today.

Let it all sink.

Feel your back against the mattress.

Notice how the mattress is doing the work now.

You don't have to hold yourself up anymore.

It's holding you.

Your shoulders.

Let them fall away from your ears.

Let them drop as far as they want to go.

Your arms.

Heavy.

Warm.

Your hands open.

Nothing to grip.

Nothing to do.

Your neck.

The back of your head cradled by the pillow.

Your jaw.

Let it soften.

Your eyes.

Not squeezing shut.

Just resting behind closed lids.

Your body is already in rest mode.

It knows the routine.

The mind is just late to the party.

As you feel each part of your body get heavier,
imagine your thoughts matching that pace.

Less sprinting.

More drifting.

They're still there.

But they're further away now.

Quieter.

Like voices heard from the next room.

Present.

But not demanding anything.

There's a particular kind of stillness that comes
just before sleep pulls you under.

You may have felt it before.

That moment when the thoughts soften at the edges.

When you're not quite here,
and not quite anywhere else.

Half in the room.

Half somewhere else entirely.

We're moving toward that place now.

Not forcing it.

Just making space for it.

Your breath continues on its own.

Slow.

Reliable.

In.

And out.

In.

And out.

You don't have to direct it.

Your body knows how to breathe without you.

It's been doing it your whole life.

Let it.

As we come toward the end,
remember this:

Your brain is doing what it was built to do.

Think.

Even at odd hours.

Even when you wish it wouldn't.

But thoughts don't have to move at full speed all the time.

You've nudged them into a slower gear tonight.

If they pick up again,
that's okay.

Gently bring them back down,
with your word on the exhale,
and the image of that quiet highway.

Cars with nowhere urgent to be.

A long road.

A dark sky.

Space between everything.

There is no race.

No deadline.

No perfect moment when you "should" have fallen asleep.

There's just this body,
in this bed,
on this night,
gradually softening.

If sleep comes,
let it take over completely.

Don't hold on.

Don't check whether it's happening.

Just let it arrive the way it always does,
quietly,
without announcement,
when you've stopped looking for it.

If it doesn't come just yet,
that's fine too.

You are still giving your body exactly what it needs:
a chance to be still.

A chance to be held by the night.

A chance to do nothing.

And that,
on its own,
is enough.`,
  },
  {
    id: 'sc-03',
    type: 'cast',
    title: "If You're Overthinking the Future",
    sub: 'Quieting overstimulation · 12 min 12 sec',
    desc: 'For the nights when your mind is still buzzing after a full day. A practice for turning the volume down, softening the nervous system, and drifting into rest.',
    grad: ['#8a4e6e', '#a66488', '#be7ca0'],
    narrator: 'Rainbird',
    duration: '12 min 12 sec',
    durationSecs: 732,
    category: 'Sleepcast',
    videoUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/video/snow.mp4',
    audioUrl: "https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/audio/If%20You%27re%20Overthinking%20the%20Future.mp3",
    coverIcon: 'snow',
    coverImage: require('../assets/images/sleepcast-overthinking.png'),
    lightVideo: true,
    tags: ['ground', 'peace', 'present'],
    text: `If You're Overthinking the Future.

Some nights,

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

Tonight is not for solving the future.

It's for resting the body that has to live it.

Let's come back to what is certain in this moment.

You are in a room.

There is a surface beneath you.

There is air around you.

There is fabric against your skin.

Notice the weight of the blanket.

The shape of the pillow beneath your head.

The way your chest rises and falls without you asking it to.

None of that belongs to tomorrow.

It all belongs to now.

This room exists right now.

This breath exists right now.

This stillness,

however imperfect,

exists right now.

Your mind may keep reaching forward.

That's what minds do.

They're built for anticipation.

For planning.

For trying to make sure you're ready.

But readiness doesn't come from thinking longer.

It comes from rest.

From a mind that has been allowed to stop rehearsing for one night.

So when a thought about tomorrow surfaces,

just say, quietly:

"Not tonight.

Tomorrow can wait."

You're not dismissing it.

You're not pretending it doesn't matter.

You're rescheduling it.

With intention.

Because you know it will still be there in the morning,

and you'll meet it better

having actually slept.

Now imagine every future thought is a small note.

"I need to sort that."

"What if this happens?"

"Don't forget to"

"What if it doesn't work out?"

"What will they think?"

Each one, written on a small piece of paper.

You don't have to tear them up.

You don't have to pretend they don't exist.

They're real.

They matter.

Just not right now.

So imagine taking each note,

one by one,

and folding it gently.

No urgency.

No drama.

Just a small, careful fold.

And placing it into a box.

A simple box.

Solid.

Reliable.

Big enough to hold all of it.

One note at a time.

The thing you're worried about saying.

In the box.

The plan that isn't quite settled.

In the box.

The conversation you keep rehearsing.

In the box.

The outcome you can't control.

In the box.

When you feel like you've placed in everything that's been circling,

close the lid.

Press it gently shut.

Now picture yourself carrying that box

to the bedroom door.

Not throwing it away.

Just setting it down,

just outside.

On the other side of the door.

It will be there in the morning.

Everything in it will still be there.

Not one thing will disappear overnight.

But it doesn't need to lie in bed with you.

It can wait in the hallway.

And you can be here,

in the room,

without it.

Bring your attention back to your breath.

Inhale slowly

longer than you think you need.

Exhale even more slowly.

Let the exhale be twice the length of the inhale.

In through the nose.

Out through the mouth.

Soft.

Unhurried.

You do not need all the answers tonight.

You do not need to be fully prepared for everything that might come.

You are allowed to be a work in progress

and still rest.

You are allowed to have unfinished things

and still sleep.

Most nights of your life,

you've slept without having everything figured out.

This night is no different.

If a new thought appears,

a new "what if,"

a new worry that squeezed through the gap,

just nod at it.

You see it.

You acknowledge it.

And you place it,

gently,

in that box outside the door.

Over and over, if needed.

As many times as it takes.

There's no limit.

The box is big enough.

And each time you place something in it,

you return here.

To this breath.

To this body.

To this room that is asking nothing of you.

Your only job right now

is to lie here,

and breathe,

and let your body know

that it is safe to relax

even when your life isn't perfectly organised.

Because it never will be perfectly organised.

And you will always deserve rest anyway.

As we come toward the end,

ask yourself one quiet question.

Not a hard question.

Not one that needs a long answer.

Just this:

"Right now,

in this exact minute,

am I safe enough to rest?"

Not for the whole year.

Not for the whole week.

Just this minute.

Right now.

The room around you.

The bed beneath you.

The breath moving in and out.

If the answer is even slightly yes,

then let that be your permission.

You don't need anything more resolved than that.

Let your muscles loosen,

a little more with each exhale.

Let your thoughts blur at the edges.

Let the future stay where you left it,

on the other side of that door,

in that quiet box,

waiting patiently.

You're not in tomorrow.

You're not fixing yesterday.

You are here,

in this room,

with this breath,

in this body,

right now.

And right now,

you are safe enough.

You are still enough.

You are allowed to rest

before everything is figured out.

Before every question has an answer.

Before every plan is perfectly in place.

You are allowed to rest

simply because you are tired,

and the night is here,

and your body is asking for it.

If sleep comes,

let it arrive without ceremony.

Let it switch off the noise,

gently,

without you noticing the exact moment it happens.

If it takes a little longer,

that's fine too.

You are still resting.

You are still giving yourself something valuable.

And that,

on its own,

is more than enough.`,
  },
  {
    id: 'sc-04',
    type: 'cast',
    title: "If You're Feeling Overstimulated",
    sub: 'Turning the volume down · 15 min 43 sec',
    desc: 'When your body is in bed but your nervous system is still somewhere out there. A gentle way to turn the volume down. No forcing, no fixing, just a gradual softening.',
    grad: ['#2e6878', '#4a8898', '#60a0b0'],
    narrator: 'Rainbird',
    duration: '15 min 43 sec',
    durationSecs: 943,
    category: 'Sleepcast',
    videoUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/video/leaves.mp4',
    audioUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/audio/If%20You%20Feel%20Overstimulated%20.mp3',
    coverIcon: 'leaf',
    coverImage: require('../assets/images/sleepcast-tired-mind.png'),
    lightVideo: true,
    tags: ['quiet', 'soften', 'unwind'],
    text: `Hey, you're tuned into Manas FM.

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
and let it out through your mouth,
a little more slowly than usual.

Overstimulation is not a flaw.
It simply means your brain and body processed a lot today.
A lot of sound.
A lot of colour.
A lot of input.
A lot of decisions, large and small,
that asked something of you
from the moment you woke up.

Your nervous system did its job.
It stayed alert.
It kept pace with everything the day threw at you.

And now it's here,
still humming,
still a few steps behind on the message
that the day is actually over.

We're going to help it receive that message.
Not by forcing it.
Not by telling it it's wrong for still running.
Just by gently, gradually,
giving it permission to slow down.

Now we invite everything to get just 10% quieter.
Not silent.
Just softer.

Imagine you're in a radio studio late at night.
The show is over.
The listeners have gone to bed.
Most of the equipment is off.
Just a few tiny lights are glowing across the dashboard.

Green.
Amber.
A soft, warm red in the corner.

There's a lamp on the desk casting a low, gentle light.
Nothing harsh.
Nothing demanding.
The kind of light that says: you can stop now.

You can hear a faint hum in the background.
Not loud.
Not intrusive.
Just the quiet sound of a room that's still alive,
but no longer performing.

That hum is your nervous system.
It's been on all day.
It did good work.
It doesn't need to vanish tonight.
It just needs to soften.

Inhale for a count of four.
One, Two, Three, Four.

Exhale for a count of six.
One, Two, Three, Four, Five, Six.

Each exhale is like sliding one switch a little lower on that studio board.
Not off.
Just down.

Let's do that again.

Inhale.
One, Two, Three, Four.

Exhale.
One, Two, Three, Four, Five, Six.

Feel the difference between breathing in
and breathing out.
The inhale wakes things up slightly.
The exhale is where the body lets go.

So we make the exhale longer.
We give the letting go more time than the holding.

Again.
In for four.
Out for six.

You don't need to count anymore if it feels mechanical.
Just know that your exhale should be longer,
slower,
softer
than your inhale.
Let that be the only rule.

Now imagine your body has a few dials of its own.
Not metaphors.
Actual physical places that hold tension,
when the day has been a lot.

Your shoulders.
Notice where they are right now.
Are they up near your ears?
Are they pulled forward?

Without forcing anything,
just let them fall.
A centimetre.
Two centimetres.
However far they want to go.

Your jaw.
Is it clenched?
Is there pressure in your back teeth?
Let your lips part, just slightly.
Let the jaw hang loose.

The little furrow between your eyebrows.
The place where concentration gathers.
Let it smooth out.

Not a performance of relaxation.
Just a genuine release of something
that no longer needs to be held.

You don't have to take these from 100 to zero.
That's not the goal.
Just ease them down a few notches.

From "high alert" to "just aware."
From "ready to respond" to "it can wait."
From "still in the day" to "beginning to leave it."

Scan down through your chest.
Is there tightness there?
Breathe into it.
Not to fix it.
Just to acknowledge it.

Your stomach.
Your hips.
Anywhere that's been braced without you realising.
Let it soften.

You've been carrying quite a lot in your body.
You can put some of it down now.

When you're overstimulated,
your thoughts often don't line up politely.
They overlap.
They interrupt each other.
They talk over one another,
all convinced they're the most urgent thing in the room.

That's okay.
You don't have to sort them.
You don't have to make them take turns.

Think of them as radio stations you're not fully tuned into.
Static.
Snippets of voices.
Fragments of music.
A conversation from this morning.
A notification you didn't answer.
A sound from earlier that's still echoing.

You don't have to pick one station to listen to.
You don't have to understand what any of them are saying.
You can let them all drift into the background
like signals from stations that are just slightly out of range.

Present.
But not pulling you anywhere.

If one thought pulls harder than the others,
if one station seems to cut through the static,
you don't have to argue with it.
You don't have to tell it it's wrong.

Just say, quietly:
"Not right now.
I'll think about you tomorrow."

No anger.
No fight.
Just a quiet boundary.
The kind you set with something you genuinely care about
but know isn't helping you right now.

And then come back.
Back to the studio.
Back to the soft light.
Back to the hum of a room
that is no longer performing.

Bring your attention now
to the parts of your body that are closest to the bed.

Your heels.
Feel the weight of them.
The pressure of the mattress underneath.

Your calves.
Heavy.
Warm.

The backs of your thighs.
Your hips.

Your spine,
long and supported,
each vertebra resting into the surface beneath you.

Your shoulders against the mattress or the pillow.
Your head.
Cradled.
Held.

Feel how each of those contact points is supported.
You are not floating.
You don't have to hold yourself up.
The mattress is doing all of that work.
You don't have to contribute anything to it.

Allow your legs to get heavier.
Not tense.
Just dense.
Like they're sinking a centimetre deeper into the bed.

Allow your arms to follow.
Your hands.
Your fingers.
Loose.
Open.
Nothing to grip.

You have carried yourself all day.
Through every room.
Every screen.
Every conversation.
Every demand.

You don't need to carry anything right now.

Let the softness underneath you
slowly absorb the weight of the day.
Like a sponge taking in water.
Quietly.
Without effort.
Just receiving.

As we come toward the end,
notice what has shifted.

Maybe the room feels a little quieter.
Maybe your body feels a little heavier.
Maybe your breath has found a steadier rhythm
without you having to manage it.
Maybe your mind is still a little active,
but not at the same volume as when you lay down.

That's enough.
That's more than enough.

Calm doesn't need to be perfect.
Stillness doesn't need to be complete.

You have already moved in the right direction:
from loud to softer.
From bright to dim.
From busy to slower.
From the day
to the edge of something quieter.

If sleep arrives,
let it take over completely.
Let it take the mic.
Let it fade the lights all the way down.
You won't need to do anything.
It will handle the rest.

If sleep takes a little longer,
stay here.
Stay with this feeling of quieter than before.

Your nervous system is still unwinding.
That process continues even now,
even as you listen,
even as you breathe.

You are doing enough
simply by lying here.
Simply by listening.
Simply by choosing to be still in the dark
and let the day
finally,
fully,
be over.`,
  },
  {
    id: 'sc-05',
    type: 'cast',
    title: 'Turning Down the Inner Critic',
    sub: 'Silencing self-criticism · 10 min',
    desc: "When your own voice is the loudest thing in the room. A compassionate way to turn down the self-critic's volume and find your way to rest. Without needing to have had a perfect day.",
    grad: ['#48508a', '#6068a8', '#7880c0'],
    narrator: 'Rainbird',
    duration: '10 min',
    durationSecs: 600,
    category: 'Sleepcast',
    videoUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/video/gramophone.mp4',
    audioUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/audio/Turning%20Down%20the%20Inner%20Critic.mp3',
    coverIcon: 'musical-notes',
    coverImage: require('../assets/images/sleepcast-inner-critic.png'),
    tags: ['gentle', 'acceptance', 'rest'],
    text: `Turning Down the Inner Critic.

Some nights,

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

Imagine that critical voice as a person

sitting in a chair across the room.

Not right on your pillow.

Not whispering directly into your ear.

Just over there.

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

That's often all the inner critic wants.

Not to be silenced.

Not to be argued with.

Just to be acknowledged.

So you've done that now.

You've turned toward it.

You've given it that small moment of being heard.

And now,

gently,

you let it know:

"I see you.

And tonight,

you can rest too."

Watch it settle back into its chair.

Shoulders dropping.

The tension in its face loosening.

It came here doing what it thought was its job.

But its shift is ending now.

And in the quiet that follows,

you notice how much more space there is in the room.

Now picture a friend

telling you the same story about their day

that you're telling yourself.

Same mistake.

Same awkward moment.

Same thing left undone.

What would you say to them?

You probably wouldn't list everything they got wrong.

You wouldn't run through the same moment four or five times

looking for where they failed.

You'd likely sit with them.

You'd say something like:

"That sounds like a hard day."

"You did what you could."

"You're allowed to let this go now."

And you'd mean it.

So let's borrow that tone.

Let's bring it into the room with you.

The same gentleness you'd offer to someone you love,

offered to yourself tonight.

You don't have to rewrite the day.

You don't have to fix it in your head before you sleep.

Instead of "I can't believe I did that,"

maybe just:

"Okay. That wasn't my best moment.

But I'm human.

And I'm learning.

And I showed up."

That's enough of a verdict for one night.

Let the case close.

Now imagine there's a dial on that inner voice.

It might be turned way up right now.

A nine or a ten.

Loud.

Insistent.

Convinced it needs to be heard.

Without forcing it,

just reach toward that dial.

And turn it down,

gently,

from 10 to 7.

You can still hear it.

But it's not filling the whole room anymore.

There's air around it.

Breathe that in.

After a few breaths,

turn it down again.

From 7 to 4.

More in the background.

Less in your face.

The words are getting harder to make out.

Like someone speaking from another room.

You know there's sound.

But you don't have to track every word.

You can let it talk to itself now.

From 4 down to 2.

Almost ambient now.

A low hum.

More like weather than words.

Present.

But not demanding.

Not in charge.

And as you breathe,

the spaces between your exhales

feel a little wider.

A little quieter.

The hum becomes something softer.

Something that doesn't need answering.

Here's something true:

You do not need to be perfectly at peace with your day

to deserve rest.

You do not need to have done everything right,

said every right thing,

felt every right feeling,

to be allowed to close your eyes.

Rest was never something you had to earn.

It was always just the next thing.

After effort, rest.

After trying, stillness.

After the long work of being a person today,

this.

A bed.

A quiet room.

A body that has carried you faithfully through the whole of it.

You are not a project.

You are not a problem to be solved before sleep is permitted.

You are a person who has lived through another day,

with all of its texture and imperfection,

and reached the part

where rest is simply what comes next.

Let your breath lengthen.

Let your muscles remember they don't have to hold anything anymore.

Let your jaw soften.

Your hands open.

Your eyes rest easily behind closed lids.

And if you want to send yourself

one final message before sleep arrives,

let it be something like this:

"I did enough today."

"I can try again tomorrow."

"I am allowed to rest now."

Not because you earned it.

Not because the day was perfect.

But because you're here.

And being here is enough.

The night has you.

The bed has you.

Let yourself be held by all of it.

Let the quiet do its work.

You don't have to do anything else.

You've done enough.

You are enough.

Rest now.`,
  },
  {
    id: 'sc-06',
    type: 'cast',
    title: "When You Feel Hollow But Don't Know Why",
    sub: 'Finding rest in the quiet · 15 min 15 sec',
    desc: "For the nights when nothing is specifically wrong, but something feels absent. A gentle companion for flatness, depletion, and the kind of quiet that is hard to explain.",
    grad: ['#5c4060', '#7a5880', '#9070a0'] as const,
    narrator: 'Rainbird',
    duration: '15 min 15 sec',
    durationSecs: 915,
    category: 'Sleepcast',
    videoUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/video/candles.mp4',
    audioUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/audio/When%20You%20Feel%20Hollow%20But%20Don%27t%20Know%20Why.mp3',
    coverIcon: 'moon',
    tags: ['hollow', 'soften', 'peace'],
    text: `Hey, you're tuned into Manas FM.

If you're here tonight,
you might be finding it hard to explain
exactly what's wrong.

It's not that your mind is racing.
It's not that you're anxious about something specific.
It's more like a quiet absence.
A kind of flatness.

Like someone turned the volume down
on your inner world,
and you're not sure when that happened,
or how to turn it back up.

If that's where you are tonight,
this one is for you.

Take a breath in.
Let it out slowly.

You don't have to name what you're feeling
to be allowed to rest.

First, something important.

That hollow feeling?
That blankness?
It's not a character flaw.
It's not a sign that something is broken in you.

It is your nervous system
doing something quite intelligent,
even if it doesn't feel that way.

When we've been under pressure for long enough,
when we've been holding things together,
showing up,
managing,
the system sometimes does something quiet and protective.

It pulls back.
It dims the lights a little.

Not to punish you.
Not because something is wrong with who you are.
But because you've been running at a level
that wasn't designed to be permanent.

And the emptiness,
strange as it sounds,
is a form of rest that your mind reached for
before your body could get there.

So tonight,
we're not going to try to fill the hollow.
We're not going to reach for feeling more.
We're just going to be here with the quiet.

And let your body do what it's been asking to do
for longer than you probably realise.

Let's start very simply.
With what's real in this moment.

The surface beneath you.
Feel it.
Not as a concept.
Actually feel the pressure of it
against the back of your legs.
Your lower back.
Your shoulders.

You are being held right now.
Physically.
By something solid.

Notice the temperature of the room.
Is it cool on your face?
Warm under the blanket?

Notice the weight of whatever is covering you.
Notice the sound of the room.
Even if it's quiet,
there's something.
A distant hum.
The sound of your own breath.

These things are real.
And you are here among them.

Even when the feelings feel far away,
the physical world doesn't leave.
It stays close.
Right underneath you.
Right around you.
You are in it.

Now I want you to do something very gentle.
Not a task.
Just a noticing.

Think back across today.
Not to evaluate it.
Not to judge how it went.
Just to acknowledge it happened.

You woke up.
You moved through the hours.
You made decisions, large and small.
You dealt with what was in front of you.
You kept going.

Even if "keeping going" looked like very little from the outside,
even if today was small and quiet by most measures,
there was effort in it.
There is always effort in it.

The effort of being a person.
Of continuing.
Of staying present in a world that keeps asking things of you.

You don't have to celebrate that tonight.
You don't have to turn it into something meaningful.
Just let it be true.

Today happened.
You were in it.
And now you're here.

That's the whole story of today,
and it's enough.

Let your breath find its own rhythm now.
Don't direct it.
Just watch it.

In.
And out.

Notice how it happens without you.
Your body has been breathing all day
without your instruction.
Through everything.
The flat moments.
The heavy ones.
The ones you don't remember.
It just kept going.

That steadiness is yours.
It lives in you.
Even on the days when nothing else feels steady.

Your chest rises.
Your chest falls.

The rhythm is quiet and reliable
and asking nothing of you tonight.

Let that be enough to follow.
Just this.

Breath in.
Breath out.

Sometimes the hollow feeling comes
because we've been living at a distance from ourselves for a while.
Not on purpose.
Just because life moves fast,
and staying connected to your own inner world
takes a kind of stillness
that busy days don't always allow.

So emotions get deferred.
Feelings get noted and set aside for later.
And after enough "laters,"
the access point gets quiet.
The signal gets faint.

You're not broken.
You're just backed up.

And rest,
real rest,
is how the system begins to process the backlog.

Not by forcing every feeling to the surface tonight.
Not by making sense of everything in the next hour.
But by giving your body and mind the conditions
where that quiet, invisible work can happen.

Sleep is one of the ways the brain restores itself emotionally.
During deep rest,
the mind re-processes what's been stored,
organises what's been deferred,
and gently restores access to feelings
that exhaustion had placed out of reach.

You don't have to do anything for that to happen.
You just have to be here.
Still.
Resting.
Letting it work.

Bring your attention slowly down through your body.
Starting at the top of your head.

Let your scalp soften.
Your forehead.

There's no expression needed tonight.
Let the face be blank if it wants to be.
That's allowed.

Your jaw.
Let the teeth part slightly.

Your throat.
Soft.

Your chest.
Rising and falling.
Notice any tightness there.
Breathe into it.
Not to fix it.
Just to let it know you see it.

Your stomach.
Let it loosen.

We hold so much there without realising.
Tension that came from trying.
From managing.
From keeping a version of ourselves presentable
while carrying something we couldn't quite name.

You can put that down now.

Your hips.
Your thighs.
Heavy.
Sinking.
Done with the day.

Your calves.
Your feet.
Let them fall outward.
Let them be finished.

Your whole body,
from head to feet,
horizontal now.
Resting.
Not performing.
Not preparing.
Not managing anything.
Just here.
In the quiet.

If the hollowness is still there,
that's okay.
You don't have to make it leave.
You don't have to understand it tonight.

Sometimes the most courageous thing
isn't to feel more,
but to be still
in the absence of feeling,
without spiralling into what it means.

It means you're tired.
It means you've been carrying more than you've said out loud.
It means your system is asking for something
that sleep can actually give it.

So let sleep give it.
Or let this stillness give it.

Whatever arrives tonight,
it will be more than nothing.

Because you're here.
Because you showed up for yourself tonight,
even in the flatness.
Especially in the flatness.

As we close,
I want to leave you with something simple.

You are allowed to feel nothing tonight.
You are allowed to lie here
without insight,
without breakthrough,
without a single emotional realisation.

Some nights are just quiet.

And quiet is not emptiness.
Quiet is a field after rain.
Still.
Receiving.
Getting ready for something
you won't be able to see
until morning.

Let your eyes stay closed.
Let the room be dark.
Let your breath keep doing its quiet work.

And let tonight be the night
your body got what it was asking for
all along.

Rest.
Real rest.
The kind that doesn't ask you to feel anything
except the weight of yourself
settling
into the dark.`,
  },
  {
    id: 'sc-07',
    type: 'cast',
    title: "When Big Change Is Coming and You Can't Settle",
    sub: 'Resting on the threshold · 16 min 43 sec',
    desc: "For the nights when something is shifting in your life and your mind won't stop scanning the horizon. A gentle way to rest the body while the future quietly forms.",
    grad: ['#6a3e48', '#885060', '#a06878'] as const,
    narrator: 'Rainbird',
    duration: '16 min 43 sec',
    durationSecs: 1003,
    category: 'Sleepcast',
    videoUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/video/flower%20growing.mp4',
    audioUrl: 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/sleep/sleepcasts/audio/When%20Big%20Change%20Is%20Coming%20and%20You%20Can%27t%20Settle.mp3',
    coverIcon: 'flower-outline',
    tags: ['threshold', 'steady', 'settle'],
    text: `Hey, you're tuned into Manas FM.

If you're here tonight,
you might be on the edge of something.
A new chapter.
A decision that's already been made.
A door opening,
or closing,
or both at the same time.

And your body is in bed,
but some part of you
is already standing in the doorway,
looking at what comes next,
trying to see further than the dark allows.

That restlessness has a name.
Anticipation.
And it is one of the most alert,
most wide-awake feelings a person can carry to bed.

So if that's where you are tonight,
I want you to know something first:
this isn't anxiety getting the better of you.
This is your brain doing exactly what it was built to do,
preparing for what's coming,
scanning the horizon,
running the calculations.
It's just doing it a few hours too late in the day.

Take a slow breath in.
Let it fall out.
We're going to give it somewhere to rest.

Here's what's worth understanding about the feeling of standing on the edge of change.

Your brain doesn't distinguish
between exciting uncertainty and frightening uncertainty
the way you might expect it to.

The uncertainty itself is what activates the alarm system,
not whether the thing coming is good or bad.
The brain treats the unknown
as something that needs solving.
And it pulls every available resource
toward that task.
Even at midnight.
Even when solving isn't possible yet.
Even when the unknown won't become known
until a day or a week or a month from now.

So the restlessness you feel tonight
isn't a sign that something is wrong.
It's a sign that your brain is taking the change seriously.
It cares about what's coming.
That caring is not a problem.
It's just misdirected energy.

And tonight,
we're going to very gently redirect it
somewhere that actually helps.

Let's start with the body.
Because the body is not on the edge of anything right now.
The body is here.
In this room.
In this bed.
On this night,
which has not yet become tomorrow.

Feel the surface beneath you.
The mattress holding the full weight of your back.
Your hips.
Your legs.

Notice the temperature.
The fabric against your skin.
The pillow beneath your head.

These things are not uncertain.
They are completely, reliably here.

And your body is among them,
in the present tense,
which is the only tense that exists right now.

Let your feet be heavy.
Let them be done with the day.
Let your calves soften.
Your thighs.
Your hips.

All the physical tension
that the anticipation has been storing
in places you didn't notice.

Let your lower back release.
Your spine,
long and supported.

Your shoulders.
Drop them.
However far they'll fall.

Your jaw.
Let it go.

Your forehead.
Smooth it.

Not because everything is resolved.
But because your body doesn't have to hold
what your mind is carrying.
They're allowed to operate differently tonight.
Your mind can still be on the edge.
Your body is allowed to rest.

Now let's spend a moment
with the change itself.
Not to think through it.
Not to plan or prepare or solve.
Just to acknowledge it honestly.

Something is shifting in your life.
Something real.
Something that matters enough
to keep you awake.
And that means something.

Most things that keep us awake at this hour
are things we care about deeply.

The change is coming
because something in your life
has outgrown the shape it was in.
Because you made a decision,
or a decision was made,
or circumstances moved
in a direction that asked something new of you.

And now you're here,
in the strange quiet between the old and the new.

This place has a name in many traditions.
The threshold.
The in-between.
The liminal space.

And it has always been uncomfortable.
Not because it is dangerous.
But because it is unfamiliar.
Because the mind,
which navigates by pattern and prediction,
doesn't have a complete map for what's ahead.
And it finds that hard.

That difficulty is not a warning sign.
It is simply the cost of moving forward.
And you are paying it.
Which means you are already in motion.
Already stepping through.

Let your breath become your anchor now.
When the mind reaches forward into what's coming,
breath brings it back.
Every time.

Inhale slowly.
Feel the chest expand.
Feel the belly rise.
Hold it for just a moment
at the top.

Then exhale.
Long.
Slow.
All the way out.
Until the lungs are empty and easy.

And then wait,
just a beat,
before the next one arrives.

In that pause
between the exhale and the next inhale,
there is a moment of complete stillness.
No past.
No future.
Just the body,
between one breath and the next.

Rest in that pause.
Even for a fraction of a second.
That is where tonight lives.
Not in what's coming.
Here.
Between one breath and the next.

Again.
Inhale.
Expand.
Hold.
Exhale.
All the way out.
Pause.

And again.

Your breath has been doing this your whole life.
Through every change you've ever navigated.
Through every chapter that ended
and every new one that began.
It was there on the other side of every transition
you were once sure you weren't ready for.
And it will be there on the other side of this one too.

Here is something true about big change
that is easy to forget at night.

You have been through transition before.
Not this specific one.
But the feeling of standing at the edge of something unknown
and not being able to see clearly to the other side.
You have felt that before.
And you got through it.

Not because you solved every uncertainty in advance.
Not because you planned your way out of every risk.
But because you moved forward anyway,
one day at a time,
gathering information as you went,
adjusting as the shape of things became clearer.

That is how change works.
It does not arrive fully formed and legible.
It reveals itself gradually.
And you are capable of meeting it that way.
You've proved it before.

Tonight you don't need to see the whole picture.
You only need to be here,
in this room,
resting a body that will need to be steady
when the change arrives.

There's one more thing worth saying
before we let sleep come.

The version of you on the other side of this change
will have things that the current version of you doesn't yet have.
Clarity.
Experience.
A new kind of knowing
that only comes from having moved through something
and come out the other side.

That version of you is already forming.
Even now.
Even tonight.
While you lie here,
your mind is quietly doing its invisible work.
Processing.
Integrating.
Getting ready in ways you won't be able to see
until you need them.

Sleep is part of that process.
Rest is not the opposite of preparation.
Rest is preparation.

The brain consolidates what it knows during sleep.
It files, organises, and integrates.
It builds the neural pathways
that tomorrow's version of you will walk.

So lying here tonight,
still and breathing,
is not time lost to the change.
It is time given to it.

The best thing you can do right now
for the person who has to walk through that door
is to rest the one who's standing in front of it.

Let your body be heavy now.
Let the mattress hold all of it.
The weight of the anticipation.
The weight of the not-knowing.
The weight of caring deeply about what comes next.

It can all be held by something outside of you tonight.
You don't have to grip it.
You don't have to carry it through the night.
It will be there in the morning.
The change will still be coming.

And you will meet it
more steadily,
more clearly,
more capably,
for having slept.

Let your eyes be still behind closed lids.
Let your breath find its own rhythm.
Let the room be dark.

Let tonight be the quiet before the new chapter.
The pause between one breath and the next.
The held moment.
The in-between.

It is enough to be here.
It is enough to be resting.

The change will arrive when it arrives.
And you will be ready.
You already are.`,
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
    tags: ['stillness', 'release', 'drift'],
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
    tags: ['restore', 'breathe', 'peace'],
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
    tags: ['float', 'flow', 'dream'],
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
    tags: ['flow', 'balance', 'rhythm'],
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
    desc: 'Sleep is not manufactured, it is allowed. This yoga nidra clears the way through sankalpa, a slow journey through every part of the body, and the dissolving of weight itself.',
    grad: ['#3c5470', '#546c88', '#6c84a0'] as const,
    narrator: '',
    duration: '20 min',
    durationSecs: 1200,
    category: 'Visual',
    tags: ['ground', 'center', 'stillness'],
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
    tags: ['fade', 'surrender', 'release'],
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
    tags: ['aware', 'present', 'detached'],
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
    tags: ['serene', 'tranquil', 'gentle'],
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
    tags: ['safe', 'warmth', 'cozy'],
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
    desc: 'The day is done. What you did was enough. As the body grows lighter and thoughts lose their edges, you cross the familiar border between waking and sleep, as you do every night.',
    grad: ['#3a4870', '#526488', '#6a7ca0'] as const,
    narrator: '',
    duration: '12 min',
    durationSecs: 720,
    category: 'Visual',
    tags: ['weightless', 'lightness', 'float'],
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
    desc: 'Let each out-breath take something with it. The day\'s decisions, friction, effort. It all flows out through the hands and feet until a soft, open space is all that remains.',
    grad: ['#3c4e62', '#547080', '#6c8898'] as const,
    narrator: '',
    duration: '10 min',
    durationSecs: 600,
    category: 'Visual',
    tags: ['release', 'lettinggo', 'ease'],
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
    tags: ['soften', 'calm', 'flow'],
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
    tags: ['ease', 'reset', 'unplug'],
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
    tags: ['loosen', 'soften', 'ease'],
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
    tags: ['unwind', 'restore', 'slow'],
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
    tags: ['ground', 'balance', 'loosen'],
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
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: activeTab === tab ? W1 : 'rgba(255,255,255,0.45)' }}>{tab}</Text>
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
              {featuredItem.coverImage ? (
                <>
                  <Image source={featuredItem.coverImage} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
                    style={{ flex: 1, padding: 18 }}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.9)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                          {typeLabel} · {featuredItem.duration}
                        </Text>
                      </View>
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="play" size={20} color={W1} style={{ marginLeft: 3 }} />
                      </View>
                    </View>
                    <View style={{ position: 'absolute', bottom: 18, left: 18, right: 72 }}>
                      <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 22, color: W1, marginBottom: 4 }} numberOfLines={1}>{featuredItem.title}</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(240,236,255,0.80)' }}>Recommended for tonight</Text>
                    </View>
                  </LinearGradient>
                </>
              ) : (
                <LinearGradient colors={featuredItem.grad} style={{ flex: 1, padding: 18 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.9)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                        {typeLabel} · {featuredItem.duration}
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
              )}
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
              {item.coverImage ? (
                <Image source={item.coverImage} style={{ width: 52, height: 52, borderRadius: 14 }} resizeMode="cover" />
              ) : (
                <LinearGradient colors={item.grad} style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  {item.coverIcon ? (
                    <Ionicons name={item.coverIcon as any} size={22} color="rgba(255,255,255,0.9)" />
                  ) : null}
                </LinearGradient>
              )}
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


function DetailView({ item, onBack, onPlay, onStretch }: {
  item: SleepItem;
  onBack: () => void;
  onPlay: () => void;
  onStretch: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { toggleFavourite, isFavourite } = useApp();
  const fav = isFavourite(item.id);
  const [showNarratorModal, setShowNarratorModal] = useState(false);
  const [selectedNarratorId, setSelectedNarratorId] = useState(
    () => SLEEP_NARRATORS.find(n => n.name === item.narrator)?.id ?? SLEEP_NARRATORS[0].id
  );
  const selectedNarrator = SLEEP_NARRATORS.find(n => n.id === selectedNarratorId) ?? SLEEP_NARRATORS[0];
  const isStretch = item.type === 'stretch';
  const hasCoverImage = !!item.coverImage;
  const tagLabel = item.type === 'cast' ? 'Sleepcast' : item.type === 'visual' ? 'Guided Visual' : 'Sleep Stretch';
  const tagColor = 'rgba(255,255,255,0.9)';
  const tagBg = 'rgba(255,255,255,0.14)';
  const tagBorder = 'rgba(255,255,255,0.25)';

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isStretch ? onStretch() : onPlay();
  };

  return (
    <View style={{ flex: 1, backgroundColor: SBG }}>
      {/* Hero image — full width, top ~45% of screen */}
      <View style={{ aspectRatio: 1, maxHeight: '50%', position: 'relative', overflow: 'hidden' }}>
        {hasCoverImage ? (
          <Image source={item.coverImage} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={item.grad} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
        {/* Soft bottom fade into page background */}
        <LinearGradient
          colors={['transparent', SBG]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
        />
        {/* Type badge — bottom-left of hero */}
        <View style={{ position: 'absolute', bottom: 20, left: 24 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, backgroundColor: tagBg, borderWidth: 1, borderColor: tagBorder }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: tagColor, letterSpacing: 1.2, textTransform: 'uppercase' }}>{tagLabel}</Text>
          </View>
        </View>

        {/* Floating nav buttons */}
        <View style={{ position: 'absolute', top: topInset + 8, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable
            onPress={onBack}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={20} color={W1} />
          </Pressable>
        </View>
      </View>

      {/* Content area */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 22 }}>
        {/* Title */}
        <Text style={{ fontFamily: 'Lora_700Bold_Italic', fontSize: 26, color: W1, lineHeight: 34, marginBottom: 10 }}>
          {item.title}
        </Text>
        {/* Description */}
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: W2, lineHeight: 22 }}>
          {item.desc}
        </Text>

        {/* Tags row — all types */}
        {item.tags && item.tags.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
            <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.3 }}>
              {item.tags.join('  ·  ')}
            </Text>
            <Pressable
              hitSlop={10}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleFavourite({ id: item.id, type: 'sleep', title: item.title, color: IRIS, icon: 'moon' });
              }}
            >
              <Ionicons name={fav ? 'star' : 'star-outline'} size={18} color={fav ? 'rgba(255,215,80,0.9)' : 'rgba(255,255,255,0.32)'} />
            </Pressable>
          </View>
        )}

        {/* Meta row: Duration | Narrator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: RIM }}>
          {/* Duration */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: RIM, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22 }}>
            <Ionicons name="time-outline" size={15} color={W2} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: W1 }}>{item.duration}</Text>
          </View>

          {/* Narrator pill (casts only) */}
          {item.type === 'cast' && !!item.narrator && (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNarratorModal(true); }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: RIM, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: RIM2 }}
            >
              <Ionicons name="mic-outline" size={14} color={W2} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: W1 }}>{selectedNarrator.name}</Text>
              <Ionicons name="chevron-down" size={13} color={W3} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Narrator bottom sheet modal */}
      <Modal visible={showNarratorModal} transparent animationType="fade" onRequestClose={() => setShowNarratorModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }} onPress={() => setShowNarratorModal(false)}>
          <View style={{ backgroundColor: '#12131e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: RIM2, alignSelf: 'center', marginBottom: 24 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: W3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>Choose Narrator</Text>
            {SLEEP_NARRATORS.map(n => (
              <Pressable
                key={n.id}
                onPress={() => { setSelectedNarratorId(n.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNarratorModal(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: RIM }}
              >
                <View style={{ gap: 3 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: W1 }}>{n.name}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: W3 }}>{n.desc}</Text>
                </View>
                {selectedNarratorId === n.id && <Ionicons name="checkmark-circle" size={20} color={W1} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Full-width Play button pinned at bottom */}
      <View style={{ paddingHorizontal: 20, paddingBottom: botInset + 16, paddingTop: 12 }}>
        <Pressable
          onPress={handlePlay}
          style={{ backgroundColor: 'rgba(255,255,255,0.93)', borderRadius: 50, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <Ionicons name="play" size={18} color="rgba(10,10,15,0.88)" />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: 'rgba(10,10,15,0.88)' }}>
            {item.type === 'cast' ? 'Begin Sleepcast' : item.type === 'visual' ? 'Begin Visualization' : 'Begin Stretch'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}



function PlayerView({ item, onBack }: { item: SleepItem; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { width: screenWidth } = useWindowDimensions();
  const { logWellnessSession } = useApp();

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

  // Track when the video is actually visible so adaptive theming only switches
  // to "light background" mode once the video frame has loaded, not immediately.
  const [videoBgActive, setVideoBgActive] = useState(false);

  useEffect(() => {
    if (!item.videoUrl || mode !== 'listen') {
      videoPlayer.pause();
      setVideoBgActive(false);
      return;
    }
    if (isPlaying) {
      const t = setTimeout(() => {
        videoPlayer.play();
        setVideoBgActive(true);
      }, 150);
      return () => clearTimeout(t);
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
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasAudio = !!item.audioUrl;

  // Load audio on mount if audioUrl exists
  useEffect(() => {
    if (!hasAudio) return;
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: item.audioUrl! },
          { shouldPlay: false, rate: speedRef.current, volume: 1.0 },
        );
        if (!mounted) { sound.unloadAsync(); return; }
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          const secs = (status.positionMillis ?? 0) / 1000;
          currentTimeRef.current = secs;
          setCurrentTime(secs);
          if (status.didJustFinish) {
            setIsPlaying(false);
            logWellnessSession('sleep', item.id, item.title, totalSecs);
          }
        });
      } catch (_) {}
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [hasAudio, item.audioUrl]);

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

  // Sync play/pause to audio or interval
  useEffect(() => {
    if (hasAudio) {
      if (soundRef.current) {
        if (isPlaying) {
          soundRef.current.playAsync().catch(() => {});
        } else {
          soundRef.current.pauseAsync().catch(() => {});
        }
      }
    } else {
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
    }
    return () => { if (!hasAudio && intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, hasAudio]);

  // Sync speed to audio
  useEffect(() => {
    soundRef.current?.setRateAsync(speed, true).catch(() => {});
  }, [speed]);

  const togglePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(p => !p);
  };

  const skip = (secs: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(0, Math.min(currentTimeRef.current + secs, totalSecs));
    currentTimeRef.current = next;
    setCurrentTime(next);
    if (hasAudio && soundRef.current) {
      soundRef.current.setPositionAsync(next * 1000).catch(() => {});
    }
  };

  const cycleSpeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeed(s => s === 1 ? 1.2 : s === 1.2 ? 1.5 : s === 1.5 ? 2 : 1);
  };

  const handleBack = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
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

  // Adaptive theme: light-bg videos get dark controls; dark-bg videos get white controls
  const isListenVideo = mode === 'listen' && !!item.videoUrl;
  const isLightBg = isListenVideo && !!item.lightVideo && videoBgActive;
  const fg1 = isLightBg ? 'rgba(15,15,20,0.90)' : W1;
  const fg2 = isLightBg ? 'rgba(15,15,20,0.65)' : W2;
  const fg3 = isLightBg ? 'rgba(15,15,20,0.42)' : W3;
  const fgTab = isLightBg ? 'rgba(15,15,20,0.52)' : 'rgba(255,255,255,0.45)';
  const btnBg = isLightBg ? 'rgba(15,15,20,0.10)' : 'rgba(255,255,255,0.10)';
  const playBg = isLightBg ? 'rgba(15,15,20,0.82)' : 'rgba(255,255,255,0.92)';
  const playIconColor = isLightBg ? W1 : 'rgba(15,15,20,0.88)';
  const tabContainerBg = isLightBg ? 'rgba(15,15,20,0.06)' : 'rgba(255,255,255,0.04)';
  const tabContainerBorder = isLightBg ? 'rgba(15,15,20,0.12)' : RIM;
  const tabSelBg = isLightBg ? 'rgba(15,15,20,0.12)' : 'rgba(255,255,255,0.12)';
  const tabSelBorder = isLightBg ? 'rgba(15,15,20,0.22)' : 'rgba(255,255,255,0.25)';
  const progressTrack = isLightBg ? 'rgba(15,15,20,0.14)' : RIM2;
  const progressFill = isLightBg ? 'rgba(15,15,20,0.72)' : W1;
  const videoOverlay = isLightBg ? 'rgba(255,255,255,0.04)' : 'rgba(4,4,14,0.35)';

  return (
    <View style={{ flex: 1, backgroundColor: SBG }}>
      {mode === 'listen' && item.videoUrl && (
        <>
          <VideoView
            style={StyleSheet.absoluteFill}
            player={videoPlayer}
            contentFit="fill"
            nativeControls={false}
            allowsFullscreen={false}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: videoOverlay }]} />
        </>
      )}
      <View style={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: btnBg, alignItems: 'center', justifyContent: 'center' }} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={fg2} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: 'Lora_700Bold_Italic', fontSize: 17, color: fg1, textAlign: 'center' }} numberOfLines={1}>{item.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: tabContainerBg, borderWidth: 1, borderColor: tabContainerBorder, borderRadius: 12, padding: 3 }}>
          {([
            { key: 'read' as SleepMode, label: 'Read' },
            { key: 'focus' as SleepMode, label: 'Focus' },
            { key: 'listen' as SleepMode, label: 'Listen' },
          ]).map(m => (
            <Pressable
              key={m.key}
              onPress={() => { setMode(m.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{
                flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center',
                backgroundColor: mode === m.key ? tabSelBg : 'transparent',
                borderWidth: 1, borderColor: mode === m.key ? tabSelBorder : 'transparent',
              }}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: mode === m.key ? fg1 : fgTab }}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {mode === 'listen' ? (
        <View style={{ flex: 1 }} />
      ) : (
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
          {paragraphs.map((para, pi) => {
            const isPast = pi < currentParaIdx;
            const isCurrent = pi === currentParaIdx;
            const isNext = pi === currentParaIdx + 1;
            const paraOpacity = isPast ? 0.18 : isNext ? 0.35 : 1;

            return (
              <View key={pi} style={{ marginBottom: 28, opacity: paraOpacity }} onLayout={e => { paraYPositions.current[pi] = e.nativeEvent.layout.y; }}>
                <Text style={{ fontFamily: isCurrent ? 'Lora_700Bold' : 'Lora_400Regular', fontSize: 19, lineHeight: 34, color: isCurrent ? W1 : W2 }}>
                  {para.words.join(' ')}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: fg3 }}>{timeLeft}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: fg3 }}>{totalDisplay}</Text>
        </View>
        <View style={{ height: 2, backgroundColor: progressTrack, borderRadius: 1 }}>
          <View style={{ height: 2, width: fillWidth, borderRadius: 1, backgroundColor: progressFill }} />
          {fillWidth > 0 && (
            <View style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: progressFill, top: -4, left: fillWidth - 5, shadowColor: progressFill, shadowOpacity: 0.6, shadowRadius: 4 }} />
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24, marginTop: 20, marginBottom: botPad + 20 }}>
        <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: btnBg, alignItems: 'center', justifyContent: 'center' }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="timer-outline" size={18} color={fg2} />
        </Pressable>
        <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: btnBg, alignItems: 'center', justifyContent: 'center' }} onPress={() => skip(-15)}>
          <Ionicons name="play-back" size={18} color={fg2} />
        </Pressable>
        <Reanimated.View style={playBtnStyle}>
          <Pressable onPress={togglePlay} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: playBg, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 12 }}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={playIconColor} style={{ marginLeft: isPlaying ? 0 : 3 }} />
          </Pressable>
        </Reanimated.View>
        <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: btnBg, alignItems: 'center', justifyContent: 'center' }} onPress={() => skip(15)}>
          <Ionicons name="play-forward" size={18} color={fg2} />
        </Pressable>
        <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: btnBg, alignItems: 'center', justifyContent: 'center' }} onPress={cycleSpeed}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: speed !== 1 ? fg1 : fg2 }}>{speed === 1 ? '1×' : `${speed}×`}</Text>
        </Pressable>
      </View>

      {toast !== null && (
        <View style={{ position: 'absolute', bottom: botPad + 90, alignSelf: 'center', backgroundColor: 'rgba(30,27,50,0.95)', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: RIM2 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: W1 }}>{toast}</Text>
        </View>
      )}


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

  return (
    <>
      {view === 'player' && activeItem ? (
        <PlayerView item={activeItem} onBack={goDetailFromPlayer} />
      ) : view === 'detail' && activeItem ? (
        <DetailView
          item={activeItem}
          onBack={goHome}
          onPlay={goPlayer}
          onStretch={() => openStretch(activeItem)}
        />
      ) : (
        <HomeView onSelect={goDetail} onBack={() => router.back()} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}


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
