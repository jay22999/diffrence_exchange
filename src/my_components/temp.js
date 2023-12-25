const noti = () => {
  const audioElement = new Audio(beep);

  const playSound = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(audioContext.destination);

    audioElement.play();
  };
  playSound();
};

useEffect(() => {
  const interval = setInterval(() => {
    triggerRef.current.map((item) => {
      if (!mute_trigger_list.includes(item)) {
        noti();
      }
    });
  }, 1500);

  return () => {
    clearInterval(interval);
  };
}, []);
