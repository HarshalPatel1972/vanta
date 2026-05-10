"use client";

export class AudioAnalyser {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private stream: MediaStream | null = null;

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    const source = this.ctx.createMediaStreamSource(this.stream);
    source.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  getRMS(): number {
    if (!this.analyser || !this.dataArray) return 0;
    this.analyser.getByteFrequencyData(this.dataArray);
    const sum = this.dataArray.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / this.dataArray.length);
  }

  stop() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.ctx?.close();
  }
}
