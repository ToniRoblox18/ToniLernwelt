
import { DBService } from './dbService';

export class AudioCacheService {
  static async set(key: string, buffer: AudioBuffer): Promise<void> {
    return DBService.saveAudio(key, buffer);
  }

  static async get(key: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    return DBService.getAudio(key, ctx);
  }
}
