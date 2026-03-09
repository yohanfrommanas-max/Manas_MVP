import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useApp } from '@/context/AppContext';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import C from '@/constants/colors';

type Tab = 'Sleepcasts' | 'Visualizations' | 'Stretches';

const SLEEPCASTS = [
  {
    id: 'sc-library',
    title: 'The Old Library',
    desc: 'A quiet evening among towering shelves and the scent of old books.',
    narrator: 'James',
    duration: '45 min',
    color: '#6366F1',
    icon: 'book',
    story: `The door opens with a soft creak, and a breath of warm, paper-scented air rolls over you. Outside, rain falls in long quiet curtains against the tall windows. Inside, everything is amber. The library is vast — four floors of shelves rising into shadows, connected by wrought-iron staircases that spiral upward and disappear.

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
    title: 'Night Train to Nowhere',
    desc: 'Drift off to the gentle rumble of a sleeper train crossing dark countryside.',
    narrator: 'Sarah',
    duration: '38 min',
    color: '#969EFF',
    icon: 'time',
    story: `You are lying in the narrow bunk of a sleeper carriage. The sheets are crisp and cool where your feet slide between them, and soft and warm where your body has pressed them down. A small lamp above the window gives off the gentlest glow — just enough light to see the dark countryside rolling past in the window opposite.

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
    title: 'Lavender Fields',
    desc: 'A slow walk through Provence as the evening light fades warm and golden.',
    narrator: 'James',
    duration: '42 min',
    color: '#A78BFA',
    icon: 'flower',
    story: `The path begins at the edge of the village, past a low stone wall covered in climbing roses. The evening is warm — not hot, just the remnant warmth of a generous summer day — and the light has turned the colour of old gold. Long shadows fall from the cypress trees that line the road.

You walk slowly. There is no reason to hurry. The lavender fields begin at the next bend, and you know they will be there when you arrive, as they always are at this hour. You breathe in as you walk. The air has that particular quality it gets in Provence at evening — dry and herb-scented, with something floral underneath, like a promise.

Then you turn the corner and the fields open before you: row upon row of lavender, stretching to the foot of the limestone hills. The colour is extraordinary — deep violet at the tips, fading to silver-blue at the base — and the light catches it all sideways so that every row shimmers. A soft wind moves through the field and the whole landscape ripples like water.

The scent reaches you a moment later. It is clean and sweet and slightly medicinal, with something woody underneath. You breathe it in completely and hold it for a moment. The scent of lavender, you have read, slows the nervous system. You believe it. You feel something in your chest unknot.

You walk the path between two rows. The lavender brushes your hands as you pass. Bees move through the flowers with slow deliberation — they are full and unhurried at this hour, their work nearly done. The buzzing they make is low and continuous, more like a hum than a sound, more like a feeling than a hum.

At the far end of the path there is a stone bench beside an old olive tree. You sit on it. The wood is still warm from the afternoon sun. You face west, where the sky is burning in long stripes of rose and amber over the hills. The hills are very still. The village bell, far behind you, strikes once and lets the note dissolve into the air.

You remain here as the light fades. The sky moves through orange into rose into a deep soft blue. The first star appears above the eastern hills — a single white point, absolutely steady. The lavender darkens from violet to purple to a soft grey-blue. The bees are gone. The field is very quiet.

You are not sleepy in the way of exhaustion. You are sleepy in the way of total contentment — the feeling at the end of a perfect day when the body knows that what comes next is rest, well-earned and very near. You take one more slow breath of lavender and close your eyes.`,
  },
  {
    id: 'sc-shepherd',
    title: 'The Mountain Shepherd',
    desc: 'Follow a shepherd home as the first stars appear above a highland valley.',
    narrator: 'Sarah',
    duration: '50 min',
    color: '#818CF8',
    icon: 'cloudy-night',
    story: `The valley lies below you in a long twilight haze, the river a thin silver thread winding between dark hills. You have been walking since the afternoon, and now the path descends between heather and bracken toward the far end of the valley where a stone cottage sits with one lit window.

The air up here has weight to it — cool and clean and smelling of wet rock and wild thyme. The sheep move slowly ahead of you on the path, their wool catching the last grey light. They know the way. They have walked it every evening since spring, and they do not hurry.

The shepherd walks beside you without speaking. He is not unfriendly — he simply has nothing to add to this particular hour. He has walked this path a thousand times and knows that the evening requires nothing of you except your presence. A collie moves around the edges of the flock, head low, perfectly calm. Occasionally it glances at the shepherd for instruction. He gives none. Everything is in order.

As you descend, the stars begin to appear. First one — you always see the first one clearly, a single point above the eastern ridge. Then two. Then, gradually, the sky fills with them, the Milky Way emerging as a soft luminous band from north to south. Down in the valley, the first mist is gathering in the low ground, white and still.

The bell at the ewe's neck strikes softly with each step. The sound carries in the cool air. You find yourself walking in time with it — your feet finding the rhythm, your breathing settling into it. The path levels out and the cottage grows closer.

The shepherd opens the gate. The sheep file through one by one, pulling at the grass as they go, settling. The collie circles once and lies down at the gate. Its job is done. The shepherd pulls the gate closed and latches it.

He nods to you. You follow him to the cottage. Inside, it is warm — a fire, a wooden table, a lamp. He puts a pot on without a word. You sit beside the fire. The window shows nothing but the dark hillside and the stars above it, a dense scatter of white points, brilliant and absolutely still.

The pot begins to simmer. The fire crackles and settles. Outside, the sheep are quiet. The collie is somewhere in the dark, curled in the grass. The valley below holds its mist. The stars hold their positions. And you sit in the warmth of the cottage and let the evening close around you like a hand, and everything in you grows still.`,
  },
  {
    id: 'sc-beekeeper',
    title: "The Beekeeper's Garden",
    desc: "A summer garden at dusk — bees returning home, jasmine in the warm air.",
    narrator: 'Emma',
    duration: '35 min',
    color: '#F59E0B',
    icon: 'sunny',
    story: `The garden is at the end of its day, and it knows it. The sunflowers have turned their faces west where the light is going. The bees — dozens of them — are making their final runs through the lavender and the clover, their leg-baskets heavy with pollen, their movement slower and more deliberate now than it was at noon.

You are sitting in a hammock strung between two apple trees at the far end of the garden. It was warm here all afternoon, and now it is that particular temperature that asks nothing of you — not too warm, not cool enough to need a blanket, just exactly right. The hammock moves very slightly when you breathe.

The beekeeper is tending the hives at the garden's edge. She moves slowly and without urgency, her white suit luminous in the fading light. The bees circle her calmly. There is smoke from the smoker, a blue-grey thread drifting sideways and disappearing into the apple branches above you. It smells like cedar and something sweeter underneath.

The jasmine is beginning to open. It opens in the evenings, you remember — the white star-shaped flowers that stay closed all day and unfurl at dusk to release their scent into the cooling air. You smell it now, coming in soft waves when the air moves. It is the cleanest, sweetest smell in the world. You breathe it in slowly.

The last bees are returning to the hives. You can hear them — a low, diminishing sound as the garden empties of its visitors one by one. The sound of the hives changes as each forager lands and enters; it rises briefly with each arrival, then settles again, as if the hive is sighing. Each bee carries the whole afternoon with her — the flowers, the heat, the distances travelled. She goes inside and everything she carried becomes part of the collective warmth of the colony.

The light is leaving now in long horizontal streaks — rose and gold above the garden wall. A single swift cuts across the sky, impossibly fast, and is gone. The jasmine scent deepens as the air cools further. The hammock holds you. The apple tree is solid above you, its leaves going dark against the dimming sky.

The garden is very quiet now. A blackbird somewhere behind the wall gives its evening song — clear, unhurried, impossibly beautiful — and then stops. The hives make their low, steady sound. The jasmine breathes. The hammock barely moves. Your eyes grow heavy in the beautiful, warm, jasmine-scented dark.`,
  },
];

