import { ImageSourcePropType } from 'react-native';
import type { ImageAssetKey } from './journalPrompts';

export const JOURNAL_IMAGES: Record<ImageAssetKey, ImageSourcePropType> = {
  focus_1: require('@/assets/journal/focus_1.jpg'),
  focus_2: require('@/assets/journal/focus_2.jpg'),
  body_1: require('@/assets/journal/body_1.jpg'),
  body_2: require('@/assets/journal/body_2.jpg'),
  letting_1: require('@/assets/journal/letting_1.jpg'),
  letting_2: require('@/assets/journal/letting_2.jpg'),
  connection_1: require('@/assets/journal/connection_1.jpg'),
  connection_2: require('@/assets/journal/connection_2.jpg'),
  effort_1: require('@/assets/journal/effort_1.jpg'),
  effort_2: require('@/assets/journal/effort_2.jpg'),
  stillness_1: require('@/assets/journal/stillness_1.jpg'),
  stillness_2: require('@/assets/journal/stillness_2.jpg'),
};
