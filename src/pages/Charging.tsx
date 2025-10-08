import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Zap } from "lucide-react";

// --- STEP 1: Import Firebase services ---
import { auth, db } from "../firebase-config.js"; // Corrected the import path
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, increment, collection } from "firebase/firestore"; // Added 'collection'

const Charging = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [kwhDelivered, setKwhDelivered] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  // --- STEP 2: Set up real-time listeners for the charging session ---
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("User not found, redirecting.");
      navigate("/auth");
      return;
    }

    // Create a unique ID for this charging session
    const newSessionID = doc(collection(db, "chargingSessions")).id;
    setSessionID(newSessionID);
    const sessionDocRef = doc(db, "chargingSessions", newSessionID);
    const userDocRef = doc(db, "users", currentUser.uid);

    let lastKwhReading = 0;

    // Start the charging session in the database
    const startSession = async () => {
      try {
        await setDoc(sessionDocRef, {
          userId: currentUser.uid,
          status: "active",
          stopCharging: false,
          kwhConsumed: 0,
          startedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to start session:", error);
        toast.error("Could not start charging session.");
        navigate("/dashboard");
      }
    };

    startSession();

    // Listener 1: Watch the session document for updates from the ESP
    const unsubscribeSession = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newKwh = data.kwhConsumed || 0;
        setKwhDelivered(newKwh);

        // Calculate the difference since the last reading
        const kwhDifference = newKwh - lastKwhReading;
        lastKwhReading = newKwh;

        // Decrement user's balance by the amount used since last update
        if (kwhDifference > 0) {
          updateDoc(userDocRef, {
            prepaidBalance_kWh: increment(-kwhDifference)
          }).catch(err => console.error("Failed to decrement balance:", err));
        }

        if (data.status === 'completed' || data.status === 'stopped') {
            setIsComplete(true);
            toast.success("Charging Complete! ⚡");
        }
      }
    });

    // Listener 2: Watch the user's balance to stop charging if it hits zero
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            const currentBalance = userData.prepaidBalance_kWh || 0;
            setUserBalance(currentBalance);
            if (currentBalance <= 0 && !isComplete) { // prevent multiple updates
                updateDoc(sessionDocRef, { stopCharging: true, status: 'completed' });
            }
        }
    });

    // Cleanup function to stop listeners when the component unmounts
    return () => {
      unsubscribeSession();
      unsubscribeUser();
    };
  }, [navigate, isComplete]); // Added isComplete to dependencies

  const handleStopCharging = async () => {
    if (sessionID) {
      const sessionDocRef = doc(db, "chargingSessions", sessionID);
      await updateDoc(sessionDocRef, { status: "stopped", stopCharging: true });
      toast.info("Charging stopped");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-elevated gradient-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">
            {isComplete ? "Charging Complete ⚡" : "Charging in progress..."}
          </h2>
          <Zap className="w-8 h-8 text-primary fill-primary animate-pulse" />
        </div>

        <div className="space-y-6">
          {/* We can add a progress bar back later based on kWh delivered vs. starting balance */}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">kWh delivered</p>
              <p className="text-2xl font-bold text-foreground">
                {kwhDelivered.toFixed(2)}
              </p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Remaining Balance</p>
              <p className="text-2xl font-bold text-foreground">{userBalance.toFixed(2)}</p>
            </div>
          </div>
          
          {/* We can add back time elapsed later if needed */}

          {isComplete ? (
            <Button
              variant="action"
              size="lg"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={handleStopCharging}
            >
              Stop Charging
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Charging;

