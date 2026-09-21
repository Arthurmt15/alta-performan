import TrackPlayer from 'react-native-track-player';
import { playbackService } from './src/services/audio/playerService';

// Registro obrigatório para playback em background (Android/iOS)
TrackPlayer.registerPlaybackService(() => playbackService);
