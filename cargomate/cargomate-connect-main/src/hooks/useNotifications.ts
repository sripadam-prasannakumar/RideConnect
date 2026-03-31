import { useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const statusMessages: Record<string, { title: string; desc: (b: any) => string; icon: string }> = {
  accepted: {
    title: "🚗 Driver Assigned!",
    desc: (b) => `${b.driverName || "A driver"} is heading to pick up your package`,
    icon: "🚗",
  },
  picked_up: {
    title: "📦 Package Picked Up!",
    desc: (b) => `Your package from ${b.pickup} is now in transit`,
    icon: "📦",
  },
  in_progress: {
    title: "🚛 On The Way!",
    desc: (b) => `Your delivery is heading to ${b.drop}`,
    icon: "🚛",
  },
  completed: {
    title: "✅ Delivered!",
    desc: (b) => `Your package has been delivered to ${b.drop}. Rate your experience!`,
    icon: "✅",
  },
  cancelled: {
    title: "❌ Booking Cancelled",
    desc: (b) => `Your booking from ${b.pickup} → ${b.drop} was cancelled`,
    icon: "❌",
  },
};

// Play a notification sound
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1); // ~C#6
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
};

// Vibrate device
const vibrateDevice = (pattern: number[]) => {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration not supported
  }
};

// Speak notification
const speakNotification = (text: string) => {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech not available
  }
};

export const useNotifications = () => {
  const { user, userProfile } = useAuth();
  const prevStatuses = useRef<Record<string, string>>({});
  const initialized = useRef(false);

  useEffect(() => {
    if (!user) return;

    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const isRider = userProfile?.role === "rider";

      Object.entries(data).forEach(([id, val]: [string, any]) => {
        // Customer notifications: their own bookings
        // Rider notifications: bookings assigned to them
        const isRelevant = isRider
          ? val.driverId === user.uid
          : val.userId === user.uid;

        if (!isRelevant) return;

        const prev = prevStatuses.current[id];
        const curr = val.status;

        // Skip first load (don't fire notifications for existing data)
        if (!initialized.current) {
          prevStatuses.current[id] = curr;
          return;
        }

        if (prev && prev !== curr) {
          const msg = statusMessages[curr];
          if (msg) {
            // Toast notification
            if (curr === "completed") {
              toast.success(msg.title, { description: msg.desc(val), duration: 6000 });
            } else if (curr === "cancelled") {
              toast.error(msg.title, { description: msg.desc(val), duration: 6000 });
            } else {
              toast.info(msg.title, { description: msg.desc(val), duration: 5000 });
            }

            // Sound
            playNotificationSound();

            // Vibration
            if (curr === "completed") {
              vibrateDevice([100, 50, 100, 50, 200]);
            } else if (curr === "cancelled") {
              vibrateDevice([300]);
            } else {
              vibrateDevice([100, 50, 100]);
            }

            // Voice announcement for important events
            if (curr === "accepted" || curr === "completed") {
              speakNotification(msg.desc(val));
            }

            // Browser notification (if permitted)
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(msg.title, {
                body: msg.desc(val),
                icon: "/favicon.ico",
                tag: `booking-${id}-${curr}`,
              });
            }
          }

          // Rider-specific: new available orders
          if (isRider && curr === "pending" && !val.driverId) {
            toast.info("🆕 New order available!", {
              description: `${val.pickup} → ${val.drop} · ₹${val.price}`,
              duration: 8000,
            });
            playNotificationSound();
            vibrateDevice([200, 100, 200]);
          }
        }

        prevStatuses.current[id] = curr;
      });

      initialized.current = true;
    });

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => unsub();
  }, [user, userProfile?.role]);
};
