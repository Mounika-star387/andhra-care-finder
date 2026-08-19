import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type State = "unsupported" | "ready" | "listening" | "processing" | "error";

export function VoiceSearch({
  onResult,
  onTranscript,
}: {
  onResult: (text: string) => void;
  onTranscript?: (text: string) => void;
}) {
  const [state, setState] = useState<State>("ready");
  const [message, setMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setState("unsupported");
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      setMessage(text);
      onTranscript?.(text);
      if (event.results[event.results.length - 1].isFinal) {
        setState("processing");
        onResult(text.trim());
        setTimeout(() => setState("ready"), 700);
      }
    };
    rec.onerror = (e: any) => {
      setState("error");
      setMessage(
        e?.error === "not-allowed"
          ? "Microphone permission denied. You can still type your search."
          : "Voice recognition failed. Please try again or type your search.",
      );
    };
    rec.onend = () => setState((s) => (s === "listening" ? "ready" : s));
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, [onResult, onTranscript]);

  if (state === "unsupported") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MicOff className="size-4 text-destructive" aria-hidden />
        <span>Voice search isn&apos;t supported in this browser — please type your search.</span>
      </div>
    );
  }

  const listening = state === "listening";

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="lg"
        variant={listening ? "destructive" : "secondary"}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : "Start voice search"}
        className={cn("gap-2 rounded-full", listening && "pulse-emergency")}
        onClick={() => {
          const rec = recognitionRef.current;
          if (!rec) return;
          if (listening) {
            rec.stop();
            setState("ready");
            return;
          }
          setMessage(null);
          try {
            rec.start();
            setState("listening");
          } catch {
            setState("error");
            setMessage("Could not start the microphone.");
          }
        }}
      >
        {state === "processing" ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Mic className={cn("size-5", listening ? "" : "text-info")} aria-hidden />
        )}
        {listening ? "Listening… tap to stop" : state === "processing" ? "Processing…" : "Voice search"}
      </Button>
      {message ? (
        <p
          className={cn(
            "text-xs",
            state === "error" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {state === "error" ? message : `Heard: “${message}”`}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Try: “Find emergency hospitals within 5 kilometers”
        </p>
      )}
    </div>
  );
}
