import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "../components/BottomNav.jsx"; // Using relative path
import { LogOut } from "lucide-react";
import { auth, db } from "../firebase-config.js"; // Using relative path
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

interface UserData {
  name: string;
  prepaidBalance_kWh: number;
}

const CHARGER_ID = "ENERGION-001"; // The charger we are interacting with

const Dashboard = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentBattery, setCurrentBattery] = useState(30); // Default value
  const [chargePercent, setChargePercent] = useState([30]);
  const [planType, setPlanType] = useState<"prepaid" | "payg">("prepaid");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // --- Listener for user data (name, balance) ---
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userDocRef = doc(db, "users", currentUser.uid);

    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data() as UserData);
      }
    });
    return () => unsubscribeUser();
  }, []);
  
  // --- NEW: Listener for charger data (live battery %) ---
  useEffect(() => {
    const chargerDocRef = doc(db, "chargers", CHARGER_ID);
    const unsubscribeCharger = onSnapshot(chargerDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const battery = data.currentBatteryPercent || 30;
            setCurrentBattery(battery);
            // Update slider position only if it's below the new battery level
            if (chargePercent[0] < battery) {
                setChargePercent([battery]);
            }
        }
    });
    return () => unsubscribeCharger();
  }, [chargePercent]); // Rerun if chargePercent changes

  const handleLogout = () => {
    signOut(auth);
    // The main App.jsx listener will handle the redirect
  };

  const handlePayAsYouGo = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        toast.error("You must be logged in to start charging.");
        return;
    }
    const costPerKWh = 10;
    const chargeToAdd = chargePercent[0] - currentBattery;
    if (chargeToAdd <= 0) {
        toast.info("Select a target charge level greater than the current level.");
        return;
    }
    // Simple estimation: 1% battery ~ 0.5 kWh for a standard EV
    const estimatedKwh = chargeToAdd * 0.5; 
    const estimatedCost = Math.round(estimatedKwh * costPerKWh);

    setIsProcessing(true);
    try {
        const orderResponse = await fetch("/api/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: estimatedCost,
                userId: currentUser.uid,
            }),
        });
        const orderData = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderData.error);
        
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: "INR",
            name: "Energion Charge (PayG)",
            description: `Charge up to ${chargePercent[0]}%`,
            order_id: orderData.id,
            handler: async function (response) {
                // For PayG, we don't need to verify on the backend to add credits.
                // The verification would happen when the session ends to confirm final cost.
                // For now, we just proceed to charging.
                toast.success("Payment successful! Starting charge...");
                navigate("/charging", { state: { chargePercent: chargePercent[0], initialBattery: currentBattery, plan: 'payg' } });
            },
            prefill: {
                email: currentUser.email || "",
            },
            theme: {
                color: "#F59E0B",
            },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (error) {
        console.error("PayG Payment failed:", error);
        toast.error(error.message || "An error occurred during payment.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleStartPrepaidCharging = () => {
      if (user && user.prepaidBalance_kWh > 0) {
          navigate("/charging", { state: { initialBattery: currentBattery, plan: 'prepaid' } });
      } else {
          toast.error("Your prepaid balance is empty.", {
              description: "Please recharge your account to start charging.",
              action: {
                  label: "Recharge",
                  onClick: () => navigate("/plans"),
              },
          });
      }
  };

  const costPerKWh = 10;
  const chargeToAdd = chargePercent[0] - currentBattery;
  const estimatedKwh = chargeToAdd * 0.5;
  const estimatedCost = Math.round(estimatedKwh * costPerKWh);

  if (!user) return <div className="text-center p-8">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Energion</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <Card className="p-6 shadow-card gradient-card mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Hi {user.name} 👋
          </h2>

          <Tabs value={planType} onValueChange={(v) => setPlanType(v as "prepaid" | "payg")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="prepaid">Prepaid Plan</TabsTrigger>
              <TabsTrigger value="payg">Pay as you go</TabsTrigger>
            </TabsList>

            <TabsContent value="prepaid" className="space-y-4">
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Remaining Balance</p>
                <p className="text-2xl font-bold text-primary">{user.prepaidBalance_kWh.toFixed(2)} kWh</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg" onClick={() => navigate("/plans")}>
                  Recharge
                </Button>
                <Button variant="action" size="lg" onClick={handleStartPrepaidCharging}>
                  Start Charging
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payg" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Connected Car's Battery</p>
                  <p className="text-3xl font-bold text-foreground">{currentBattery}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Target Charge Level
                  </label>
                  <Slider
                    value={chargePercent}
                    onValueChange={(value) => {
                      if (value[0] >= currentBattery) {
                        setChargePercent(value);
                      }
                    }}
                    min={0} max={100} step={5} className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0%</span>
                    <span className="text-primary font-semibold">{chargePercent[0]}%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    {chargeToAdd > 0 ? `You will be charged for ~${estimatedKwh.toFixed(1)} kWh` : "Select a target"}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{estimatedCost > 0 ? estimatedCost : '0'}
                  </p>
                </div>
                <Button
                  variant="action" size="lg" className="w-full"
                  onClick={handlePayAsYouGo} disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Proceed to Pay & Start Charging'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;

