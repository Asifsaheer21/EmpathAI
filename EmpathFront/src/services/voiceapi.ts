export async function sendVoice(audio: Blob, language: 'en' | 'ml') {
  const formData = new FormData();
  formData.append('file', audio, 'voice.wav');
  formData.append('language', language);

  const token = localStorage.getItem('auth_token');

  const res = await fetch('http://127.0.0.1:8000/analyze/audio', {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  return res.json();
}
