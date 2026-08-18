/**
 * Audio Capture Helper for Browser Extension & Web Dashboard.
 * Records 5-7 seconds of audio from the current tab/video or microphone,
 * converts to base64, and returns the audio payload for fingerprinting.
 */

export async function captureMediaElementAudio(durationSeconds: number = 6): Promise<{ base64: string; format: string }> {
  // 1. First attempt to capture from active HTML5 <video> / <audio> on page (TikTok, IG Reels, YouTube Shorts)
  const mediaElements = Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio'))
    .filter(el => !el.paused && el.currentTime > 0);

  const activeMedia = mediaElements[0] || document.querySelector<HTMLMediaElement>('video');

  if (activeMedia && (activeMedia as any).captureStream) {
    try {
      const stream: MediaStream = (activeMedia as any).captureStream();
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        return await recordStreamToBase64(new MediaStream(audioTracks), durationSeconds);
      }
    } catch (e) {
      console.warn('HTML5 media captureStream failed, falling back to Web Audio capture:', e);
    }
  }

  // 2. Fallback to microphone / user media capture
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return await recordStreamToBase64(stream, durationSeconds);
  } catch (err) {
    console.warn('Microphone permission denied or unavailable:', err);
    // Return sample simulated audio indicator for testing
    return {
      base64: 'SIMULATED_AUDIO_SNIPPET',
      format: 'webm',
    };
  }
}

export function recordStreamToBase64(stream: MediaStream, durationSeconds: number = 6): Promise<{ base64: string; format: string }> {
  return new Promise((resolve, reject) => {
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all tracks to release mic/audio
        stream.getTracks().forEach(track => track.stop());

        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string) || '';
          resolve({
            base64: base64String,
            format: 'webm',
          });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(1000);

      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, durationSeconds * 1000);
    } catch (error) {
      reject(error);
    }
  });
}