const VISUALIZATIONS = [
  {
    id: 'vis-forest',
    title: 'Forest Clearing',
    desc: 'A moonlit glade where silence holds you gently',
    duration: '12 min',
    color: '#6EE7B7',
    icon: 'leaf',
    narration: `Close your eyes and take three slow, deep breaths. With each exhale, let your body grow a little heavier, a little more still.

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
    title: 'Floating on Still Water',
    desc: 'Drift on a calm, warm lake as every thought dissolves',
    duration: '10 min',
    color: '#7DD3FC',
    icon: 'water',
    narration: `Close your eyes. Take a long, slow breath in through your nose. Hold it for just a moment. Now let it go, completely.

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
    title: 'Mountain Summit at Dawn',
    desc: 'Breathe cool air above a valley slowly waking below',
    duration: '15 min',
    color: '#D6AEFF',
    icon: 'cloud',
    narration: `Take a slow, full breath. As you inhale, imagine the air growing cooler, cleaner, thinner. You are very high up.

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
    title: 'Desert Night Sky',
    desc: 'Lie on warm sand beneath an infinite dome of stars',
    duration: '12 min',
    color: '#818CF8',
    icon: 'moon',
    narration: `Close your eyes and breathe out slowly. With each breath out, let your body become heavier, more settled, more still.

You are lying on warm desert sand. The sun set an hour ago but the sand still holds its heat, and it presses up against your back and legs in a warm, even embrace. Your body has formed a perfect impression in the fine grains. You are completely supported, completely still.

Above you is the most extraordinary sky you have ever seen.

There are no cities here, no lights at all — only the desert and the dark and the stars. They are beyond counting. The Milky Way stretches from one horizon to the other in a broad band of soft light — not the faint smear you see from a city, but a luminous river, white at the centre and deepening through blue to black at the edges. Individual stars pulse within it. Clusters gleam. And beyond the Milky Way, filling every remaining patch of sky, are more stars still — red giants, blue dwarfs, double stars that seem to breathe.

The desert around you is absolutely silent. There is no wind. No insects. No water. Only the soft sound of your own breathing, steady and slow, and the vast silence that surrounds it and holds it and makes it sound, somehow, like music.

Feel the warmth of the sand beneath you. It is the stored warmth of the day — the sun's energy held in ten million grains of silicon, released slowly into the cooling night, into you. You are being gently warmed by the sun, even now, hours after it set.

Look at the stars. There is no need to identify them or find patterns. Simply look. They are very far away and very old and they are nevertheless here, shining, for no reason other than that they are what they are. You are here for no reason other than that you are what you are. And in this place, at this hour, that is completely sufficient.

Breathe in the cool night air. Breathe out. A shooting star arcs across the upper sky and dissolves. The Milky Way turns imperceptibly above you. The sand holds you, warm and patient, in its perfect quiet, and you rest beneath the whole weight of the universe, which is, somehow, not heavy at all — only vast, and still, and full of light.`,
  },
  {
    id: 'vis-warmth',
    title: 'Warm Light Bath',
    desc: 'A golden light melts tension away, from crown to toe',
    duration: '8 min',
    color: '#F59E0B',
    icon: 'sunny',
    narration: `Take a breath in. And as you breathe out, close your eyes completely.

Imagine a light above you. It is golden — the colour of late afternoon sun filtered through thin curtains, the colour of honey held up to a lamp. It is warm without being hot. It is completely safe. It exists only to soften whatever it touches.

The light begins at the crown of your head. Feel it there — a warmth, a slight pressure, as if a warm hand has been placed gently on top of your head. Let it rest there. And now feel it beginning to move downward, slowly, like warm oil, like sunlight moving through water.

It moves into your forehead. Any tension here — between your brows, across your temples — begins to soften. Let it go. Your forehead smooths. The muscles around your eyes release. Your eyelids grow heavier, which is fine, which is welcome.

The warmth moves into your jaw. So much tension lives here — the tension of conversations, of held-back words, of teeth pressed together through the day. Let your jaw drop, just slightly. Let the back teeth part. Let the tongue rest softly in the bottom of your mouth. The golden light dissolves what was held there and carries it away.

Down into your neck. Into your shoulders. This is where so many people carry the day — hunched forward, raised toward the ears, holding everything. Feel the warmth settle here. Feel the shoulders soften and drop — not forced, not effortful, just released. Let them fall to where they belong, lower than you expected, wider than you thought. This is where they want to rest.

The light continues downward. Into your chest, where your heart beats steadily and without hurry. Into your abdomen, which softens and expands with each breath. Into your lower back, where tension pools like water in a basin — and now the golden light reaches it and it dissolves, warmly, without effort.

Into your hips. Your thighs. Your knees and calves. Your ankles. And finally, into the soles of your feet, where the light gathers for a moment and pulses once, gently — and then the whole body is warm, the whole body is held, the whole body is gold.

You have released what was not yours to carry. What remains is only you, resting, warm and completely still, in the light that has been waiting for you all day.`,
  },
];

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

function WaveAnimation({ color }: { color: string }) {
  const w1 = useSharedValue(1);
  const w2 = useSharedValue(1);
  const w3 = useSharedValue(1);
  React.useEffect(() => {
    w1.value = withRepeat(withSequence(withTiming(1.3, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1);
    w2.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(1.3, { duration: 1200 }), withTiming(1, { duration: 600 })), -1);
    w3.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(1.2, { duration: 1200 }), withTiming(1, { duration: 900 })), -1);
  }, []);
  const s1 = useAnimatedStyle(() => ({ transform: [{ scaleY: w1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scaleY: w2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ scaleY: w3.value }] }));
  return (
    <View style={styles.waveRow}>
      {[s1, s2, s3, s2, s1].map((s, i) => (
        <Reanimated.View key={i} style={[styles.waveBar, s, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

function ReaderModal({ visible, item, color, onClose }: {
  visible: boolean;
  item: { title: string; story?: string; narration?: string } | null;
  color: string;
  onClose: () => void;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [visible]);

  if (!item) return null;
  const text = item.story ?? item.narration ?? '';

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
        <LinearGradient colors={[color + '30', '#0D0F14']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.4 }} />
        <View style={readerStyles.handle} />
        <View style={readerStyles.header}>
          <Text style={readerStyles.title}>{item.title}</Text>
          <View style={readerStyles.headerBtns}>
            <Pressable
              style={[readerStyles.audioBtn, { backgroundColor: isSpeaking ? color + '40' : color + '20', borderColor: color + '60' }]}
              onPress={handleSpeak}
            >
              <Ionicons
                name={isSpeaking ? 'pause-circle-outline' : 'volume-high-outline'}
                size={18}
                color={color}
              />
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
        <ScrollView
          style={readerStyles.scroll}
          contentContainerStyle={readerStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {text.split('\n\n').map((para, i) => (
            <Text key={i} style={readerStyles.para}>{para.trim()}</Text>
          ))}
          <View style={readerStyles.endMark}>
            <Text style={readerStyles.endMarkText}>— end —</Text>
          </View>
        </ScrollView>
        <LinearGradient
          colors={['transparent', '#0D0F14']}
          style={readerStyles.bottomFade}
          pointerEvents="none"
        />
      </SafeAreaView>
    </Modal>
  );
}

function StretchModal({ stretch, onClose, onComplete }: {
  stretch: typeof STRETCHES[0] | null;
  onClose: () => void;
  onComplete: () => void;
}) {
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
        <LinearGradient colors={[stretch.color + '30', '#0D0F14']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }} />
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

            <Pressable
              style={[stretchModalStyles.nextBtn, { backgroundColor: stretch.color }]}
              onPress={advance}
            >
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

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite, addWellnessMinutes } = useApp();
  const { play, stop } = useAmbientAudio();
  const [activeTab, setActiveTab] = useState<Tab>('Sleepcasts');
  const [playing, setPlaying] = useState<string | null>(null);
  const [readerItem, setReaderItem] = useState<typeof SLEEPCASTS[0] | typeof VISUALIZATIONS[0] | null>(null);
  const [readerVisible, setReaderVisible] = useState(false);
  const [activeStretch, setActiveStretch] = useState<typeof STRETCHES[0] | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const togglePlay = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playing === id) {
      stop();
      setPlaying(null);
    } else {
      play(id);
      setPlaying(id);
      addWellnessMinutes(1);
    }
  };

  const stopAll = () => { stop(); setPlaying(null); };

  const openReader = (item: typeof SLEEPCASTS[0] | typeof VISUALIZATIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReaderItem(item);
    setReaderVisible(true);
  };

  const openStretch = (str: typeof STRETCHES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveStretch(str);
  };

  const onStretchComplete = () => {
    if (activeStretch) {
      addWellnessMinutes(parseInt(activeStretch.duration));
    }
  };

  const playingCast = SLEEPCASTS.find(s => s.id === playing) ?? VISUALIZATIONS.find(v => v.id === playing);
  const TABS: Tab[] = ['Sleepcasts', 'Visualizations', 'Stretches'];

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#1A1B4B', '#0D1025', C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => { stopAll(); router.back(); }}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Sleep</Text>
          <View style={{ width: 40 }} />
        </View>

        {playing && playingCast ? (
          <View style={styles.nowPlaying}>
            <LinearGradient colors={[playingCast.color + '25', C.card]} style={StyleSheet.absoluteFill} />
            <View style={[styles.nowPlayingIcon, { backgroundColor: playingCast.color + '20' }]}>
              <Ionicons name={playingCast.icon as any} size={28} color={playingCast.color} />
            </View>
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingLabel}>Now Playing</Text>
              <Text style={styles.nowPlayingName}>{playingCast.title}</Text>
            </View>
            <WaveAnimation color={playingCast.color} />
            <Pressable onPress={stopAll} style={styles.stopBtn}>
              <Ionicons name="stop" size={18} color={C.text} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.hero}>
            <Ionicons name="moon" size={52} color="#818CF8" />
            <Text style={styles.heroTitle}>Rest & Restore</Text>
            <Text style={styles.heroSub}>Stories, visuals and stretches for deep, restorative sleep</Text>
          </View>
        )}

        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <Pressable
              key={tab}
              style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
              onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'Sleepcasts' && (
          <View style={styles.castList}>
            {SLEEPCASTS.map(cast => {
              const isPlaying = playing === cast.id;
              const fav = isFavourite(cast.id);
              return (
                <View key={cast.id} style={[styles.castCard, isPlaying && { borderColor: cast.color + '80' }]}>
                  <LinearGradient colors={[cast.color + '30', cast.color + '10', C.card]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <View style={styles.castTop}>
                    <View style={[styles.castIcon, { backgroundColor: cast.color + '25' }]}>
                      <Ionicons name={cast.icon as any} size={28} color={cast.color} />
                    </View>
                    <View style={styles.castMeta}>
                      <View style={styles.narratorTag}>
                        <Ionicons name="mic" size={11} color={C.textMuted} />
                        <Text style={styles.narratorText}>{cast.narrator}</Text>
                      </View>
                      <View style={styles.durationTag}>
                        <Ionicons name="time-outline" size={11} color={C.textMuted} />
                        <Text style={styles.durationText}>{cast.duration}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => toggleFavourite({ id: cast.id, type: 'sleep', title: cast.title, color: cast.color, icon: cast.icon })} hitSlop={8}>
                      <Ionicons name={fav ? 'star' : 'star-outline'} size={18} color={fav ? C.gold : C.textMuted} />
                    </Pressable>
                  </View>
                  <Text style={styles.castTitle}>{cast.title}</Text>
                  <Text style={styles.castDesc}>{cast.desc}</Text>
                  <View style={styles.castBtnRow}>
                    <Pressable
                      style={[styles.castReadBtn, { borderColor: cast.color + '50' }]}
                      onPress={() => openReader(cast)}
                    >
                      <Ionicons name="book-outline" size={14} color={cast.color} />
                      <Text style={[styles.castReadText, { color: cast.color }]}>Read Story</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.castPlayBtn, { backgroundColor: isPlaying ? cast.color : cast.color + '25', flex: 1 }]}
                      onPress={() => togglePlay(cast.id)}
                    >
                      {isPlaying && <WaveAnimation color={C.bg} />}
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color={isPlaying ? C.bg : cast.color} />
                      <Text style={[styles.castPlayText, { color: isPlaying ? C.bg : cast.color }]}>
                        {isPlaying ? 'Pause' : 'Play'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'Visualizations' && (
          <View style={styles.visList}>
            {VISUALIZATIONS.map(vis => {
              const isPlaying = playing === vis.id;
              const fav = isFavourite(vis.id);
              return (
                <View key={vis.id} style={[styles.visCard, isPlaying && { borderColor: vis.color }]}>
                  {isPlaying && <LinearGradient colors={[vis.color + '25', C.card]} style={StyleSheet.absoluteFill} />}
                  <View style={styles.visTop}>
                    <View style={[styles.visIcon, { backgroundColor: vis.color + '20' }]}>
                      <Ionicons name={vis.icon as any} size={24} color={vis.color} />
                    </View>
                    <View style={styles.visMeta}>
                      <View style={styles.visDuration}>
                        <Ionicons name="time-outline" size={11} color={C.textMuted} />
                        <Text style={styles.visDurationText}>{vis.duration}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => toggleFavourite({ id: vis.id, type: 'sleep', title: vis.title, color: vis.color, icon: vis.icon })} hitSlop={8}>
                      <Ionicons name={fav ? 'star' : 'star-outline'} size={16} color={fav ? C.gold : C.textMuted} />
                    </Pressable>
                  </View>
                  <Text style={styles.visTitle}>{vis.title}</Text>
                  <Text style={styles.visDesc}>{vis.desc}</Text>
                  <View style={styles.visBtnRow}>
                    <Pressable
                      style={[styles.visReadBtn, { borderColor: vis.color + '50' }]}
                      onPress={() => openReader(vis)}
                    >
                      <Ionicons name="book-outline" size={13} color={vis.color} />
                      <Text style={[styles.visReadText, { color: vis.color }]}>Read Guide</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.visPlayBtn, { backgroundColor: isPlaying ? vis.color : vis.color + '25', flex: 1 }]}
                      onPress={() => togglePlay(vis.id)}
                    >
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={13} color={isPlaying ? C.bg : vis.color} />
                      <Text style={[styles.visPlayText, { color: isPlaying ? C.bg : vis.color }]}>
                        {isPlaying ? 'Pause' : 'Begin'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'Stretches' && (
          <View style={styles.stretchGrid}>
            <View style={styles.stretchIntro}>
              <Ionicons name="moon" size={14} color={C.textMuted} />
              <Text style={styles.stretchIntroText}>Wind down. Breathe. Release.</Text>
            </View>
            {STRETCHES.map(str => {
              const fav = isFavourite(str.id);
              const isEasy = str.difficulty === 'Easy';
              return (
                <View key={str.id} style={styles.stretchCard}>
                  <LinearGradient
                    colors={[str.color + '55', str.color + '20', '#0D0F14']}
                    style={styles.stretchCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.stretchCardTopRow}>
                    <View style={[styles.stretchCardIcon, { backgroundColor: str.color + '30', borderColor: str.color + '50' }]}>
                      <Ionicons name={str.icon as any} size={32} color={str.color} />
                    </View>
                    <View style={styles.stretchCardBadges}>
                      <View style={[styles.stretchDiffBadge, { backgroundColor: isEasy ? C.sage + '25' : C.gold + '25' }]}>
                        <Text style={[styles.stretchDiffText, { color: isEasy ? C.sage : C.gold }]}>{str.difficulty}</Text>
                      </View>
                      <Pressable
                        onPress={() => toggleFavourite({ id: str.id, type: 'sleep', title: str.title, color: str.color, icon: str.icon })}
                        hitSlop={8}
                        style={[styles.stretchFavBtn, { backgroundColor: fav ? C.gold + '20' : C.card }]}
                      >
                        <Ionicons name={fav ? 'star' : 'star-outline'} size={15} color={fav ? C.gold : C.textMuted} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.stretchCardBody}>
                    <Text style={styles.stretchCardTitle}>{str.title}</Text>
                    <Text style={styles.stretchCardDesc}>{str.desc}</Text>

                    <View style={styles.stretchCardStats}>
                      <View style={[styles.stretchStat, { borderColor: str.color + '30', backgroundColor: str.color + '12' }]}>
                        <Ionicons name="time-outline" size={12} color={str.color} />
                        <Text style={[styles.stretchStatText, { color: str.color }]}>{str.duration}</Text>
                      </View>
                      <View style={[styles.stretchStat, { borderColor: str.color + '30', backgroundColor: str.color + '12' }]}>
                        <Ionicons name="layers-outline" size={12} color={str.color} />
                        <Text style={[styles.stretchStatText, { color: str.color }]}>{str.steps} poses</Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.stretchBeginBtn, { backgroundColor: str.color }]}
                    onPress={() => openStretch(str)}
                  >
                    <Ionicons name="play" size={16} color={C.bg} />
                    <Text style={styles.stretchBeginText}>Begin Session</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ReaderModal
        visible={readerVisible}
        item={readerItem}
        color={(readerItem as any)?.color ?? C.lavender}
        onClose={() => setReaderVisible(false)}
      />

      <StretchModal
        stretch={activeStretch}
        onClose={() => setActiveStretch(null)}
        onComplete={onStretchComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },

  nowPlaying: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  nowPlayingIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nowPlayingInfo: { flex: 1, gap: 2 },
  nowPlayingLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  nowPlayingName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 4, height: 18, borderRadius: 2 },
  stopBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  heroTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text },
  heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 20 },

  tabRow: { flexDirection: 'row', gap: 8 },
  tabPill: { flex: 1, paddingVertical: 10, borderRadius: 100, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tabPillActive: { backgroundColor: '#818CF8' + '25', borderColor: '#818CF8' },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub },
  tabTextActive: { color: '#818CF8', fontFamily: 'Inter_600SemiBold' },

  castList: { gap: 14 },
  castCard: { borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, gap: 10, overflow: 'hidden', backgroundColor: C.card },
  castTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  castIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  castMeta: { flex: 1, gap: 6 },
  narratorTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  narratorText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  durationTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  castTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -0.3 },
  castDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 20 },
  castBtnRow: { flexDirection: 'row', gap: 10 },
  castReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, backgroundColor: 'transparent' },
  castReadText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  castPlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14 },
  castPlayText: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  visList: { gap: 14 },
  visCard: { borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, gap: 10, overflow: 'hidden', backgroundColor: C.card },
  visTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  visIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  visMeta: { flex: 1 },
  visDuration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  visDurationText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  visTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -0.2 },
  visDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 20 },
  visBtnRow: { flexDirection: 'row', gap: 10 },
  visReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  visReadText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  visPlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  visPlayText: { fontSize: 13, fontFamily: 'Inter_700Bold' },

  stretchGrid: { gap: 16 },
  stretchIntro: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 4 },
  stretchIntroText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, fontStyle: 'italic' },

  stretchCard: { borderRadius: 24, borderWidth: 1, borderColor: C.border, overflow: 'hidden', backgroundColor: C.card, padding: 20, gap: 18 },
  stretchCardGradient: { ...StyleSheet.absoluteFillObject },
  stretchCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stretchCardIcon: { width: 68, height: 68, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stretchCardBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stretchDiffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  stretchDiffText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  stretchFavBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  stretchCardBody: { gap: 10 },
  stretchCardTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -0.5 },
  stretchCardDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 22 },
  stretchCardStats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stretchStat: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  stretchStatText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  stretchBeginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  stretchBeginText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.bg },
});

const readerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F14' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.text, flex: 1, paddingRight: 12, letterSpacing: -0.5 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  audioBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  speakingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  speakingText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 8, gap: 0 },
  para: { fontSize: 16, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)', lineHeight: 30, marginBottom: 22 },
  endMark: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  endMarkText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, fontStyle: 'italic' },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});

const stretchModalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F14' },
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
});
