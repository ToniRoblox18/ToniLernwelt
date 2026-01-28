
import { TaskModel } from '../model/TaskModel';

export class AudioCacheService {
  static async set(key: string, buffer: AudioBuffer): Promise<void> {
    return TaskModel.saveAudio(key, buffer);
  }

  static async get(key: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    return TaskModel.getAudio(key, ctx);
  }
}
