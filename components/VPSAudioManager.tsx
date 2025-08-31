import { useEffect, useRef, useState } from 'react';

const VPSAudioManager = ({ onAudioData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    // Check if we're running on VPS
    const isVPS = process.env.NEXT_PUBLIC_VPS_MODE === 'true';
    
    if (!isVPS) {
      console.log('Not running on VPS, using standard audio setup');
      return;
    }

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });

        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
          chunksRef.current = [];
          
          if (onAudioData) {
            onAudioData(audioBlob);
          }
        };

        console.log('✅ VPS Audio setup completed successfully');
      } catch (error) {
        console.error('🚫 Error setting up VPS audio:', error);
      }
    };

    initAudio();
  }, [onAudioData]);

  const startRecording = () => {
    if (mediaRecorderRef.current && !isRecording) {
      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log('🎤 Started recording on VPS');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('⏹️ Stopped recording on VPS');
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default VPSAudioManager;
