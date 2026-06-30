import React, { useEffect, useRef, useState } from "react";
import { HiOutlinePauseCircle } from "react-icons/hi2";
import { IoPlayCircleOutline } from "react-icons/io5";

const AudioMessage = ({ audioSrc , duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      
    };

   

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const value = parseFloat(e.target.value);
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleSpeedChange = () => {
    const newRate = playbackRate === 2 ? 1.0 : playbackRate + 0.5;
    setPlaybackRate(newRate);
    audioRef.current.playbackRate = newRate;
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="flex items-center gap-3 w-full max-w-md">
      <button onClick={handlePlayPause} className="focus:outline-none cursor-pointer">
        {isPlaying ? (
          <HiOutlinePauseCircle className="text-white text-4xl" />
        ) : (
          <IoPlayCircleOutline className="text-white text-4xl" />
        )}
      </button>

      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          step="0.1"
          onChange={handleSeek}
          className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer transition-all duration-300
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:border 
            [&::-webkit-slider-thumb]:border-gray-400 
            [&::-webkit-slider-thumb]:shadow 
            [&::-moz-range-thumb]:bg-white"
        />

        <div className="flex justify-between text-sm text-white/80 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <button
        onClick={handleSpeedChange}
        className="text-white text-xs border border-white/40 cursor-pointer rounded-full px-2 py-1 hover:bg-white/20 transition"
      >
        ×{playbackRate.toFixed(1)}
      </button>

      <audio ref={audioRef} src={audioSrc} preload="metadata" />
    </div>
  );
};

export default AudioMessage;
