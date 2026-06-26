// Sound notification service
class SoundService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    // Preload sounds
    this.loadSound('randevuOlusturuldu', '/asset/randevuolusturuldu.mp3');
    this.loadSound('randevuGeldi', '/asset/randevugeldi.mp3');
    this.loadSound('randevuIptal', '/asset/randevuıptaloldu.mp3');
  }

  private loadSound(key: string, path: string) {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.7; // 70% volume
      this.sounds.set(key, audio);
    } catch (error) {
      console.error(`Failed to load sound: ${key}`, error);
    }
  }

  play(soundKey: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(soundKey);
    if (sound) {
      // Reset to start if already playing
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.error(`Failed to play sound: ${soundKey}`, error);
      });
    }
  }

  // Play appointment created sound
  playAppointmentCreated() {
    this.play('randevuOlusturuldu');
  }

  // Play appointment received sound (for salon owner)
  playAppointmentReceived() {
    this.play('randevuGeldi');
  }

  // Play appointment cancelled sound
  playAppointmentCancelled() {
    this.play('randevuIptal');
  }

  // Play notification sound (for restaurant orders)
  playNotification() {
    this.play('randevuGeldi'); // Aynı ses dosyasını kullanıyoruz
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const soundService = new SoundService();
