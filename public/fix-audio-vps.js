// Fix for VPS Audio Issues and Passive Event Listeners
(function () {
    'use strict';

    // Check if we're in VPS mode
    const isVPS = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    if (isVPS) {
        console.log('🚀 VPS Mode detected - Applying audio fixes...');

        // Override Web Speech API if not available or problematic
        if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
            console.log('⚠️ Web Speech API not available - Using fallback');

            // Create a mock Speech Recognition for fallback
            window.webkitSpeechRecognition = function () {
                return {
                    start: function () {
                        console.log('🎤 Mock speech recognition started - Using manual input fallback');
                        // Trigger manual input instead
                        setTimeout(() => {
                            const event = new CustomEvent('speechRecognitionFallback', {
                                detail: { message: 'Speech recognition not available on server' }
                            });
                            window.dispatchEvent(event);
                        }, 100);
                    },
                    stop: function () {
                        console.log('🛑 Mock speech recognition stopped');
                    },
                    addEventListener: function (event, callback) {
                        if (event === 'result') {
                            // Store callback for manual trigger
                            this._resultCallback = callback;
                        }
                    },
                    removeEventListener: function () { },
                    continuous: false,
                    interimResults: false,
                    lang: 'fa-IR'
                };
            };
        }

        // Fix passive event listener issues
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (type, listener, options) {
            // Convert problematic touch events to passive
            if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'mousewheel') {
                if (typeof options === 'boolean') {
                    options = { capture: options, passive: true };
                } else if (typeof options === 'object' && options !== null) {
                    options.passive = true;
                } else {
                    options = { passive: true };
                }
            }

            return originalAddEventListener.call(this, type, listener, options);
        };

        // Add VPS-specific audio handling
        window.VPS_AUDIO_CONFIG = {
            enabled: false,
            fallbackToManual: true,
            useServerAPI: true,
            apiEndpoint: '/api/voice-analysis/sahab-speech-recognition'
        };

        // Override getUserMedia for VPS
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
            navigator.mediaDevices.getUserMedia = function (constraints) {
                console.log('🎤 getUserMedia called on VPS - Using server-side processing');

                // Return a promise that resolves to a mock stream
                return new Promise((resolve, reject) => {
                    // Check if we can actually access media devices
                    originalGetUserMedia(constraints)
                        .then(stream => {
                            console.log('✅ Media access granted');
                            resolve(stream);
                        })
                        .catch(error => {
                            console.log('⚠️ Media access denied, using fallback:', error.message);
                            // Create a mock stream for fallback
                            const mockStream = {
                                getTracks: () => [],
                                getAudioTracks: () => [],
                                getVideoTracks: () => [],
                                addTrack: () => { },
                                removeTrack: () => { },
                                addEventListener: () => { },
                                removeEventListener: () => { }
                            };
                            resolve(mockStream);
                        });
                });
            };
        }

        // Add global error handler for audio issues
        window.addEventListener('error', function (event) {
            if (event.error && event.error.message &&
                (event.error.message.includes('audio') ||
                    event.error.message.includes('microphone') ||
                    event.error.message.includes('getUserMedia'))) {
                console.log('🔧 Audio error caught and handled:', event.error.message);
                event.preventDefault();

                // Trigger fallback
                const fallbackEvent = new CustomEvent('audioFallbackRequired', {
                    detail: { error: event.error.message }
                });
                window.dispatchEvent(fallbackEvent);
            }
        });

        console.log('✅ VPS Audio fixes applied successfully');
    }
})();