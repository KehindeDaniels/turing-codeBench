import { useState, useEffect } from "react";

export const useTimer = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(seconds + 1);
      console.log("Timer updated:", seconds + 1);
    }, 1000);
    return () => clearInterval(interval);
  });

  return seconds;
};
